import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, Container, Spinner, Badge, ProgressBar } from "react-bootstrap";
import { Link } from "react-router-dom";
import Chart from "react-apexcharts";
import { getWellnessDashboard } from "../../api/corporateWellnessApi";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { Modal, Form, Button, InputGroup } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import {
  IconActivity, IconUsers, IconHeartRateMonitor, IconTrendingUp,
  IconChevronRight, IconTrophy, IconBuildingCommunity, IconCalendarEvent,
  IconEye, IconEyeOff
} from "@tabler/icons-react";

export default function CorporateDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ companyName: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const handleCreateCorporate = async () => {
    if (!formData.companyName || !formData.email || !formData.password) {
      Swal.fire("Error", "All fields are required", "error");
      return;
    }
    setSaving(true);
    try {
      // Create corporate HR via our new backend API
      // Since it's admin doing it, we need to pass creatorId. The backend handles finding it from context or we pass it.
      const creatorId = user?.userId || user?.id;
      if (!creatorId) {
        throw new Error("Could not identify your admin user ID.");
      }
      await api.post(`/users/corporate-hr?creatorId=${creatorId}`, formData);
      Swal.fire("Success", "Corporate HR Account created! They can now log in at /corporate-login", "success");
      setShowCreateModal(false);
      setFormData({ companyName: "", email: "", password: "" });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Failed to create account", "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const hrUserId = user?.userId || user?.id;
        const result = await getWellnessDashboard(hrUserId);
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    })();
  }, []);

  const trendChart = useMemo(() => {
    if (!data?.wellnessScoreTrend) return null;
    return {
      options: {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: "smooth", width: 2 },
        colors: ["#0ea5e9"],
        fill: { gradient: { shadeIntensity: 0.2, opacityFrom: 0.4, opacityTo: 0 } },
        xaxis: { categories: data.wellnessScoreTrend.map((d) => d.month), labels: { style: { fontSize: "11px" } } },
        yaxis: { labels: { style: { fontSize: "11px" } }, min: 60, max: 85 },
        grid: { borderColor: "#eef2f2" },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (v) => `${v} pts` } },
      },
      series: [{ name: "Wellness Score", data: data.wellnessScoreTrend.map((d) => d.score) }],
    };
  }, [data]);

  const deptChart = useMemo(() => {
    if (!data?.departmentBreakdown) return null;
    const sorted = [...data.departmentBreakdown].sort((a, b) => b.avgScore - a.avgScore);
    return {
      options: {
        chart: { toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: "60%" } },
        dataLabels: { enabled: true, formatter: (v) => `${v}` },
        colors: ["#6366f1"],
        grid: { borderColor: "#eef2f2" },
        xaxis: { categories: sorted.map((d) => d.dept), labels: { style: { fontSize: "11px" } } },
        yaxis: { labels: { style: { fontSize: "11px" } } },
      },
      series: [{ name: "Avg Score", data: sorted.map((d) => d.avgScore) }],
    };
  }, [data]);

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

  const d = data || {};
  const topDept = [...(d.departmentBreakdown || [])].sort((a, b) => b.avgScore - a.avgScore)[0];

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-1">Corporate Wellness</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item active">Employee Wellness Dashboard</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex gap-2">
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
                  <IconBuildingCommunity size={16} /> Create Corporate Account
                </button>
              )}
              <Link to="bmi" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                <IconHeartRateMonitor size={16} /> BMI Tracking
              </Link>
              <Link to="challenges" className="btn btn-outline-success btn-sm d-flex align-items-center gap-1">
                <IconTrophy size={16} /> Challenges
              </Link>
              <Link to="reports" className="btn btn-outline-info btn-sm d-flex align-items-center gap-1">
                <IconTrendingUp size={16} /> Reports
              </Link>
            </div>
          </div>

          {/* ── Row 1: Key Metrics ── */}
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <Card className="border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" }}>
                <Card.Body className="p-4 text-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-white-50 text-uppercase fw-bold small">Total Employees</h6>
                    <IconUsers size={24} className="text-white-50" />
                  </div>
                  <h2 className="fw-bold mb-1">{d.totalEmployees?.toLocaleString() || 0}</h2>
                  <p className="mb-0 text-white-50 small">{topDept?.dept || "All"} departments active</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={3}>
              <Card className="border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                <Card.Body className="p-4 text-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-white-50 text-uppercase fw-bold small">Active Participants</h6>
                    <IconActivity size={24} className="text-white-50" />
                  </div>
                  <h2 className="fw-bold mb-1">{d.activeParticipants?.toLocaleString() || 0}</h2>
                  <p className="mb-0 text-white-50 small">{d.engagementRate || 0}% engagement rate</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={3}>
              <Card className="border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}>
                <Card.Body className="p-4 text-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-white-50 text-uppercase fw-bold small">Wellness Score</h6>
                    <IconHeartRateMonitor size={24} className="text-white-50" />
                  </div>
                  <h2 className="fw-bold mb-1">{d.avgWellnessScore || 0}<small style={{ fontSize: 16 }}>/100</small></h2>
                  <ProgressBar now={d.avgWellnessScore || 0} variant="light" className="mt-2" style={{ height: 6 }} />
                  <p className="mb-0 text-white-50 small mt-2">Overall health index</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={3}>
              <Card className="border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
                <Card.Body className="p-4 text-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-white-50 text-uppercase fw-bold small">Active Challenges</h6>
                    <IconTrophy size={24} className="text-white-50" />
                  </div>
                  <h2 className="fw-bold mb-1">{d.upcomingChallenges?.length || 0}</h2>
                  <p className="mb-0 text-white-50 small">
                    {d.upcomingChallenges?.reduce((s, c) => s + c.participants, 0) || 0} total participants
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Row 2: Charts ── */}
          <Row className="g-3 mb-4">
            <Col xl={8}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0">Wellness Score Trend</h6>
                </Card.Header>
                <Card.Body className="pt-0">
                  {trendChart && <Chart options={trendChart.options} series={trendChart.series} height={260} type="area" />}
                </Card.Body>
              </Card>
            </Col>
            <Col xl={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0">Department Rankings</h6>
                </Card.Header>
                <Card.Body className="pt-0">
                  {deptChart && <Chart options={deptChart.options} series={deptChart.series} height={260} type="bar" />}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Row 3: Department Breakdown + Upcoming Challenges ── */}
          <Row className="g-3">
            <Col xl={7}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0"><IconBuildingCommunity size={16} className="me-1" /> Department Participation</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <div className="d-flex flex-column gap-2">
                    {(d.departmentBreakdown || []).map((dept, i) => (
                      <div key={dept.dept} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: i % 2 === 0 ? "rgba(99,102,241,0.04)" : "transparent" }}>
                        <div style={{ flex: 1 }}>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="fw-semibold small">{dept.dept}</span>
                            <span className="text-muted small">{dept.participants}/{dept.employees} · {dept.avgScore} pts</span>
                          </div>
                          <ProgressBar now={(dept.participants / dept.employees) * 100} variant="primary" style={{ height: 6 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0"><IconCalendarEvent size={16} className="me-1" /> Upcoming Challenges</h6>
                  <Link to="challenges" className="small text-decoration-none">View all <IconChevronRight size={14} /></Link>
                </Card.Header>
                <Card.Body className="pt-2">
                  <div className="d-flex flex-column gap-2">
                    {(d.upcomingChallenges || []).map((ch) => (
                      <div key={ch.id} className="d-flex align-items-center justify-content-between p-3 rounded-3 border">
                        <div>
                          <h6 className="fw-bold mb-1">{ch.name}</h6>
                          <span className="text-muted small">{ch.participants} participants · {new Date(ch.startDate).toLocaleDateString()}</span>
                        </div>
                        <Badge bg={ch.id === 1 ? "success" : ch.id === 3 ? "primary" : "warning"} className="small">
                          {ch.id === 1 ? "Active" : ch.id === 3 ? "Active" : "Upcoming"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold" style={{ fontSize: 18 }}>Create Corporate Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">Create a dedicated portal login for a Corporate HR Manager. They will use these credentials to log in at <code>/corporate-login</code>.</p>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">Company Name</Form.Label>
            <Form.Control type="text" placeholder="e.g. Google India" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">HR Email</Form.Label>
            <Form.Control type="email" placeholder="hr@google.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted">Password</Form.Label>
            <InputGroup>
              <Form.Control 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter password" 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
              />
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ borderLeft: 0, borderColor: '#dee2e6' }}
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </Button>
            </InputGroup>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateCorporate} disabled={saving}>{saving ? "Creating..." : "Create Account"}</Button>
        </Modal.Footer>
      </Modal>

    </main>
  );
}
