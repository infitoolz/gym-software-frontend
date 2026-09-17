import React, { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Col, Container, Row, Table, Spinner } from "react-bootstrap";
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconClock,
  IconRefresh,
  IconSend,
  IconUsers,
} from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";
import { getExpiringMembers } from "../../api/membershipApi";
import Footer from "../../components/Footer";

const EXPIRY_FILTERS = [
  { days: 3, label: "3 Days", color: "danger", bg: "rgba(220,53,69,0.08)" },
  { days: 7, label: "7 Days", color: "warning", bg: "rgba(255,193,7,0.10)" },
  { days: 15, label: "15 Days", color: "info", bg: "rgba(13,202,240,0.08)" },
  { days: 30, label: "30 Days", color: "success", bg: "rgba(25,135,84,0.08)" },
];

/** Build the WhatsApp deep-link with a pre-filled renewal message */
function buildWhatsAppUrl(member, expiryDate) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || "Member";
  const phone = (member.phone || "").replace(/\D/g, ""); // digits only
  const formattedDate = expiryDate
    ? new Date(expiryDate + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "soon";
  const planName = member.membershipPlan || "your current plan";

  const message = encodeURIComponent(
    `Hi ${name},\n\nYour *${planName}* membership expires on *${formattedDate}*. ` +
      `Renew now and get a *10% discount*!\n\n` +
      `Visit us at the gym or reply here to renew. Don't lose your fitness streak! 💪\n\n` +
      `— FitNexus Team`
  );

  if (!phone) return null;
  // WhatsApp API — works for both mobile and desktop
  return `https://wa.me/${phone.startsWith("91") ? "" : "91"}${phone}?text=${message}`;
}

/** Friendly days-remaining badge */
function DaysLeft({ expiry }) {
  if (!expiry) return <span className="text-muted">—</span>;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry + "T00:00:00");
  const diff = Math.round((exp - today) / 86400000);

  if (diff < 0) return <Badge bg="danger">Expired {Math.abs(diff)}d ago</Badge>;
  if (diff === 0) return <Badge bg="danger">Expires Today</Badge>;
  if (diff <= 3) return <Badge bg="danger">{diff}d left</Badge>;
  if (diff <= 7) return <Badge bg="warning" text="dark">{diff}d left</Badge>;
  if (diff <= 15) return <Badge bg="info">{diff}d left</Badge>;
  return <Badge bg="success">{diff}d left</Badge>;
}

