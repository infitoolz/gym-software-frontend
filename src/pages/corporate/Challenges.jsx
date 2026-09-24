import React, { useEffect, useState } from "react";
import { Row, Col, Card, Container, Spinner, Badge, Button, ProgressBar, Modal, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getChallenges, createChallenge, joinChallenge } from "../../api/corporateWellnessApi";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import {
  IconTrophy, IconUsers, IconCalendarEvent, IconTarget,
  IconPlayerPlay, IconCheck, IconMedal, IconPlus
} from "@tabler/icons-react";

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "STEPS",
    description: "",
    goal: 100000,
    unit: "steps",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    maxParticipants: 100,
  });

  const { user, auth } = useAuth();
  const currentUser = user || auth;

  const basePath = currentUser?.role === "CORPORATE_HR" ? "/hr-portal" : "/corporate";

  const fetchChallengesList = async () => {
    try {
      const hrUserId = currentUser?.userId || currentUser?.id || localStorage.getItem("userId");
      const result = await getChallenges(hrUserId);
      setChallenges(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengesList();
  }, [currentUser]);

  const handleOpenCreateModal = () => {
    setFormData({
      name: "",
      type: "STEPS",
      description: "",
      goal: 100000,
      unit: "steps",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      maxParticipants: 100,
    });
    setShowCreateModal(true);
  };

  const handleTypeChange = (type) => {
    let unit = "steps";
    let goal = 100000;
    if (type === "WEIGHT_LOSS") {
      unit = "% body weight";
      goal = 5;
    } else if (type === "HYDRATION") {
      unit = "glasses";
      goal = 200;
    } else if (type === "MINDFULNESS") {
      unit = "minutes";
      goal = 300;
    }
    setFormData({ ...formData, type, unit, goal });
  };

  const handleSaveChallenge = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      Swal.fire("Error", "Please fill in all required fields", "error");
      return;
    }

    setSaving(true);
    try {
      const hrUserId = currentUser?.userId || currentUser?.id || localStorage.getItem("userId");
      await createChallenge(formData, hrUserId);
      Swal.fire("Success", "Wellness challenge created successfully!", "success");
      setShowCreateModal(false);
      fetchChallengesList();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Failed to create challenge", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (challengeId) => {
    try {
      const employeeId = currentUser?.userId || currentUser?.id || localStorage.getItem("userId");
      const res = await joinChallenge(challengeId, employeeId);
      Swal.fire("Success", res.message || "You have joined the challenge!", "success");
      fetchChallengesList();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Failed to join challenge", "error");
    }
  };

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
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h2 className="mb-1">Wellness Challenges</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={basePath}>Corporate Wellness</Link></li>
                  <li className="breadcrumb-item active">Challenges</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex gap-2">
              <Button variant="primary" size="sm" className="d-flex align-items-center gap-1 shadow-sm" onClick={handleOpenCreateModal}>
                <IconPlus size={16} /> Create Challenge
              </Button>
              <Link to={basePath} className="btn btn-outline-primary btn-sm">Back to Dashboard</Link>
            </div>
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
                  <h3 className="fw-bold mb-0">{challenges.reduce((s, c) => s + (c.participants || 0), 0)}</h3>
                  <small>Total Participants</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {challenges.length === 0 ? (
            <Card className="border-0 shadow-sm text-center p-5">
              <div className="py-4">
                <IconTrophy size={48} className="text-muted mb-3" />
                <h5 className="fw-bold">No Wellness Challenges Yet</h5>
                <p className="text-muted small">Launch friendly team competitions like 10,000 Step Sprints or Weight Loss challenges to boost engagement.</p>
                <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="mt-2">
                  <IconPlus size={16} className="me-1" /> Create First Challenge
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Active challenges */}
              {active.length > 0 && (
                <>
                  <h5 className="fw-bold mb-3"><IconPlayerPlay size={18} className="me-1 text-success" /> Active Challenges</h5>
                  <Row className="g-3 mb-4">
                    {active.map((ch) => (
                      <ChallengeCard
                        key={ch.id}
                        ch={ch}
                        expanded={expanded === ch.id}
                        onToggle={() => setExpanded(expanded === ch.id ? null : ch.id)}
                        onJoin={() => handleJoin(ch.id)}
                      />
                    ))}
                  </Row>
                </>
              )}

              {/* Upcoming challenges */}
              {upcoming.length > 0 && (
                <>
                  <h5 className="fw-bold mb-3"><IconCalendarEvent size={18} className="me-1 text-warning" /> Upcoming Challenges</h5>
                  <Row className="g-3 mb-4">
                    {upcoming.map((ch) => (
                      <ChallengeCard
                        key={ch.id}
                        ch={ch}
                        expanded={expanded === ch.id}
                        onToggle={() => setExpanded(expanded === ch.id ? null : ch.id)}
                        onJoin={() => handleJoin(ch.id)}
                      />
                    ))}
                  </Row>
                </>
              )}

              {/* Completed challenges */}
              {completed.length > 0 && (
                <>
                  <h5 className="fw-bold mb-3"><IconCheck size={18} className="me-1 text-primary" /> Completed Challenges</h5>
                  <Row className="g-3">
                    {completed.map((ch) => (
                      <ChallengeCard
                        key={ch.id}
                        ch={ch}
                        expanded={expanded === ch.id}
                        onToggle={() => setExpanded(expanded === ch.id ? null : ch.id)}
                        onJoin={() => handleJoin(ch.id)}
                      />
                    ))}
                  </Row>
                </>
              )}
            </>
          )}

          {/* Create Challenge Modal */}
          <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title className="h5 fw-bold">Create Wellness Challenge</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSaveChallenge}>
              <Modal.Body className="p-4">
                <div className="row g-3">
                  <div className="col-12">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Challenge Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Q3 10,000 Step Sprint"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Challenge Type</Form.Label>
                      <Form.Select
                        value={formData.type}
                        onChange={(e) => handleTypeChange(e.target.value)}
                      >
                        <option value="STEPS">👟 Steps Challenge</option>
                        <option value="WEIGHT_LOSS">⚖️ Weight Loss</option>
                        <option value="HYDRATION">💧 Hydration Intake</option>
                        <option value="MINDFULNESS">🧘 Mindfulness / Meditation</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Goal & Unit *</Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="number"
                          value={formData.goal}
                          onChange={(e) => setFormData({ ...formData, goal: Number(e.target.value) })}
                          required
                        />
                        <span className="input-group-text small">{formData.unit}</span>
                      </div>
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">End Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-12">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Max Participants</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-12">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Explain rules, guidelines, or daily targets..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="border-0 pt-0">
                <Button variant="light" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? <Spinner size="sm" animation="border" /> : "Launch Challenge"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </Container>
      </div>
    </main>
  );
}

