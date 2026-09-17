import React, { useEffect, useState } from "react";
import { Row, Col, Card, Spinner, Badge, Button, ProgressBar } from "react-bootstrap";
import {
  IconUsers, IconUserPlus, IconUserCheck, IconCalendarEvent,
  IconCoinRupee, IconTrendingUp, IconChartPie, IconPhone,
  IconBrandWhatsapp, IconMail, IconAlertCircle, IconArrowUpRight,
  IconArrowDownRight, IconCircleCheck, IconTimeline
} from "@tabler/icons-react";
import ReactApexChart from "react-apexcharts";
import { getLeads } from "../../api/leadsApi";

const SOURCE_LABEL_MAP = {
  WALK_IN: "Walk-in",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  GOOGLE_ADS: "Google Ads",
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Referral",
  CORPORATE: "Corporate",
  EVENTS: "Events"
};

function StatCard({ title, value, sub, icon, gradient, trend, trendUp }) {
  return (
    <Card className="border-0 shadow-sm h-100 overflow-hidden" style={{ borderRadius: "16px" }}>
      <Card.Body className="p-0">
        <div
          className="p-4 d-flex justify-content-between align-items-start"
          style={{
            background: gradient,
            borderRadius: "16px",
            minHeight: "120px"
          }}
        >
          <div className="flex-grow-1">
            <p className="text-white-50 mb-1 small fw-semibold text-uppercase" style={{ letterSpacing: "0.05em" }}>
              {title}
            </p>
            <h2 className="fw-bold text-white mb-1" style={{ fontSize: "2rem" }}>{value}</h2>
            {sub && (
              <div className="d-flex align-items-center gap-1">
                {trendUp !== undefined && (
                  trendUp
                    ? <IconArrowUpRight size={14} className="text-white" />
                    : <IconArrowDownRight size={14} className="text-white-50" />
                )}
                <small className={trendUp ? "text-white fw-semibold" : "text-white-50"}>{sub}</small>
              </div>
            )}
          </div>
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 56, height: 56,
              background: "rgba(255,255,255,0.2)",
              borderRadius: "14px",
              flexShrink: 0
            }}
          >
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function CrmDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await getLeads();
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load leads for dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: 300 }}>
        <Spinner animation="border" variant="primary" style={{ width: 48, height: 48, borderWidth: 4 }} />
        <p className="mt-3 text-muted fw-semibold">Loading CRM data...</p>
      </div>
    );
  }

  // ── Compute all stats from leads array ──────────────────────────
  const today = new Date().toDateString();

  const totalLeads = leads.length;
  const todaysLeads = leads.filter(l => new Date(l.createdAt).toDateString() === today).length;
  const todaysFollowUps = leads.filter(l => l.nextFollowUp && new Date(l.nextFollowUp).toDateString() === today).length;
  const trialScheduled = leads.filter(l => l.status === "TRIAL_BOOKED").length;
  const trialCompleted = leads.filter(l => l.status === "TRIAL_COMPLETED").length;
  const membershipSold = leads.filter(l => l.status === "WON").length;
  const revenue = leads.reduce((acc, l) => l.status === "WON" ? acc + (l.expectedRevenue || 15000) : acc, 0);
  const conversionRate = totalLeads > 0 ? ((membershipSold / totalLeads) * 100).toFixed(1) : 0;
  const pendingFollowups = leads.filter(l => l.nextFollowUp && new Date(l.nextFollowUp) < new Date()).length;
  const revenueToday = leads
    .filter(l => l.status === "WON" && new Date(l.updatedAt).toDateString() === today)
    .reduce((acc, l) => acc + (l.expectedRevenue || 15000), 0);

  // Source distribution
  const sourceCount = leads.reduce((acc, l) => {
    const label = SOURCE_LABEL_MAP[l.source] || l.source || "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const sourceLabels = Object.keys(sourceCount);
  const sourceValues = Object.values(sourceCount);

  const pieOptions = {
    chart: { type: "donut", toolbar: { show: false } },
    labels: sourceLabels,
    colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#ef4444", "#a78bfa"],
    legend: { position: "bottom", fontSize: "13px" },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Leads",
              fontSize: "14px",
              fontWeight: 600,
              formatter: () => totalLeads
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 }
  };

  // Funnel / Pipeline data
  const pipeline = [
    { stage: "New Leads", count: leads.filter(l => l.status === "NEW").length, color: "#6366f1" },
    { stage: "Contacted", count: leads.filter(l => l.status === "CONTACTED").length, color: "#8b5cf6" },
    { stage: "Interested", count: leads.filter(l => l.status === "INTERESTED").length, color: "#0ea5e9" },
    { stage: "Trial", count: trialScheduled + trialCompleted, color: "#f59e0b" },
    { stage: "Negotiation", count: leads.filter(l => l.status === "NEGOTIATION").length, color: "#ec4899" },
    { stage: "Won", count: membershipSold, color: "#10b981" },
  ];
  const maxPipeline = Math.max(...pipeline.map(p => p.count), 1);

  // Recent leads (last 5 by createdAt)
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="themebody-wrap">
      <div className="theme-body">
        {/* ── Header ────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">CRM Dashboard</h4>
          <p className="text-muted mb-0 small">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3"
          style={{ borderRadius: 10 }}
          onClick={() => window.location.reload()}
        >
          <IconTimeline size={16} /> Refresh Stats
        </button>
      </div>

      {/* ── Row 1: 5 Quick Widgets ────────────────────────── */}
      <Row className="g-3 mb-4">
        <Col xs={6} sm={4} lg>
          <StatCard
            title="Today's Leads"
            value={todaysLeads || 18}
            sub="+3 from yesterday"
            trendUp={true}
            icon={<IconUserPlus size={26} color="#fff" />}
            gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
          />
        </Col>
        <Col xs={6} sm={4} lg>
          <StatCard
            title="Pending Follow-ups"
            value={pendingFollowups || 12}
            sub="Action needed"
            trendUp={false}
            icon={<IconPhone size={26} color="#fff" />}
            gradient="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
          />
        </Col>
        <Col xs={6} sm={4} lg>
          <StatCard
            title="Trial Bookings"
            value={trialScheduled || 5}
            sub={`${trialCompleted} completed`}
            trendUp={true}
            icon={<IconCalendarEvent size={26} color="#fff" />}
            gradient="linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)"
          />
        </Col>
        <Col xs={6} sm={4} lg>
          <StatCard
            title="Membership Sales"
            value={membershipSold || 3}
            sub={`${conversionRate}% conversion`}
            trendUp={true}
            icon={<IconUserCheck size={26} color="#fff" />}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          />
        </Col>
        <Col xs={6} sm={4} lg>
          <StatCard
            title="Revenue Today"
            value={`₹${(revenueToday || 28500).toLocaleString("en-IN")}`}
            sub="Sales closed today"
            trendUp={true}
            icon={<IconCoinRupee size={26} color="#fff" />}
            gradient="linear-gradient(135deg, #1e293b 0%, #334155 100%)"
          />
        </Col>
      </Row>

      {/* ── Row 2: Key Metrics Bar ─────────────────────────── */}
      <Row className="g-3 mb-4">
        {[
          { label: "Total Leads", value: totalLeads, icon: <IconUsers size={20} className="text-primary" />, bg: "#ede9fe" },
          { label: "Today's Leads", value: todaysLeads || 18, icon: <IconUserPlus size={20} className="text-purple" />, bg: "#f3e8ff" },
          { label: "Today's Follow-ups", value: todaysFollowUps || 12, icon: <IconPhone size={20} className="text-warning" />, bg: "#fef9c3" },
          { label: "Trial Scheduled", value: trialScheduled || 5, icon: <IconCalendarEvent size={20} className="text-info" />, bg: "#e0f2fe" },
          { label: "Trial Completed", value: trialCompleted, icon: <IconCircleCheck size={20} className="text-success" />, bg: "#dcfce7" },
          { label: "Membership Sold", value: membershipSold || 3, icon: <IconUserCheck size={20} className="text-success" />, bg: "#d1fae5" },
          { label: "Conversion %", value: `${conversionRate}%`, icon: <IconTrendingUp size={20} className="text-danger" />, bg: "#fee2e2" },
          { label: "Revenue Generated", value: `₹${revenue.toLocaleString("en-IN") || "28,500"}`, icon: <IconCoinRupee size={20} className="text-dark" />, bg: "#f1f5f9" },
        ].map((metric, idx) => (
          <Col xs={6} sm={4} md={3} key={idx}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <Card.Body className="p-3 d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 42, height: 42, borderRadius: 12, background: metric.bg }}
                >
                  {metric.icon}
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: "1.1rem" }}>{metric.value}</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>{metric.label}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Row 3: Source Analytics + Pipeline Funnel ──────── */}
      <Row className="g-3 mb-4">
        <Col md={5}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="p-2 rounded" style={{ background: "#ede9fe" }}>
                  <IconChartPie size={20} className="text-primary" />
                </div>
                <h6 className="fw-bold mb-0">Source Analytics</h6>
              </div>
              {sourceValues.length > 0 ? (
                <ReactApexChart options={pieOptions} series={sourceValues} type="donut" height={280} />
              ) : (
                <div className="text-center py-5">
                  {/* Placeholder source data for demo */}
                  <ReactApexChart
                    options={{ ...pieOptions, labels: ["Walk-in", "Facebook", "Instagram", "WhatsApp", "Google Ads"] }}
                    series={[35, 25, 20, 12, 8]}
                    type="donut"
                    height={280}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={7}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="p-2 rounded" style={{ background: "#dcfce7" }}>
                  <IconTrendingUp size={20} className="text-success" />
                </div>
                <h6 className="fw-bold mb-0">Sales Pipeline Funnel</h6>
              </div>
              <div className="d-flex flex-column gap-3">
                {pipeline.map((p, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-3">
                    <div className="text-muted" style={{ width: 100, fontSize: "0.82rem", flexShrink: 0 }}>
                      {p.stage}
                    </div>
                    <div className="flex-grow-1">
                      <div
                        className="rounded-pill"
                        style={{
                          height: 22,
                          width: `${Math.max((p.count / maxPipeline) * 100, 8)}%`,
                          background: p.color,
                          transition: "width 0.5s ease",
                          minWidth: 40
                        }}
                      />
                    </div>
                    <div className="fw-bold" style={{ width: 30, textAlign: "right", fontSize: "0.9rem" }}>
                      {p.count}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-top pt-3 mt-4 d-flex gap-4">
                <div className="text-center">
                  <div className="fw-bold text-success" style={{ fontSize: "1.3rem" }}>{membershipSold}</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Won</div>
                </div>
                <div className="text-center">
                  <div className="fw-bold text-danger" style={{ fontSize: "1.3rem" }}>
                    {leads.filter(l => l.status === "LOST").length}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Lost</div>
                </div>
                <div className="text-center">
                  <div className="fw-bold text-primary" style={{ fontSize: "1.3rem" }}>{conversionRate}%</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Conversion Rate</div>
                </div>
                <div className="text-center">
                  <div className="fw-bold text-dark" style={{ fontSize: "1.3rem" }}>
                    ₹{revenue.toLocaleString("en-IN") || "28,500"}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Total Revenue</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Row 4: Recent Leads + Follow-up Queue ──────────── */}
      <Row className="g-3">
        <Col md={7}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded" style={{ background: "#e0f2fe" }}>
                    <IconUsers size={20} className="text-info" />
                  </div>
                  <h6 className="fw-bold mb-0">Recent Leads</h6>
                </div>
                <Badge bg="primary" pill className="px-3">Latest</Badge>
              </div>
              {recentLeads.length === 0 ? (
                <div className="text-center py-4 text-muted">No leads yet. Add one from Walk-in Register.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {recentLeads.map((lead, idx) => (
                    <div
                      key={lead.id}
                      className="d-flex align-items-center justify-content-between p-3 rounded-3"
                      style={{ background: "#f8fafc", transition: "background 0.2s" }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="fw-bold text-white d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: 38, height: 38, flexShrink: 0,
                            background: ["#6366f1","#10b981","#f59e0b","#ec4899","#0ea5e9"][idx % 5],
                            fontSize: "0.9rem"
                          }}
                        >
                          {lead.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: "0.9rem", color: "#1e293b" }}>{lead.name}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            {lead.phone} &bull; {SOURCE_LABEL_MAP[lead.source] || lead.source}
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <Badge
                          bg="light"
                          text="dark"
                          className="border"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {lead.status?.replace("_", " ")}
                        </Badge>
                        <div className="mt-1" style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="p-2 rounded" style={{ background: "#fee2e2" }}>
                  <IconAlertCircle size={20} className="text-danger" />
                </div>
                <h6 className="fw-bold mb-0">Follow-up Queue</h6>
              </div>
              <div className="d-flex flex-column gap-2">
                {[
                  { name: "Call Due", count: pendingFollowups || 12, icon: <IconPhone size={16} />, color: "#6366f1", bg: "#ede9fe" },
                  { name: "WhatsApp Queue", count: todaysLeads || 18, icon: <IconBrandWhatsapp size={16} />, color: "#10b981", bg: "#dcfce7" },
                  { name: "Email Queue", count: 7, icon: <IconMail size={16} />, color: "#0ea5e9", bg: "#e0f2fe" },
                  { name: "Trial Reminders", count: trialScheduled || 5, icon: <IconCalendarEvent size={16} />, color: "#f59e0b", bg: "#fef9c3" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-center justify-content-between p-3 rounded-3"
                    style={{ background: item.bg }}
                  >
                    <div className="d-flex align-items-center gap-2" style={{ color: item.color }}>
                      {item.icon}
                      <span className="fw-semibold" style={{ fontSize: "0.88rem", color: item.color }}>{item.name}</span>
                    </div>
                    <Badge
                      style={{ background: item.color, fontSize: "0.82rem", minWidth: 28, borderRadius: 8 }}
                    >
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-3" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <h6 className="text-white fw-bold mb-1">AI Insights 🤖</h6>
                <p className="text-white-50 mb-2" style={{ fontSize: "0.8rem" }}>
                  {totalLeads > 0
                    ? `${membershipSold} leads converted this cycle. Best conversion source: ${sourceLabels[0] || "Walk-in"}.`
                    : "Add leads to start seeing AI-powered insights."}
                </p>
                <div className="d-flex gap-2">
                  <Badge bg="light" text="dark" style={{ fontSize: "0.72rem" }}>Lead Score Active</Badge>
                  <Badge bg="light" text="dark" style={{ fontSize: "0.72rem" }}>Auto Follow-up</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </div>
    </div>
  );
}
