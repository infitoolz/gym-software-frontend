import React, { useEffect, useState } from "react";
import { Row, Col, Card, Container, Spinner, Badge, Button, ProgressBar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getChallenges } from "../../api/corporateWellnessApi";
import { useAuth } from "../../context/AuthContext";
import {
  IconTrophy, IconChevronRight, IconUsers, IconCalendarEvent, IconTarget,
  IconPlayerPlay, IconCheck, IconMedal
} from "@tabler/icons-react";

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const { auth } = useAuth();
  
  const basePath = auth?.role === 'CORPORATE_HR' ? '/hr-portal' : '/corporate';

  useEffect(() => {
    (async () => {
      try {
        const hrUserId = auth?.userId || auth?.id;
        const result = await getChallenges(hrUserId);
        setChallenges(Array.isArray(result) ? result : []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    })();
  }, []);

  const active = challenges.filter((c) => c.status === "ACTIVE");
  const upcoming = challenges.filter((c) => c.status === "UPCOMING");
  const completed = challenges.filter((c) => c.status === "COMPLETED");

  if (loading) {
    return (
      <main className="themebody-wrap">
        <div className="theme-body">
          <Container fluid>
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          </Container>
        </div>
      </main>
    );
  }

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-1">Wellness Challenges</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={basePath}>Corporate Wellness</Link></li>
                  <li className="breadcrumb-item active">Challenges</li>
                </ol>
              </nav>
            </div>
            <Link to={basePath} className="btn btn-outline-primary btn-sm">Back to Dashboard</Link>
          </div>

          {/* Summary cards */}
          <Row className="g-3 mb-4">
            <Col sm={4}>
              <Card className="border-0 shadow-sm text-center bg-success text-white">
                <Card.Body className="p-3">
                  <h3 className="fw-bold mb-0">{active.length}</h3>
                  <small>Active Challenges</small>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4}>
              <Card className="border-0 shadow-sm text-center bg-warning text-white">
                <Card.Body className="p-3">
                  <h3 className="fw-bold mb-0">{upcoming.length}</h3>
                  <small>Upcoming</small>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4}>
              <Card className="border-0 shadow-sm text-center bg-info text-white">
                <Card.Body className="p-3">
                  <h3 className="fw-bold mb-0">{challenges.reduce((s, c) => s + c.participants, 0)}</h3>
                  <small>Total Participants</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Active challenges */}
          {active.length > 0 && (
            <>
              <h5 className="fw-bold mb-3"><IconPlayerPlay size={18} className="me-1 text-success" /> Active Challenges</h5>
              <Row className="g-3 mb-4">
                {active.map((ch) => <ChallengeCard key={ch.id} ch={ch} expanded={expanded === ch.id} onToggle={() => setExpanded(expanded === ch.id ? null : ch.id)} />)}
              </Row>
            </>
          )}

          {/* Upcoming challenges */}
          {upcoming.length > 0 && (
            <>
              <h5 className="fw-bold mb-3"><IconCalendarEvent size={18} className="me-1 text-warning" /> Upcoming Challenges</h5>
              <Row className="g-3 mb-4">
                {upcoming.map((ch) => <ChallengeCard key={ch.id} ch={ch} expanded={expanded === ch.id} onToggle={() => setExpanded(expanded === ch.id ? null : ch.id)} />)}
              </Row>
            </>
          )}

          {/* Completed challenges */}
          {completed.length > 0 && (
            <>
              <h5 className="fw-bold mb-3"><IconCheck size={18} className="me-1 text-primary" /> Completed Challenges</h5>
              <Row className="g-3">
                {completed.map((ch) => <ChallengeCard key={ch.id} ch={ch} expanded={expanded === ch.id} onToggle={() => setExpanded(expanded === ch.id ? null : ch.id)} />)}
              </Row>
            </>
          )}
        </Container>
      </div>
    </main>
  );
}

function ChallengeCard({ ch, expanded, onToggle }) {
  const isActive = ch.status === "ACTIVE";
  const typeColors = {
    STEPS: "#6366f1",
    WEIGHT_LOSS: "#10b981",
    HYDRATION: "#0ea5e9",
    MINDFULNESS: "#8b5cf6",
  };
  const typeIcons = {
    STEPS: "👟",
    WEIGHT_LOSS: "⚖️",
    HYDRATION: "💧",
    MINDFULNESS: "🧘",
  };

  return (
    <Col md={6} lg={4}>
      <Card className={`border-0 shadow-sm h-100 ${!isActive ? "opacity-75" : ""}`}>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 44, height: 44, background: `${typeColors[ch.type] || "#6c757d"}15`, color: typeColors[ch.type] || "#6c757d", fontSize: 20 }}>
                {typeIcons[ch.type] || "🏆"}
              </div>
              <div>
                <h6 className="fw-bold mb-0">{ch.name}</h6>
                <Badge bg={isActive ? "success" : "warning"} text={isActive ? "white" : "dark"} className="small">
                  {isActive ? "Active" : "Upcoming"}
                </Badge>
              </div>
            </div>
            <IconTarget size={20} className="text-muted" />
          </div>

          <p className="small text-muted mb-2">{ch.description}</p>

          <div className="d-flex justify-content-between small text-muted mb-2">
            <span><IconCalendarEvent size={14} className="me-1" />
              {new Date(ch.startDate).toLocaleDateString()} — {new Date(ch.endDate).toLocaleDateString()}
            </span>
            <span><IconUsers size={14} className="me-1" />{ch.participants}/{ch.maxParticipants}</span>
          </div>

          {ch.goal && (
            <div className="small mb-2">
              <span className="fw-semibold">Goal:</span> {ch.goal?.toLocaleString()} {ch.unit}
            </div>
          )}

          {/* Participants bar */}
          <ProgressBar
            now={(ch.participants / ch.maxParticipants) * 100}
            variant={isActive ? "success" : "warning"}
            style={{ height: 6 }}
            className="mb-3"
          />

          <div className="d-flex gap-2">
            {isActive && (
              <Button variant="primary" size="sm" className="d-flex align-items-center gap-1" onClick={onToggle}>
                <IconMedal size={14} /> {expanded ? "Hide" : "Leaderboard"}
              </Button>
            )}
            <Button variant="outline-primary" size="sm" className="d-flex align-items-center gap-1">
              <IconUsers size={14} /> Join
            </Button>
          </div>

          {/* Leaderboard */}
          {expanded && ch.leaderboard?.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <h6 className="fw-bold small mb-2"><IconTrophy size={14} className="me-1 text-warning" /> Leaderboard</h6>
              <div className="d-flex flex-column gap-1">
                {ch.leaderboard.map((e) => (
                  <div key={e.rank} className="d-flex align-items-center justify-content-between p-1 rounded small">
                    <div className="d-flex align-items-center gap-2">
                      <span className={`fw-bold ${e.rank <= 3 ? "text-warning" : "text-muted"}`}>#{e.rank}</span>
                      <span>{e.name}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-semibold">
                        {ch.type === "STEPS" ? `${e.steps?.toLocaleString()} steps` :
                         ch.type === "WEIGHT_LOSS" ? `${e.loss}%` :
                         ch.type === "HYDRATION" ? `${e.glasses} glasses` :
                         `${e.completion}%`}
                      </span>
                      <ProgressBar now={e.completion || 0} variant="success" style={{ width: 50, height: 5 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
}
