import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, Container, Spinner, Badge, ProgressBar } from "react-bootstrap";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import { getBmiData } from "../../api/corporateWellnessApi";
import { useAuth } from "../../context/AuthContext";
import {
  IconHeartRateMonitor, IconWeight, IconArrowUp,
  IconChevronRight, IconUsers, IconAlertTriangle
} from "@tabler/icons-react";

const BMI_CATEGORIES = {
  Underweight: { min: 0, max: 18.5, color: "#f59e0b", label: "Underweight" },
  Normal: { min: 18.5, max: 25, color: "#10b981", label: "Normal" },
  Overweight: { min: 25, max: 30, color: "#f97316", label: "Overweight" },
  Obese: { min: 30, max: 60, color: "#ef4444", label: "Obese" },
};

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function getBmiColor(bmi) {
  const cat = getBmiCategory(bmi);
  return BMI_CATEGORIES[cat]?.color || "#6c757d";
}

export default function BmiTracking() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth();
  
  const basePath = auth?.role === 'CORPORATE_HR' ? '/hr-portal' : '/corporate';

  useEffect(() => {
    (async () => {
      try {
        const hrUserId = auth?.userId || auth?.id;
        const result = await getBmiData(hrUserId);
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load BMI data", err);
        setError(err.message || "Failed to load data");
        setLoading(false);
      }
    })();
  }, []);

  // BMI history chart
  const bmiChart = useMemo(() => {
    if (!data?.history) return null;
    return {
      options: {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: "smooth", width: 2 },
        colors: ["#6366f1"],
        fill: { gradient: { shadeIntensity: 0.2, opacityFrom: 0.3, opacityTo: 0 } },
        annotations: {
          yaxis: [
            { y: 18.5, borderColor: "#10b981", label: { borderColor: "#10b981", style: { color: "#fff", background: "#10b981" }, text: "Normal" } },
            { y: 25, borderColor: "#f97316", label: { borderColor: "#f97316", style: { color: "#fff", background: "#f97316" }, text: "Overweight" } },
            { y: 30, borderColor: "#ef4444", label: { borderColor: "#ef4444", style: { color: "#fff", background: "#ef4444" }, text: "Obese" } },
          ],
        },
        xaxis: { categories: data.history.map((d) => new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" })), labels: { style: { fontSize: "11px" } } },
        yaxis: { min: 15, max: 35, labels: { style: { fontSize: "11px" } } },
        grid: { borderColor: "#eef2f2" },
        tooltip: { y: { formatter: (v) => v?.toFixed(1) } },
        dataLabels: { enabled: false },
      },
      series: [{ name: "BMI", data: data.history.map((d) => d.bmi) }],
    };
  }, [data]);

  // Weight chart
  const weightChart = useMemo(() => {
    if (!data?.history) return null;
    return {
      options: {
        chart: { toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: "smooth", width: 2 },
        colors: ["#f59e0b"],
        fill: { gradient: { shadeIntensity: 0.2, opacityFrom: 0.3, opacityTo: 0 } },
        xaxis: { categories: data.history.map((d) => new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" })), labels: { style: { fontSize: "11px" } } },
        yaxis: { labels: { style: { fontSize: "11px" } }, min: Math.max(60, Math.min(...data.history.map((d) => d.weight)) - 5) },
        grid: { borderColor: "#eef2f2" },
        tooltip: { y: { formatter: (v) => `${v} kg` } },
        dataLabels: { enabled: false },
      },
      series: [{ name: "Weight", data: data.history.map((d) => d.weight) }],
    };
  }, [data]);

  // Distribution donut
  const distChart = useMemo(() => {
    if (!data?.distribution) return null;
    return {
      options: {
        labels: data.distribution.map((d) => d.category),
        colors: [BMI_CATEGORIES.Underweight.color, BMI_CATEGORIES.Normal.color, BMI_CATEGORIES.Overweight.color, BMI_CATEGORIES.Obese.color],
        legend: { position: "bottom", fontSize: "11px" },
        dataLabels: { enabled: true, formatter: (v) => `${v.toFixed(0)}%` },
        stroke: { width: 0 },
        plotOptions: { pie: { donut: { size: "60%" } } },
      },
      series: data.distribution.map((d) => d.pct),
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

  if (error) {
    return (
      <main className="themebody-wrap">
        <div className="theme-body">
          <Container fluid>
            <div className="text-center py-5 text-danger">
              <IconAlertTriangle size={48} className="mb-3" />
              <h4>Error loading data</h4>
              <p>{error}</p>
            </div>
          </Container>
        </div>
      </main>
    );
  }

  const current = data?.current || {};
  const bmiColor = getBmiColor(current.bmi);
  const history = data?.history || [];
  const first = history[0];
  const last = history[history.length - 1];
  const bmiChange = first && last ? (last.bmi - first.bmi).toFixed(1) : 0;
  const weightChange = first && last ? (last.weight - first.weight).toFixed(1) : 0;

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-1">BMI Tracking</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={basePath}>Corporate Wellness</Link></li>
                  <li className="breadcrumb-item active">BMI Tracking</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex gap-2">
              <Link to={basePath} className="btn btn-outline-primary btn-sm">Back to Dashboard</Link>
            </div>
          </div>

          {/* ── Row 1: Current BMI + Stats ── */}
          <Row className="g-3 mb-4">
            <Col sm={6} lg={3}>
              <Card className="border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${bmiColor}` }}>
                <Card.Body className="text-center p-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: 80, height: 80, background: `${bmiColor}15`, color: bmiColor }}>
                    <IconHeartRateMonitor size={36} />
                  </div>
                  <h1 className="fw-bold mb-0" style={{ color: bmiColor }}>{current.bmi?.toFixed(1)}</h1>
                  <Badge bg="" style={{ background: bmiColor }} className="mt-2 px-3 py-1">
                    {current.category || "Normal"}
                  </Badge>
                  <p className="text-muted small mt-2 mb-0">Last updated: {current.lastUpdated ? new Date(current.lastUpdated).toLocaleDateString() : "—"}</p>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-2">
                    <IconWeight size={20} className="me-2 text-primary" />
                    <h6 className="fw-bold mb-0">Current Weight</h6>
                  </div>
                  <h2 className="fw-bold mb-0">{current.weight} <small className="text-muted" style={{ fontSize: 14 }}>kg</small></h2>
                  <span className={`small ${weightChange <= 0 ? "text-success" : "text-danger"}`}>
                    {weightChange <= 0 ? "▼" : "▲"} {Math.abs(weightChange)} kg overall
                  </span>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-2">
                    <IconArrowUp size={20} className={`me-2 ${bmiChange <= 0 ? "text-success" : "text-danger"}`} />
                    <h6 className="fw-bold mb-0">BMI Change</h6>
                  </div>
                  <h2 className={`fw-bold mb-0 ${bmiChange <= 0 ? "text-success" : "text-danger"}`}>
                    {bmiChange <= 0 ? "" : "+"}{bmiChange}
                  </h2>
                  <span className="small text-muted">Since {first ? new Date(first.date).toLocaleDateString("en", { month: "short" }) : "—"}</span>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-2">
                    <IconUsers size={20} className="me-2 text-purple" />
                    <h6 className="fw-bold mb-0">Normal BMI %</h6>
                  </div>
                  <h2 className="fw-bold mb-0 text-success">{data?.distribution?.find((d) => d.category === "Normal")?.pct || 0}%</h2>
                  <ProgressBar now={data?.distribution?.find((d) => d.category === "Normal")?.pct || 0} variant="success" className="mt-2" style={{ height: 6 }} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Row 2: Charts ── */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0">BMI History</h6>
                </Card.Header>
                <Card.Body className="pt-0">
                  {bmiChart && <Chart options={bmiChart.options} series={bmiChart.series} height={260} type="area" />}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0">Weight History</h6>
                </Card.Header>
                <Card.Body className="pt-0">
                  {weightChart && <Chart options={weightChart.options} series={weightChart.series} height={260} type="area" />}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Row 3: Distribution + History Table ── */}
          <Row className="g-3">
            <Col md={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0">BMI Distribution</h6>
                </Card.Header>
                <Card.Body className="pt-0">
                  {distChart && <Chart options={distChart.options} series={distChart.series} height={280} type="donut" />}
                </Card.Body>
              </Card>
            </Col>
            <Col md={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-transparent border-0 pb-0 pt-3">
                  <h6 className="fw-bold mb-0">BMI History Log</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflowY: "auto" }}>
                    {[...history].reverse().map((entry, i) => (
                      <div key={entry.date} className="d-flex align-items-center justify-content-between p-2 rounded-3"
                        style={{ background: i % 2 === 0 ? "rgba(99,102,241,0.04)" : "transparent" }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center justify-content-center rounded-circle"
                            style={{ width: 36, height: 36, background: `${getBmiColor(entry.bmi)}15`, color: getBmiColor(entry.bmi) }}>
                            <IconHeartRateMonitor size={16} />
                          </div>
                          <div>
                            <div className="fw-semibold small">{new Date(entry.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>Weight: {entry.weight} kg</div>
                          </div>
                        </div>
                        <div className="text-end">
                          <Badge bg="" style={{ background: getBmiColor(entry.bmi) }} className="small">{entry.bmi.toFixed(1)}</Badge>
                          <div className="text-muted" style={{ fontSize: 10 }}>{entry.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </main>
  );
}
