import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Row, Col, Table, Button, Form } from "react-bootstrap";
import Select from "react-select";
import { IconHome, IconFingerprint, IconDoorEnter, IconDoorExit, IconScan, IconClock, IconInfinity, IconCalendarTime, IconAlertTriangle, IconArrowBigUpLines, IconX } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { getAllAttendance, getMyAttendance, manualCheckIn, enrollFingerprint, selfCheckIn, getEnrollableMembers } from "../../api/attendanceApi";
import { getMembershipPlans } from "../../api/membershipPlansApi";
import { getMemberMembership, assignMembership, getMyMembership, getPlanChangeRequests, dismissPlanChangeRequest } from "../../api/membershipApi";
import GateOverlay from "./GateOverlay";

const fmtTime = (v) => (v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--");
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "--");
// Local calendar date (YYYY-MM-DD). Must not use toISOString(), which returns the UTC
// date and can be a day off from the server-local attendanceDate, making the default
// "today" filter show nothing.
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Attendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const isStaff = role !== "USER";

  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState(todayStr());

  const [decision, setDecision] = useState(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [scanning, setScanning] = useState(false);

  const [enrollMember, setEnrollMember] = useState("");
  const [enrollValue, setEnrollValue] = useState("");
  const [enrollMsg, setEnrollMsg] = useState("");
  const [showGate, setShowGate] = useState(false);
  const [selfBusy, setSelfBusy] = useState(false);

  // Plan + timing assignment (staff) and the member's own plan/timing.
  const [plans, setPlans] = useState([]);
  const [assignMemberId, setAssignMemberId] = useState("");
  const [assignPlanId, setAssignPlanId] = useState("");
  const [assignStart, setAssignStart] = useState("06:00");
  const [assignEnd, setAssignEnd] = useState("10:00");
  const [assignMsg, setAssignMsg] = useState("");
  const [assignErr, setAssignErr] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [myMembership, setMyMembership] = useState(null);
  const [requests, setRequests] = useState([]); // pending plan-upgrade requests (staff)
  const requestedPlanRef = useRef(null); // plan the admin is approving, so it wins over the member's current plan

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const data = isStaff ? await getAllAttendance(dateFilter || undefined) : await getMyAttendance();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecords([]);
      setError(extractApiErrorMessage(err, "Failed to load attendance"));
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!isStaff) return;
    try {
      // All active members (resolved from the JWT on the backend) — any staff can enroll any member.
      const data = await getEnrollableMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    }
  };

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  const loadRequests = async () => {
    try {
      setRequests(await getPlanChangeRequests());
    } catch {
      setRequests([]);
    }
  };

  // Staff load active plans for the assignment dropdown + pending upgrade requests;
  // members load their own plan/timing.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (isStaff) {
          const data = await getMembershipPlans({ activeOnly: true });
          if (mounted) setPlans(Array.isArray(data) ? data : []);
          if (mounted) await loadRequests();
        } else {
          const mine = await getMyMembership();
          if (mounted) setMyMembership(mine);
        }
      } catch {
        /* non-blocking */
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  // When staff pick a member to assign, prefill from their current membership — unless
  // they're approving a request, in which case the requested plan wins.
  useEffect(() => {
    if (!isStaff || !assignMemberId) return;
    let mounted = true;
    (async () => {
      try {
        const m = await getMemberMembership(assignMemberId);
        if (!mounted) return;
        if (requestedPlanRef.current) {
          setAssignPlanId(requestedPlanRef.current);
          requestedPlanRef.current = null;
          if (m?.accessStartTime) setAssignStart(m.accessStartTime);
          if (m?.accessEndTime) setAssignEnd(m.accessEndTime);
        } else if (m) {
          if (m.planId) setAssignPlanId(String(m.planId));
          if (m.accessStartTime) setAssignStart(m.accessStartTime);
          if (m.accessEndTime) setAssignEnd(m.accessEndTime);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignMemberId, isStaff]);

  // Approve a request. An unlimited plan (e.g. Premium) needs no check-in window, so we
  // assign it in one click. A time-restricted plan (Basic/Standard) still needs a daily
  // window, so we prefill the panel below and let staff set it before saving.
  const applyRequest = async (r) => {
    setAssignErr("");
    setAssignMsg("");
    const requestedPlan = plans.find((p) => String(p.id) === String(r.requestedPlanId)) || null;

    if (requestedPlan?.unlimitedAccess) {
      setAssignBusy(true);
      try {
        const res = await assignMembership(r.memberId, {
          planId: Number(r.requestedPlanId),
          accessStartTime: null,
          accessEndTime: null,
        });
        setAssignMsg(`Assigned ${res?.planName || requestedPlan.name || "plan"} to ${r.memberName} — unlimited access.`);
        await loadRequests(); // the resolved request drops off the pending list
      } catch (err) {
        setAssignErr(extractApiErrorMessage(err, "Could not assign membership"));
      } finally {
        setAssignBusy(false);
      }
      return;
    }

    // Time-restricted plan: prefill the assign panel so staff can set the check-in window.
    requestedPlanRef.current = r.requestedPlanId ? String(r.requestedPlanId) : null;
    setAssignMemberId(String(r.memberId));
    if (r.requestedPlanId) setAssignPlanId(String(r.requestedPlanId));
    document.getElementById("assign-plan-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDismissRequest = async (id) => {
    try {
      await dismissPlanChangeRequest(id);
      await loadRequests();
    } catch {
      /* ignore */
    }
  };

  const selectedAssignPlan = useMemo(
    () => plans.find((p) => String(p.id) === String(assignPlanId)) || null,
    [plans, assignPlanId],
  );
  const assignUnlimited = Boolean(selectedAssignPlan?.unlimitedAccess);

  const handleAssign = async () => {
    setAssignErr("");
    setAssignMsg("");
    if (!assignMemberId) return setAssignErr("Pick a member first");
    if (!assignPlanId) return setAssignErr("Pick a plan");
    if (!assignUnlimited && (!assignStart || !assignEnd)) return setAssignErr("Set the check-in window");
    if (!assignUnlimited && assignEnd <= assignStart) return setAssignErr("End time must be after start time");
    setAssignBusy(true);
    try {
      const payload = {
        planId: Number(assignPlanId),
        accessStartTime: assignUnlimited ? null : assignStart,
        accessEndTime: assignUnlimited ? null : assignEnd,
      };
      const res = await assignMembership(assignMemberId, payload);
      setAssignMsg(
        assignUnlimited
          ? `Assigned ${res?.planName || "plan"} — unlimited access.`
          : `Assigned ${res?.planName || "plan"} — check-in ${res?.accessStartTime}–${res?.accessEndTime}.`,
      );
      await loadRequests(); // a fulfilled request drops off the pending list
    } catch (err) {
      setAssignErr(extractApiErrorMessage(err, "Could not assign membership"));
    } finally {
      setAssignBusy(false);
    }
  };

  const handleScan = async () => {
    if (!selectedMember) return;
    setScanning(true);
    setDecision(null);
    try {
      const result = await manualCheckIn(selectedMember);
      setDecision(result);
      setShowGate(true);
      await loadRecords();
    } catch (err) {
      setDecision({ accessGranted: false, action: "DENIED", message: extractApiErrorMessage(err, "Check-in failed") });
    } finally {
      setScanning(false);
    }
  };

  // Member self check-in / check-out from the app (still subject to the plan time window).
  const handleSelf = async () => {
    setSelfBusy(true);
    setDecision(null);
    try {
      const result = await selfCheckIn();
      setDecision(result);
      await loadRecords();
    } catch (err) {
      setDecision({ accessGranted: false, action: "DENIED", message: extractApiErrorMessage(err, "Check-in failed") });
    } finally {
      setSelfBusy(false);
    }
  };

  const myOpen = useMemo(() => records.find((r) => r.status === "CHECKED_IN") || null, [records]);
  const myCheckedIn = Boolean(myOpen);

  // Searchable dropdown options (react-select filters by the label as you type).
  const memberOptions = useMemo(
    () => members.map((m) => ({ value: String(m.id), label: `${m.name}${m.email ? ` (${m.email})` : ""}` })),
    [members],
  );

  // Is the member chosen in the staff dropdown currently checked in (has an open record)?
  // Drives the hint + button label so staff know whether this records a check-in or check-out.
  const selectedOpen = useMemo(
    () => records.find((r) => String(r.userId) === String(selectedMember) && r.status === "CHECKED_IN") || null,
    [records, selectedMember],
  );


  const handleEnroll = async () => {
    if (!enrollMember) return;
    setEnrollMsg("");
    try {
      await enrollFingerprint(enrollMember, enrollValue.trim());
      setEnrollMsg("Fingerprint ID saved for this member.");
      setEnrollValue("");
    } catch (err) {
      setEnrollMsg(extractApiErrorMessage(err, "Could not save fingerprint ID"));
    }
  };

  const presentNow = useMemo(
    () => records.filter((r) => r.status === "CHECKED_IN").length,
    [records]
  );

  return (
    <div className="page-wrapper users-page-wrapper">
      <div className="content">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="mb-1">Attendance</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                <li className="breadcrumb-item active">Attendance</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => navigate("/attendance/kiosk")}>
              <IconScan size={16} className="me-1" /> Self-Service Kiosk
            </Button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {isStaff && (
          <Row className="g-3 mb-3">
            <Col md={4}>
              <Card className="bg-light-primary h-100">
                <CardBody>
                  <h6 className="text-muted mb-1">Currently in the gym</h6>
                  <h2 className="fw-bold mb-0">{presentNow}</h2>
                </CardBody>
              </Card>
            </Col>
            <Col md={8}>
              <Card className="h-100">
                <CardBody>
                  <h5 className="fw-bold mb-3"><IconFingerprint size={20} className="me-1" /> Check-in / Check-out</h5>
                  <div className="d-flex flex-wrap gap-2 align-items-end">
                    <div className="flex-grow-1" style={{ minWidth: 220 }}>
                      <label className="form-label">Member</label>
                      <Select
                        classNamePrefix="rselect"
                        placeholder="Search member..."
                        isClearable
                        options={memberOptions}
                        value={memberOptions.find((o) => o.value === String(selectedMember)) || null}
                        onChange={(opt) => setSelectedMember(opt ? opt.value : "")}
                      />
                    </div>
                    <Button variant={selectedOpen ? "warning" : "primary"} onClick={handleScan} disabled={!selectedMember || scanning}>
                      {scanning
                        ? "Recording..."
                        : selectedOpen
                          ? <><IconDoorExit size={16} className="me-1" /> Record Check-out</>
                          : <><IconDoorEnter size={16} className="me-1" /> Record Attendance</>}
                    </Button>
                  </div>

                  {selectedMember && (
                    <p className="small text-muted mt-2 mb-0">
                      {selectedOpen
                        ? `Currently checked in${selectedOpen.checkInTime ? ` since ${fmtTime(selectedOpen.checkInTime)}` : ""} — this will check them out.`
                        : "Not checked in — this will check them in."}
                    </p>
                  )}

                  {decision && (
                    <div className={`alert mt-3 mb-0 d-flex align-items-center gap-2 ${decision.accessGranted ? "alert-success" : "alert-danger"}`}>
                      {decision.action === "CHECK_IN" && <IconDoorEnter size={22} />}
                      {decision.action === "CHECK_OUT" && <IconDoorExit size={22} />}
                      <span>
                        <strong>{decision.accessGranted ? "Access Granted" : "Access Denied"}</strong> — {decision.message}
                        {decision.openGate ? " 🟢 Gate open." : ""}
                      </span>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}

        {isStaff && (
          <Card className="mb-3">
            <CardBody>
              <h6 className="fw-bold mb-2">Enroll fingerprint ID</h6>
              <p className="text-muted small mb-3">Link a member to the ID their finger is enrolled under on the terminal. The device sends this ID on a match.</p>
              <div className="d-flex flex-wrap gap-2 align-items-end">
                <div style={{ minWidth: 240 }}>
                  <label className="form-label">Member</label>
                  <Select
                    classNamePrefix="rselect"
                    placeholder="Search member..."
                    isClearable
                    options={memberOptions}
                    value={memberOptions.find((o) => o.value === String(enrollMember)) || null}
                    onChange={(opt) => setEnrollMember(opt ? opt.value : "")}
                  />
                </div>
                <div style={{ minWidth: 200 }}>
                  <label className="form-label">Fingerprint ID</label>
                  <Form.Control value={enrollValue} onChange={(e) => setEnrollValue(e.target.value)} placeholder="e.g. FP-1042" />
                </div>
                <Button variant="outline-primary" onClick={handleEnroll} disabled={!enrollMember}>Save</Button>
              </div>
              {enrollMsg && <div className="mt-2 small text-muted">{enrollMsg}</div>}
            </CardBody>
          </Card>
        )}

        {isStaff && requests.length > 0 && (
          <Card className="mb-3 border-warning">
            <CardBody>
              <h6 className="fw-bold mb-2 d-flex align-items-center gap-1">
                <IconArrowBigUpLines size={18} className="text-warning" /> Plan upgrade requests
                <span className="badge bg-warning text-dark ms-1">{requests.length}</span>
              </h6>
              <p className="text-muted small mb-3">
                Members asking to change plan. <strong>Approve</strong> assigns an unlimited plan (e.g. Premium)
                instantly; for a time-restricted plan it prefills the form below so you can set the check-in
                window. Their existing paid time is credited automatically.
              </p>
              <div className="d-flex flex-column gap-2">
                {requests.map((r) => (
                  <div key={r.id} className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 p-2">
                    <div className="min-w-0">
                      <div className="fw-semibold">{r.memberName} <span className="text-muted small">{r.memberEmail}</span></div>
                      <div className="small">
                        <span className="badge bg-secondary-subtle text-secondary-emphasis">{r.currentPlan}</span>
                        <span className="mx-1">→</span>
                        <span className="badge bg-primary">{r.requestedPlan}</span>
                        <span className="text-muted ms-2">{r.createdAt}</span>
                      </div>
                      {r.note && <div className="small text-muted mt-1">{r.note}</div>}
                    </div>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => applyRequest(r)}>Approve</Button>
                      <Button size="sm" variant="outline-secondary" onClick={() => handleDismissRequest(r.id)} title="Dismiss">
                        <IconX size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {isStaff && (
          <Card className="mb-3" id="assign-plan-panel">
            <CardBody>
              <h6 className="fw-bold mb-2"><IconCalendarTime size={18} className="me-1" /> Assign plan & check-in timing</h6>
              <p className="text-muted small mb-3">
                Put a member on a subscription plan and set the daily window they're allowed to check in.
                Unlimited plans let them come any time.
              </p>
              <div className="row g-2 align-items-end">
                <div className="col-md-4">
                  <label className="form-label">Member</label>
                  <Select
                    classNamePrefix="rselect"
                    placeholder="Search member..."
                    isClearable
                    options={memberOptions}
                    value={memberOptions.find((o) => o.value === String(assignMemberId)) || null}
                    onChange={(opt) => setAssignMemberId(opt ? opt.value : "")}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Plan</label>
                  <Form.Select value={assignPlanId} onChange={(e) => setAssignPlanId(e.target.value)}>
                    <option value="">Select plan...</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.unlimitedAccess ? " (Unlimited)" : ""}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                {assignUnlimited ? (
                  <div className="col-md-3">
                    <label className="form-label d-block">Access</label>
                    <span className="badge bg-success d-inline-flex align-items-center gap-1 py-2 px-3">
                      <IconInfinity size={16} /> Any time
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="col-md-2">
                      <label className="form-label">From</label>
                      <Form.Control type="time" value={assignStart} onChange={(e) => setAssignStart(e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">To</label>
                      <Form.Control type="time" value={assignEnd} onChange={(e) => setAssignEnd(e.target.value)} />
                    </div>
                  </>
                )}
                <div className="col-md-1">
                  <Button variant="primary" className="w-100" onClick={handleAssign} disabled={assignBusy || !assignMemberId}>
                    {assignBusy ? "..." : "Save"}
                  </Button>
                </div>
              </div>
              {assignErr && <div className="alert alert-danger mt-2 mb-0 py-2">{assignErr}</div>}
              {assignMsg && <div className="alert alert-success mt-2 mb-0 py-2">{assignMsg}</div>}
            </CardBody>
          </Card>
        )}

        {!isStaff && (
          <Card className="mb-3">
            <CardBody className="text-center py-4">
              <div className="mb-2">
                <span className={`badge ${myCheckedIn ? "bg-success" : "bg-secondary"}`}>
                  {myCheckedIn ? "You're in the gym" : "Not checked in"}
                </span>
              </div>
              <h4 className="fw-bold mb-1">{myCheckedIn ? "Checked in" : "Check in to the gym"}</h4>
              <p className="text-muted mb-3">
                {myCheckedIn
                  ? `Since ${fmtTime(myOpen.checkInTime)} today`
                  : "Check in at the entrance scanner, or tap below"}
              </p>
              {myMembership?.applicable && (
                <div className="mb-3 d-flex flex-wrap justify-content-center gap-2">
                  {myMembership.unlimitedAccess ? (
                    <span className="badge bg-success d-inline-flex align-items-center gap-1 py-2 px-3">
                      <IconInfinity size={16} /> {myMembership.planName || "Plan"} · check in any time
                    </span>
                  ) : myMembership.accessStartTime ? (
                    <span className="badge bg-info d-inline-flex align-items-center gap-1 py-2 px-3">
                      <IconClock size={16} /> {myMembership.planName || "Plan"} · check in {myMembership.accessStartTime}–{myMembership.accessEndTime}
                    </span>
                  ) : (
                    <span className="badge bg-light text-dark py-2 px-3">
                      {myMembership.planName || "Plan"} · no timing assigned yet
                    </span>
                  )}
                  {!myMembership.unlimitedAccess && myMembership.maxSessionMinutes > 0 && (
                    <span className="badge bg-light-warning text-dark d-inline-flex align-items-center gap-1 py-2 px-3">
                      <IconCalendarTime size={16} /> {myMembership.maxSessionMinutes} min per visit
                    </span>
                  )}
                </div>
              )}
              {myMembership?.applicable && !myMembership.unlimitedAccess && !myMembership.accessStartTime && (
                <div className="alert alert-warning d-flex align-items-center gap-2 mb-3 mx-auto text-start" style={{ maxWidth: 460 }}>
                  <IconAlertTriangle size={18} className="flex-shrink-0" />
                  <span>No check-in time slot is assigned to your plan yet. Please contact the gym admin to set up your timing.</span>
                </div>
              )}
              <Button variant={myCheckedIn ? "warning" : "primary"} onClick={handleSelf} disabled={selfBusy}>
                {selfBusy
                  ? "Recording..."
                  : myCheckedIn
                    ? <><IconDoorExit size={16} className="me-1" /> Check out</>
                    : <><IconDoorEnter size={16} className="me-1" /> Check in</>}
              </Button>
              {decision && (
                <div className={`alert mt-3 mb-0 ${decision.accessGranted ? "alert-success" : "alert-danger"}`}>
                  {decision.message}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h5 className="fw-bold mb-0">{isStaff ? "Attendance log" : "My attendance"}</h5>
              {isStaff && (
                <div className="d-flex align-items-center gap-2">
                  <label className="form-label mb-0">Date</label>
                  <Form.Control type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ width: 170 }} />
                  <Button variant="light" size="sm" onClick={() => setDateFilter("")}>All</Button>
                </div>
              )}
            </div>
            <div className="table-responsive">
              <Table className="mb-0 align-middle">
                <thead>
                  <tr>
                    {isStaff && <th>Member</th>}
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isStaff ? 6 : 5} className="text-center py-4">Loading...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={isStaff ? 6 : 5} className="text-center py-4">No attendance records.</td></tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id}>
                        {isStaff && (
                          <td>
                            <div className="fw-semibold">{r.memberName}</div>
                            <small className="text-muted">{r.memberEmail}</small>
                          </td>
                        )}
                        <td>{fmtDate(r.attendanceDate)}</td>
                        <td>{fmtTime(r.checkInTime)}</td>
                        <td>{fmtTime(r.checkOutTime)}</td>
                        <td><span className="badge bg-secondary-subtle text-secondary-emphasis">{r.method}</span></td>
                        <td>
                          <span className={`badge ${r.status === "CHECKED_IN" ? "bg-success" : "bg-secondary"}`}>
                            {r.status === "CHECKED_IN" ? "In gym" : "Checked out"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>

        {isStaff && (
          <Card className="mt-3">
            <CardBody>
              <h6 className="fw-bold mb-2">Hardware terminal integration</h6>
              <p className="text-muted small mb-2">
                Point your fingerprint terminal at this webhook. On a match it records check-in/out and the response
                tells the device whether to open the gate (<code>openGate: true</code>).
              </p>
              <pre className="bg-light p-3 rounded small mb-0" style={{ whiteSpace: "pre-wrap" }}>{`POST /api/attendance/checkin
Header: X-Device-Key: <your device key>
Body:   { "fingerprintId": "FP-1042", "deviceId": "GATE-1" }`}</pre>
            </CardBody>
          </Card>
        )}
      </div>

      <GateOverlay show={showGate} decision={decision} onClose={() => setShowGate(false)} />
    </div>
  );
}
