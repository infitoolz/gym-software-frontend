import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Card, Col, Row } from "react-bootstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { IconCalendarEvent, IconHome } from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";
import { getMyWorkoutSchedule } from "../../api/scheduleApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { getWorkoutEventColor, normalizeUserWorkoutSchedule } from "./scheduleUtils";

export default function MySchedule() {
  const { hasPermission, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Personal schedule belongs to members only; send staff/admins home.
  const isMember = String(user?.role || "").toUpperCase() === "USER";
  const canView = hasPermission("my-schedule", "view");

  useEffect(() => {
    if (!canView || !isMember) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMyWorkoutSchedule();
        setRows((Array.isArray(data) ? data : []).map(normalizeUserWorkoutSchedule).filter(Boolean));
      } catch (err) {
        setRows([]);
        setError(extractApiErrorMessage(err, "Failed to load your schedule"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canView, isMember]);

  const calendarEvents = useMemo(() => rows.map((item) => ({
    id: String(item.id),
    title: item.title,
    start: item.startDateTime,
    end: item.endDateTime,
    backgroundColor: getWorkoutEventColor(item),
    borderColor: getWorkoutEventColor(item),
  })), [rows]);

  const nextSession = useMemo(() => {
    const now = new Date().getTime();
    return [...rows]
      .filter((item) => item.startDateTime)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      .find((item) => new Date(item.startDateTime).getTime() >= now) || rows[0] || null;
  }, [rows]);

  if (!isMember) {
    return <Navigate to="/" replace />;
  }

  if (!canView) {
    return <div className="content"><div className="alert alert-danger">You do not have permission to view this page.</div></div>;
  }

  return (
    <div className="page-wrapper users-page-wrapper">
      <div className="content">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="mb-1">My Schedule</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                <li className="breadcrumb-item active">My Schedule</li>
              </ol>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="card"><div className="card-body text-center py-5">Loading...</div></div>
        ) : rows.length === 0 ? (
          <div className="alert alert-info">No workout schedule has been assigned to you yet.</div>
        ) : (
          <Row className="g-3">
            <Col xl={8}>
              <Card>
                <Card.Body>
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
                    editable={false}
                    selectable={false}
                    events={calendarEvents}
                    height="auto"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col xl={4}>
              <Row className="g-3">
                <Col xs={12}>
                  <Card>
                    <Card.Body>
                      <h5 className="mb-3">Next Session</h5>
                      {nextSession ? (
                        <div>
                          <div className="fw-semibold mb-1">{nextSession.title}</div>
                          <div className="text-muted small">{nextSession.startDateTime}</div>
                          <div className="text-muted small">{nextSession.endDateTime}</div>
                          <div className="mt-2 small">Trainer: {nextSession.trainer?.name || "-"}</div>
                          <div className="small">Plan: {nextSession.workoutPlan?.name || "-"}</div>
                          <div className="small">Type: {nextSession.workoutType?.name || "-"}</div>
                        </div>
                      ) : (
                        <div className="text-muted">No upcoming workout sessions.</div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12}>
                  <Card>
                    <Card.Body>
                      <h5 className="mb-3">Workout Details</h5>
                      {rows.slice(0, 3).map((item) => (
                        <div key={item.id} className="border-bottom pb-3 mb-3">
                          <div className="fw-semibold">{item.title}</div>
                          <div className="small text-muted">{item.repeatType || "None"} | {item.location || "-"}</div>
                          <div className="small">Status: {item.completionStatus || "PENDING"}</div>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
}
