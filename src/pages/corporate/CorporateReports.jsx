import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, Container, Spinner, Badge, ProgressBar, Table, Form } from "react-bootstrap";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import { getCorporateReports } from "../../api/corporateWellnessApi";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  IconTrendingUp, IconUsers, IconHeartRateMonitor,
  IconChevronRight, IconTrophy, IconAlertTriangle, IconCheck, IconBuildingCommunity
} from "@tabler/icons-react";

export default function CorporateReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [corporateList, setCorporateList] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const { user, auth } = useAuth();
  const currentUser = user || auth;
  
  const isCorporateHr = currentUser?.role === "CORPORATE_HR";
  const basePath = isCorporateHr ? "/hr-portal" : "/corporate";

  // Fetch available corporate partners for Admin view
  useEffect(() => {
    if (!isCorporateHr) {
      const requesterId = currentUser?.userId || currentUser?.id;
      if (requesterId) {
        api.get(`/users/corporate-hr?requesterId=${requesterId}`)
          .then((res) => setCorporateList(res.data?.data || []))
          .catch(() => setCorporateList([]));
      }
    }
  }, [isCorporateHr, currentUser]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const hrUserId = isCorporateHr
          ? (currentUser?.userId || currentUser?.id)
          : (selectedCompanyId || undefined);

        const result = await getCorporateReports(hrUserId);
        setData(result);
      } catch (err) {
        console.error("Failed to load corporate reports", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, isCorporateHr, selectedCompanyId]);

  const trendChart = useMemo(() => {
    if (!data?.monthlyTrend) return null;
    return {
      options: {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: "smooth", width: 2 },
        colors: ["#6366f1", "#10b981"],
        fill: { gradient: { shadeIntensity: 0.2, opacityFrom: 0.3, opacityTo: 0 } },
        xaxis: { categories: data.monthlyTrend.map((d) => d.month), labels: { style: { fontSize: "11px" } } },
        yaxis: { labels: { style: { fontSize: "11px" } } },
        grid: { borderColor: "#eef2f2" },
        dataLabels: { enabled: false },
        tooltip: { shared: true },
      },
      series: [
        { name: "Participants", data: data.monthlyTrend.map((d) => d.participants) },
        { name: "Avg Score", data: data.monthlyTrend.map((d) => d.avgScore) },
      ],
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

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-1">Wellness Reports</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={basePath}>Corporate Wellness</Link></li>
                  <li className="breadcrumb-item active">Reports</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex align-items-center gap-2">
              {!isCorporateHr && corporateList.length > 0 && (
                <Form.Select
                  size="sm"
                  style={{ width: "220px" }}
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  <option value="">All Corporate Partners</option>
                  {corporateList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </Form.Select>
              )}
              <Link to={basePath} className="btn btn-outline-primary btn-sm">Back to Dashboard</Link>
            </div>
          </div>

          {/* ── Row 1: Overall score + Challenge stats ── */}
          <Row className="g-3 mb-4">
            <Col sm={6} lg={3}>
              <Card className="border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}>
                <Card.Body className="p-4 text-white d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="text-white-50 text-uppercase fw-bold small mb-0">Overall Wellness</h6>
                      <IconHeartRateMonitor size={22} className="text-white-50" />
                    </div>
                    <div className="d-flex align-items-baseline gap-2 mt-2">
                      <h1 className="fw-bold mb-0">{d.overallWellness?.score || 0}</h1>
                      <span className="text-white-50" style={{ fontSize: "14px" }}>/ 100</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-top" style={{ borderColor: "rgba(255, 255, 255, 0.15)" }}>
                    <span className="badge rounded-pill bg-white text-primary px-2 py-1 small fw-semibold">
                      {d.overallWellness?.change || "0"}
                    </span>
                    <span className="text-white-50 small ms-2">from last month</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3"
                        style={{ width: 34, height: 34, background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}
                      >
                        <IconTrophy size={18} />
                      </div>
                      <h6 className="fw-bold mb-0">Challenge Stats</h6>
                    </div>
                    <div className="d-flex align-items-baseline gap-2 mt-2">
                      <h2 className="fw-bold mb-0">{d.challengeStats?.total || 0}</h2>
                      <small className="text-muted">Total challenges</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-1 flex-wrap mt-3 pt-2 border-top" style={{ borderColor: "rgba(0, 0, 0, 0.06)" }}>
                    <span
                      className="badge d-inline-flex align-items-center gap-1"
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        color: "#059669",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "3px 7px",
                        borderRadius: "6px",
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                      {d.challengeStats?.completed || 0} Completed
                    </span>
                    <span
                      className="badge d-inline-flex align-items-center gap-1"
                      style={{
                        background: "rgba(245, 158, 11, 0.1)",
                        color: "#d97706",
                        border: "1px solid rgba(245, 158, 11, 0.25)",
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "3px 7px",
                        borderRadius: "6px",
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                      {d.challengeStats?.active || 0} Active
                    </span>
                    <span
                      className="badge d-inline-flex align-items-center gap-1"
                      style={{
                        background: "rgba(14, 165, 233, 0.1)",
                        color: "#0284c7",
                        border: "1px solid rgba(14, 165, 233, 0.25)",
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "3px 7px",
                        borderRadius: "6px",
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", display: "inline-block" }} />
                      {d.challengeStats?.upcoming || 0} Upcoming
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3"
                        style={{ width: 34, height: 34, background: "rgba(0, 102, 255, 0.1)", color: "#0066ff" }}
                      >
                        <IconUsers size={18} />
                      </div>
                      <h6 className="fw-bold mb-0">Total Participants</h6>
                    </div>
                    <div className="d-flex align-items-baseline gap-2 mt-2">
                      <h2 className="fw-bold mb-0">{(d.challengeStats?.totalParticipants || 0).toLocaleString()}</h2>
                      <small className="text-muted">Enrolled</small>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-top" style={{ borderColor: "rgba(0, 0, 0, 0.06)" }}>
                    <small className="text-muted">Across all wellness challenges</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3"
                        style={{ width: 34, height: 34, background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}
                      >
                        <IconCheck size={18} />
                      </div>
                      <h6 className="fw-bold mb-0">Avg Completion</h6>
                    </div>
                    <div className="d-flex align-items-baseline gap-2 mt-2">
                      <h2 className="fw-bold mb-0">{d.challengeStats?.avgCompletionRate || 0}%</h2>
                      <small className="text-muted">Completion rate</small>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-top" style={{ borderColor: "rgba(0, 0, 0, 0.06)" }}>
                    <ProgressBar now={d.challengeStats?.avgCompletionRate || 0} variant="success" style={{ height: 6, borderRadius: 3 }} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Row 2: Monthly Trend Chart ── */}
          <Row className="g-3 mb-4">
            <Col md={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0">Monthly Participation & Score Trend</h6>
                </Card.Header>
                <Card.Body className="pt-0">
                  {trendChart && <Chart options={trendChart.options} series={trendChart.series} height={280} type="area" />}
                </Card.Body>
              </Card>
            </Col>
            <Col md={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0">Health Metrics Summary</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <div className="d-flex flex-column gap-3">
                    <MetricRow label="Avg BMI" value={d.healthMetrics?.avgBmi?.toFixed(1) || "—"} sub={`${d.healthMetrics?.normalBmiPct || 0}% normal`} color="primary" />
                    <MetricRow label="Avg Steps/Day" value={(d.healthMetrics?.avgStepsPerDay || 0).toLocaleString()} sub="Target: 10,000" color="success" />
                    <MetricRow label="Water Intake" value={`${d.healthMetrics?.avgWaterGlasses || 0} glasses`} sub="Target: 8 glasses" color="info" />
                    <MetricRow label="Sleep" value={`${d.healthMetrics?.avgSleepHours || 0} hrs`} sub="Target: 7-9 hrs" color="purple" />
                    <MetricRow label="Exercise" value={`${d.healthMetrics?.avgExerciseMinutes || 0} min`} sub="Per day" color="warning" />
                    <MetricRow label="Stress Level" value={d.healthMetrics?.stressLevel || "—"} sub="Self-reported" color="danger" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Row 3: Department Rankings ── */}
          <Row className="g-3 mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0"><IconTrendingUp size={16} className="me-1" /> Department Wellness Rankings</h6>
                </Card.Header>
                <Card.Body className="pt-0">
                  <Table hover className="mb-0 align-middle" size="sm">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Department</th>
                        <th>Wellness Score</th>
                        <th>Participation %</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.departmentRankings || [])
                        .sort((a, b) => b.score - a.score)
                        .map((dept, i) => (
                          <tr key={dept.dept}>
                            <td className="fw-bold">{i + 1}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="d-flex align-items-center justify-content-center rounded-circle bg-light" style={{ width: 30, height: 30, fontWeight: 700, fontSize: 12 }}>
                                  {dept.dept.charAt(0)}
                                </div>
                                {dept.dept}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <ProgressBar now={dept.score} variant={dept.score >= 75 ? "success" : dept.score >= 60 ? "warning" : "danger"} style={{ width: 100, height: 8 }} />
                                <span className="fw-semibold small">{dept.score}</span>
                              </div>
                            </td>
                            <td><Badge bg="light" text="dark">{dept.participation}%</Badge></td>
                            <td>
                              <span className={`small ${dept.change?.startsWith("+") ? "text-success" : dept.change?.startsWith("-") ? "text-danger" : "text-muted"}`}>
                                {dept.change} pts
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </main>
  );
}

function MetricRow({ label, value, sub, color }) {
  const colors = {
    primary: "#6366f1",
    success: "#10b981",
    info: "#0ea5e9",
    purple: "#8b5cf6",
    warning: "#f59e0b",
    danger: "#ef4444",
  };
  const c = colors[color] || "#6366f1";
  return (
    <div className="d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center gap-2">
        <div style={{ width: 3, height: 28, borderRadius: 2, background: c }} />
        <div>
          <div className="fw-semibold small">{label}</div>
          <div className="text-muted" style={{ fontSize: 10 }}>{sub}</div>
        </div>
      </div>
      <span className="fw-bold small">{value}</span>
    </div>
  );
}