function ChallengeCard({ ch, expanded, onToggle, onJoin }) {
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

  const max = ch.maxParticipants || 100;
  const count = ch.participants || 0;
  const pct = Math.min(100, Math.round((count / max) * 100));

  return (
    <Col md={6} lg={4}>
      <Card className={`border-0 shadow-sm h-100 ${!isActive ? "opacity-75" : ""}`}>
        <Card.Body className="p-4 d-flex flex-column justify-content-between">
          <div>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 44,
                    height: 44,
                    background: `${typeColors[ch.type] || "#6c757d"}15`,
                    color: typeColors[ch.type] || "#6c757d",
                    fontSize: 20,
                  }}
                >
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
              <span>
                <IconCalendarEvent size={14} className="me-1" />
                {new Date(ch.startDate).toLocaleDateString()} — {new Date(ch.endDate).toLocaleDateString()}
              </span>
              <span>
                <IconUsers size={14} className="me-1" />
                {count}/{max}
              </span>
            </div>

            {ch.goal && (
              <div className="small mb-2">
                <span className="fw-semibold">Goal:</span> {ch.goal?.toLocaleString()} {ch.unit}
              </div>
            )}

            {/* Participants bar */}
            <ProgressBar
              now={pct}
              variant={isActive ? "success" : "warning"}
              style={{ height: 6 }}
              className="mb-3"
            />
          </div>

          <div>
            <div className="d-flex gap-2">
              {isActive && (
                <Button variant="primary" size="sm" className="d-flex align-items-center gap-1" onClick={onToggle}>
                  <IconMedal size={14} /> {expanded ? "Hide" : "Leaderboard"}
                </Button>
              )}
              {isActive && (
                <Button variant="outline-primary" size="sm" className="d-flex align-items-center gap-1" onClick={onJoin}>
                  <IconUsers size={14} /> Join
                </Button>
              )}
            </div>

            {/* Leaderboard */}
            {expanded && (
              <div className="mt-3 pt-3 border-top">
                <h6 className="fw-bold small mb-2">
                  <IconTrophy size={14} className="me-1 text-warning" /> Leaderboard
                </h6>
                {(!ch.leaderboard || ch.leaderboard.length === 0) ? (
                  <div className="text-muted small py-2">No participants yet. Click Join to enter!</div>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    {ch.leaderboard.map((e) => (
                      <div key={e.rank} className="d-flex align-items-center justify-content-between p-1 rounded small">
                        <div className="d-flex align-items-center gap-2">
                          <span className={`fw-bold ${e.rank <= 3 ? "text-warning" : "text-muted"}`}>#{e.rank}</span>
                          <span>{e.name}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold">{e.completion}%</span>
                          <ProgressBar now={e.completion || 0} variant="success" style={{ width: 50, height: 5 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}