export default function RenewalManagement() {
  const { user } = useAuth();
  const requesterId = user?.userId ?? user?.id;

  const [selectedDays, setSelectedDays] = useState(30);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentSet, setSentSet] = useState(new Set());

  const fetchMembers = useCallback(
    async (days) => {
      if (!requesterId) return;
      setLoading(true);
      setError("");
      try {
        const data = await getExpiringMembers(days, requesterId);
        setMembers(data);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load expiring members.");
      } finally {
        setLoading(false);
      }
    },
    [requesterId]
  );

  useEffect(() => {
    fetchMembers(selectedDays);
  }, [selectedDays, fetchMembers]);

  const handleFilterClick = (days) => {
    setSelectedDays(days);
  };

  const handleSendWhatsApp = (member) => {
    const url = buildWhatsAppUrl(member, member.membershipExpiry);
    if (!url) {
      alert(`No phone number on file for ${member.firstName || "this member"}.`);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setSentSet((prev) => new Set([...prev, member.id]));
  };

  const handleBulkWhatsApp = () => {
    const toSend = members.filter((m) => m.phone);
    if (toSend.length === 0) {
      alert("No members with phone numbers found in this list.");
      return;
    }
    // Open WhatsApp for each (browsers block popups after first, so open sequentially)
    toSend.forEach((m, i) => {
      setTimeout(() => {
        const url = buildWhatsAppUrl(m, m.membershipExpiry);
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
          setSentSet((prev) => new Set([...prev, m.id]));
        }
      }, i * 800);
    });
  };

  const currentFilter = EXPIRY_FILTERS.find((f) => f.days === selectedDays) || EXPIRY_FILTERS[3];
  const countsByDays = {};
  EXPIRY_FILTERS.forEach((f) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + f.days);
    countsByDays[f.days] = members.filter((m) => {
      if (!m.membershipExpiry) return false;
      const exp = new Date(m.membershipExpiry + "T00:00:00");
      return exp >= today && exp <= cutoff;
    }).length;
  });

  const withPhone = members.filter((m) => m.phone).length;
  const withoutPhone = members.length - withPhone;

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* ── Header ── */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h3 className="fw-bold mb-1">
                <IconAlertTriangle size={26} className="text-warning me-2" />
                Renewal Management
              </h3>
              <p className="text-muted mb-0 small">
                Track expiring memberships and send WhatsApp reminders in one click.
              </p>
            </div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => fetchMembers(selectedDays)}
              disabled={loading}
            >
              <IconRefresh size={16} className="me-1" />
              Refresh
            </Button>
          </div>

          {/* ── Summary Stats ── */}
          <Row className="g-3 mb-4">
            {EXPIRY_FILTERS.map((f) => {
              const isActive = f.days === selectedDays;
              return (
                <Col key={f.days} xs={6} md={3}>
                  <Card
                    className={`border-0 shadow-sm h-100 cursor-pointer`}
                    style={{
                      background: isActive ? f.bg : "#fff",
                      border: isActive
                        ? `2px solid var(--bs-${f.color})`
                        : "1px solid #e9ecef",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => handleFilterClick(f.days)}
                  >
                    <Card.Body className="p-3 text-center">
                      <div
                        className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2`}
                        style={{
                          width: 48,
                          height: 48,
                          background: `var(--bs-${f.color}-bg-subtle, ${f.bg})`,
                        }}
                      >
                        <IconClock size={22} className={`text-${f.color}`} />
                      </div>
                      <h2
                        className={`fw-bold mb-0 ${isActive ? `text-${f.color}` : "text-dark"}`}
                      >
                        {loading && isActive ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          countsByDays[f.days] ?? "—"
                        )}
                      </h2>
                      <p className="text-muted small mb-0 mt-1">Expiring in {f.label}</p>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* ── Filter Pills ── */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="text-muted small fw-semibold me-1">Filter:</span>
                {EXPIRY_FILTERS.map((f) => (
                  <button
                    key={f.days}
                    type="button"
                    className={`btn btn-sm fw-semibold px-4 py-2 rounded-pill ${
                      selectedDays === f.days
                        ? `btn-${f.color} shadow-sm`
                        : `btn-outline-${f.color}`
                    }`}
                    style={{ transition: "all 0.2s" }}
                    onClick={() => handleFilterClick(f.days)}
                  >
                    <IconClock size={14} className="me-1" />
                    {f.label}
                  </button>
                ))}
                <div className="ms-auto d-flex gap-2">
                  <span className="text-muted small align-self-center">
                    <IconUsers size={14} className="me-1" />
                    {members.length} members · {withPhone} with phone
                  </span>
                  {members.length > 0 && withPhone > 0 && (
                    <Button
                      variant="success"
                      size="sm"
                      className="d-flex align-items-center gap-1 fw-semibold"
                      onClick={handleBulkWhatsApp}
                    >
                      <IconBrandWhatsapp size={16} />
                      Send to All ({withPhone})
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* ── WhatsApp Message Preview ── */}
          <Card className="border-0 shadow-sm mb-4" style={{ borderLeft: "4px solid #25d366" }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: 44, height: 44, background: "#25d366" }}
                >
                  <IconBrandWhatsapp size={24} color="#fff" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0">Auto WhatsApp Message Template</h6>
                  <small className="text-muted">Sent to each member with a registered phone number</small>
                </div>
              </div>
              <div
                className="p-3 rounded-3"
                style={{
                  background: "#dcf8c6",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.9rem",
                  whiteSpace: "pre-line",
                  maxWidth: 480,
                  borderRadius: "0 12px 12px 12px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                }}
              >
                {"Hi [Member Name],\n\nYour *[Plan Name]* membership expires on *[Expiry Date]*. Renew now and get a *10% discount*!\n\nVisit us at the gym or reply here to renew. Don't lose your fitness streak! 💪\n\n— FitNexus Team"}
              </div>
            </Card.Body>
          </Card>

          {/* ── Member Table ── */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom d-flex align-items-center justify-content-between py-3 px-4">
              <h5 className="fw-bold mb-0">
                Members Expiring in{" "}
                <span className={`text-${currentFilter.color}`}>{currentFilter.label}</span>
                <Badge
                  bg={currentFilter.color}
                  className="ms-2"
                  pill
                >
                  {members.length}
                </Badge>
              </h5>
              {withoutPhone > 0 && (
                <small className="text-muted">
                  ⚠ {withoutPhone} member{withoutPhone > 1 ? "s" : ""} without phone
                </small>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              {error && (
                <div className="alert alert-danger m-3">{error}</div>
              )}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-3 mb-0">Loading expiring members…</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-5">
                  <IconCalendarEvent size={48} className="text-muted mb-3" />
                  <h6 className="text-muted fw-semibold">
                    No memberships expiring in {currentFilter.label}
                  </h6>
                  <p className="text-muted small mb-0">
                    Great! All members have renewals beyond this window.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead style={{ background: "#f8f9fa" }}>
                      <tr>
                        <th className="px-4 py-3">Member</th>
                        <th className="py-3">Phone</th>
                        <th className="py-3">Plan</th>
                        <th className="py-3">Expiry Date</th>
                        <th className="py-3">Days Left</th>
                        <th className="py-3 text-end px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => {
                        const name =
                          [m.firstName, m.lastName].filter(Boolean).join(" ") ||
                          m.email ||
                          "—";
                        const waUrl = buildWhatsAppUrl(m, m.membershipExpiry);
                        const sent = sentSet.has(m.id);
                        const expiryFormatted = m.membershipExpiry
                          ? new Date(m.membershipExpiry + "T00:00:00").toLocaleDateString(
                              "en-IN",
                              { day: "2-digit", month: "short", year: "numeric" }
                            )
                          : "—";

                        return (
                          <tr key={m.id}>
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                                  style={{
                                    width: 38,
                                    height: 38,
                                    minWidth: 38,
                                    background: `hsl(${(m.id * 57) % 360}, 65%, 55%)`,
                                    fontSize: 14,
                                  }}
                                >
                                  {name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-semibold">{name}</div>
                                  <small className="text-muted">{m.email}</small>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              {m.phone ? (
                                <span className="fw-semibold">{m.phone}</span>
                              ) : (
                                <span className="text-muted small fst-italic">No phone</span>
                              )}
                            </td>
                            <td className="py-3">
                              <Badge bg="secondary" className="fw-semibold">
                                {m.membershipPlan || "BASIC"}
                              </Badge>
                            </td>
                            <td className="py-3 fw-semibold">{expiryFormatted}</td>
                            <td className="py-3">
                              <DaysLeft expiry={m.membershipExpiry} />
                            </td>
                            <td className="py-3 text-end px-4">
                              {waUrl ? (
                                <Button
                                  size="sm"
                                  variant={sent ? "outline-success" : "success"}
                                  className="d-inline-flex align-items-center gap-1 fw-semibold"
                                  style={{
                                    background: sent ? undefined : "#25d366",
                                    borderColor: "#25d366",
                                    color: sent ? "#25d366" : "#fff",
                                    transition: "all 0.2s",
                                  }}
                                  onClick={() => handleSendWhatsApp(m)}
                                  title="Send WhatsApp reminder"
                                >
                                  {sent ? (
                                    <>
                                      <IconSend size={14} /> Sent
                                    </>
                                  ) : (
                                    <>
                                      <IconBrandWhatsapp size={14} /> Send
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <span className="text-muted small fst-italic">No phone</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
      <Footer />
    </main>
  );
}
