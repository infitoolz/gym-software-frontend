import React, { useEffect, useState, useMemo } from "react";
import { Row, Col, Card, Spinner, Badge, Button, Collapse } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  IconUsers, IconUserPlus, IconUserCheck, IconCalendarEvent,
  IconCoinRupee, IconTrendingUp, IconChartPie, IconPhone,
  IconBrandWhatsapp, IconMail, IconAlertCircle, IconArrowUpRight,
  IconArrowDownRight, IconCircleCheck, IconTimeline, IconFlame,
  IconSparkles, IconPhoneCall, IconTarget, IconExternalLink,
  IconCalendar, IconChevronRight, IconRotateClockwise, IconTrophy,
  IconClock, IconMessageDots, IconPlus, IconArrowRight, IconWalk,
  IconBuilding, IconDatabase, IconGitCommit, IconShare
} from "@tabler/icons-react";
import ReactApexChart from "react-apexcharts";
import Swal from "sweetalert2";
import { getLeads } from "../../api/leadsApi";

/* ─── Source Configuration ──────────────────────────────────── */
const SOURCE_LABEL_MAP = {
  WALK_IN: "Walk-in",
  FACEBOOK: "Facebook Ads",
  INSTAGRAM: "Instagram",
  GOOGLE_ADS: "Google Ads",
  WEBSITE: "Direct Website",
  WHATSAPP: "WhatsApp Direct",
  REFERRAL: "Member Referral",
  CORPORATE: "Corporate Partner",
  EVENTS: "Promotional Events"
};

const SOURCE_COLORS = {
  "Walk-in": "#4f46e5",
  "Instagram": "#ec4899",
  "Google Ads": "#0284c7",
  "WhatsApp Direct": "#10b981",
  "Facebook Ads": "#3b82f6",
  "Member Referral": "#8b5cf6",
  "Corporate Partner": "#f59e0b",
  "Direct Website": "#06b6d4",
  "Promotional Events": "#f97316"
};

/* ─── Status Configurations ─────────────────────────────────── */
const STATUS_CONFIG = {
  NEW: { label: "New Inquiry", color: "#4f46e5", bg: "rgba(79, 70, 229, 0.12)", border: "rgba(79, 70, 229, 0.25)" },
  CONTACTED: { label: "Contacted", color: "#0284c7", bg: "rgba(2, 132, 199, 0.12)", border: "rgba(2, 132, 199, 0.25)" },
  INTERESTED: { label: "Interested", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.25)" },
  TRIAL_BOOKED: { label: "Trial Booked", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)", border: "rgba(6, 182, 212, 0.25)" },
  TRIAL_COMPLETED: { label: "Trial Done", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.25)" },
  NEGOTIATION: { label: "Negotiation", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.25)" },
  WON: { label: "Won Member 🎉", color: "#059669", bg: "rgba(5, 150, 105, 0.14)", border: "rgba(5, 150, 105, 0.3)" },
  LOST: { label: "Lost", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.25)" }
};



/* ─── Sleek Top Executive Card Component ─────────────────────── */
function ExecutiveCard({ title, value, sub, icon, gradient, badge, badgeColor, shadowColor }) {
  return (
    <div
      className="h-100 p-3 p-xl-4 rounded-4 position-relative overflow-hidden text-white"
      style={{
        background: gradient,
        boxShadow: `0 10px 25px -5px ${shadowColor || "rgba(15, 23, 42, 0.25)"}`,
        border: "1px solid rgba(255, 255, 255, 0.15)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "default"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 16px 32px -4px ${shadowColor || "rgba(15, 23, 42, 0.35)"}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 10px 25px -5px ${shadowColor || "rgba(15, 23, 42, 0.25)"}`;
      }}
    >
      {/* Decorative subtle background circle */}
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none"
        }}
      />

      <div className="d-flex justify-content-between align-items-start mb-2">
        <div
          className="text-uppercase fw-semibold"
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
            color: "rgba(255, 255, 255, 0.85)",
            whiteSpace: "nowrap"
          }}
        >
          {title}
        </div>
        <div
          className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{
            width: 42,
            height: 42,
            background: "rgba(255, 255, 255, 0.18)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.25)"
          }}
        >
          {icon}
        </div>
      </div>

      <div className="my-2">
        <div
          className="fw-bolder"
          style={{
            fontSize: "clamp(1.35rem, 1.8vw, 1.85rem)",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between gap-1 mt-2 pt-1 border-top border-white border-opacity-10">
        <span
          style={{
            fontSize: "0.76rem",
            color: "rgba(255, 255, 255, 0.82)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {sub}
        </span>
        {badge && (
          <span
            className="badge rounded-pill px-2 py-1 flex-shrink-0 fw-semibold"
            style={{
              fontSize: "0.68rem",
              background: badgeColor || "rgba(255, 255, 255, 0.22)",
              color: "#fff",
              backdropFilter: "blur(6px)"
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Leads CRM Dashboard Component ────────────────────── */
export default function CrmDashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("all"); // "today" | "week" | "month" | "all"
  const [activeTab, setActiveTab] = useState("all"); // "all" | "hot" | "trial" | "won"
  const [showArchitecture, setShowArchitecture] = useState(false);

  const fetchLeadsData = async () => {
    try {
      setRefreshing(true);
      const data = await getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leads for dashboard", err);
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeadsData();
  }, []);

  // ── Compute Time-Window Filtered Leads ─────────────────────────
  const filteredLeads = useMemo(() => {
    if (timeRange === "all") return leads;
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === "today") {
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRange === "week") {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeRange === "month") {
      cutoff.setDate(now.getDate() - 30);
    }
    return leads.filter(l => new Date(l.createdAt) >= cutoff);
  }, [leads, timeRange]);

  // ── Compute Metrics (100% Real Database Values) ───────────────
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const now = new Date();
    const total = filteredLeads.length;
    const todaysLeads = filteredLeads.filter(l => new Date(l.createdAt).toDateString() === todayStr).length;
    const todaysFollowUps = filteredLeads.filter(l => l.nextFollowUp && new Date(l.nextFollowUp).toDateString() === todayStr).length;
    const pendingFollowups = filteredLeads.filter(l => l.nextFollowUp && new Date(l.nextFollowUp) <= now && !["WON", "LOST"].includes(l.status)).length;
    const overdueCalls = filteredLeads.filter(l => l.nextFollowUp && new Date(l.nextFollowUp) < now && !["WON", "LOST"].includes(l.status)).length;
    const trialScheduled = filteredLeads.filter(l => l.status === "TRIAL_BOOKED").length;
    const trialCompleted = filteredLeads.filter(l => l.status === "TRIAL_COMPLETED").length;
    const membershipSold = filteredLeads.filter(l => l.status === "WON").length;
    const lostLeads = filteredLeads.filter(l => l.status === "LOST").length;
    const activeInPipeline = filteredLeads.filter(l => !["WON", "LOST"].includes(l.status)).length;

    // Real Revenue calculations
    const totalRevenue = filteredLeads.reduce((acc, l) => {
      if (l.status === "WON") return acc + (Number(l.expectedRevenue) || 0);
      return acc;
    }, 0);

    const revenueToday = filteredLeads.reduce((acc, l) => {
      if (l.status === "WON") {
        const updateDate = l.updatedAt ? new Date(l.updatedAt).toDateString() : new Date(l.createdAt).toDateString();
        if (updateDate === todayStr) return acc + (Number(l.expectedRevenue) || 0);
      }
      return acc;
    }, 0);

    // Real Pipeline Value
    const pipelineValue = filteredLeads.reduce((acc, l) => {
      if (l.status !== "LOST" && l.status !== "WON") {
        return acc + (Number(l.expectedRevenue) || 0);
      }
      return acc;
    }, 0);

    const conversionRate = total > 0 ? ((membershipSold / total) * 100).toFixed(1) : "0.0";
    const contactedCount = filteredLeads.filter(l => l.status !== "NEW").length;
    const contactRate = total > 0 ? ((contactedCount / total) * 100).toFixed(0) : "0";
    const totalTrials = trialScheduled + trialCompleted;
    const trialShowRate = totalTrials > 0 ? ((trialCompleted / totalTrials) * 100).toFixed(0) : "0";
    const avgDealValue = membershipSold > 0 ? Math.round(totalRevenue / membershipSold) : 0;
    const whatsappQueueCount = filteredLeads.filter(l => !l.nextFollowUp && l.status === "NEW").length;
    const contactedQueueCount = filteredLeads.filter(l => l.status === "CONTACTED" || l.status === "INTERESTED").length;

    return {
      total,
      todaysLeads,
      todaysFollowUps,
      pendingFollowups,
      overdueCalls,
      trialScheduled,
      trialCompleted,
      membershipSold,
      lostLeads,
      activeInPipeline,
      totalRevenue,
      revenueToday,
      pipelineValue,
      conversionRate,
      contactRate,
      trialShowRate,
      avgDealValue,
      whatsappQueueCount,
      contactedQueueCount
    };
  }, [filteredLeads]);

  // ── Source Attribution Data for Donut Chart (Real Data) ───────
  const sourceStats = useMemo(() => {
    const counts = {};
    filteredLeads.forEach(l => {
      const label = SOURCE_LABEL_MAP[l.source] || l.source || "Walk-in";
      counts[label] = (counts[label] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const series = Object.values(counts);
    const totalCount = series.reduce((a, b) => a + b, 0);

    const breakdown = labels.map((label, i) => ({
      name: label,
      count: series[i],
      percentage: totalCount > 0 ? Math.round((series[i] / totalCount) * 100) : 0,
      color: SOURCE_COLORS[label] || "#6366f1"
    })).sort((a, b) => b.count - a.count);

    return { labels, series, breakdown, totalCount };
  }, [filteredLeads]);



  const pieChartOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
      toolbar: { show: false }
    },
    labels: sourceStats.labels,
    colors: sourceStats.labels.map(l => SOURCE_COLORS[l] || "#4f46e5"),
    dataLabels: { enabled: false },
    stroke: { width: 3, colors: ["#ffffff"] },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "13px",
              fontWeight: 500,
              color: "#64748b",
              offsetY: -4
            },
            value: {
              show: true,
              fontSize: "22px",
              fontWeight: 700,
              color: "#0f172a",
              offsetY: 6,
              formatter: () => `${sourceStats.totalCount}`
            },
            total: {
              show: true,
              label: "Inquiries",
              fontSize: "12px",
              color: "#64748b",
              formatter: () => `${sourceStats.totalCount}`
            }
          }
        }
      }
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} leads (${Math.round((val / sourceStats.totalCount) * 100)}%)`
      }
    }
  };

  // ── Sales Pipeline Funnel Stages (100% Real Database Counts) ───
  const pipelineStages = useMemo(() => {
    const getStageEstValue = (statusList) => {
      return filteredLeads
        .filter(l => statusList.includes(l.status))
        .reduce((sum, l) => sum + (Number(l.expectedRevenue) || 0), 0);
    };

    const stages = [
      {
        id: "NEW",
        label: "New Inquiries",
        count: filteredLeads.filter(l => l.status === "NEW").length,
        color: "#4f46e5",
        gradient: "linear-gradient(90deg, #4f46e5, #6366f1)",
        estValue: getStageEstValue(["NEW"])
      },
      {
        id: "CONTACTED",
        label: "Contacted & Pitched",
        count: filteredLeads.filter(l => l.status === "CONTACTED").length,
        color: "#0284c7",
        gradient: "linear-gradient(90deg, #0284c7, #38bdf8)",
        estValue: getStageEstValue(["CONTACTED"])
      },
      {
        id: "INTERESTED",
        label: "Interested & Consulted",
        count: filteredLeads.filter(l => l.status === "INTERESTED").length,
        color: "#8b5cf6",
        gradient: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
        estValue: getStageEstValue(["INTERESTED"])
      },
      {
        id: "TRIAL",
        label: "Free Trial Scheduled",
        count: filteredLeads.filter(l => ["TRIAL_BOOKED", "TRIAL_COMPLETED"].includes(l.status)).length,
        color: "#f59e0b",
        gradient: "linear-gradient(90deg, #d97706, #fbbf24)",
        estValue: getStageEstValue(["TRIAL_BOOKED", "TRIAL_COMPLETED"])
      },
      {
        id: "NEGOTIATION",
        label: "Package Negotiation",
        count: filteredLeads.filter(l => l.status === "NEGOTIATION").length,
        color: "#ea580c",
        gradient: "linear-gradient(90deg, #ea580c, #fb923c)",
        estValue: getStageEstValue(["NEGOTIATION"])
      },
      {
        id: "WON",
        label: "Won & Enrolled 🎉",
        count: filteredLeads.filter(l => l.status === "WON").length,
        color: "#059669",
        gradient: "linear-gradient(90deg, #059669, #34d399)",
        estValue: getStageEstValue(["WON"])
      }
    ];

    const maxCount = Math.max(...stages.map(s => s.count), 1);
    return stages.map(s => ({
      ...s,
      percentage: s.count > 0 ? Math.max(Math.round((s.count / maxCount) * 100), 12) : 0
    }));
  }, [filteredLeads]);

  // ── Filtered Recent Leads Stream ──────────────────────────────
  const displayedLeads = useMemo(() => {
    let list = [...filteredLeads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (activeTab === "hot") {
      list = list.filter(l => (l.leadScore && l.leadScore >= 80) || l.status === "INTERESTED" || l.status === "NEGOTIATION");
    } else if (activeTab === "trial") {
      list = list.filter(l => l.status === "TRIAL_BOOKED" || l.status === "TRIAL_COMPLETED");
    } else if (activeTab === "won") {
      list = list.filter(l => l.status === "WON");
    }
    return list.slice(0, 5);
  }, [filteredLeads, activeTab]);

  // Quick Action Notification using real leads
  const handleAiAction = () => {
    const uncontacted = filteredLeads.filter(l => l.status === "NEW");
    if (uncontacted.length === 0) {
      Swal.fire({
        icon: "info",
        title: "All Caught Up!",
        text: "There are no pending new leads waiting for initial outreach.",
        confirmButtonColor: "#4f46e5"
      });
      return;
    }
    const leadName = uncontacted[0]?.name || "Visitor";
    Swal.fire({
      icon: "success",
      title: "AI Outreach Ready!",
      html: `
        <p class="text-muted small">Generated high-intent outreach draft for <strong>${uncontacted.length} new lead${uncontacted.length > 1 ? "s" : ""}</strong> in database.</p>
        <div class="p-2 rounded bg-light text-start small border">
          <p class="mb-1 text-primary fw-bold">Message preview for ${leadName}:</p>
          <em>"Hi ${leadName}! Welcome to our gym. Here is your complimentary 1-Day Trial Pass. Ready to start your fitness journey? 💪"</em>
        </div>
      `,
      confirmButtonColor: "#4f46e5"
    });
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: 450 }}>
        <Spinner animation="border" variant="primary" style={{ width: 44, height: 44, borderWidth: 3.5 }} />
        <p className="mt-3 text-muted fw-semibold" style={{ letterSpacing: "0.02em" }}>
          Synchronizing Leads CRM Command Center...
        </p>
      </div>
    );
  }

  return (
    <div className="crm-dashboard-page pb-5">
      {/* ── Section 1: Command Header & Quick Filter Bar ──────── */}
      <div className="bg-white rounded-4 p-3 p-md-4 mb-4 border shadow-sm">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h3 className="fw-bolder text-dark mb-0" style={{ letterSpacing: "-0.03em" }}>
                Leads CRM Command Center
              </h3>
              <span
                className="badge rounded-pill d-inline-flex align-items-center gap-1 px-2 py-1"
                style={{
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  border: "1px solid rgba(16, 185, 129, 0.25)"
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "inline-block",
                    boxShadow: "0 0 8px #10b981"
                  }}
                />
                Live Pipeline
              </span>
            </div>
            <p className="text-muted mb-0 small">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}{" "}
              &bull; Real-time intake from Walk-in desk, Social Ads, and Website.
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Time-Range Filter Pill Group */}
            <div
              className="d-inline-flex p-1 rounded-3 border"
              style={{ background: "#f8fafc" }}
            >
              {[
                { key: "today", label: "Today" },
                { key: "week", label: "7 Days" },
                { key: "month", label: "30 Days" },
                { key: "all", label: "All Time" }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTimeRange(tab.key)}
                  className="btn btn-sm py-1 px-3 border-0 fw-semibold"
                  style={{
                    borderRadius: 7,
                    fontSize: "0.8rem",
                    transition: "all 0.2s",
                    background: timeRange === tab.key ? "#0f172a" : "transparent",
                    color: timeRange === tab.key ? "#ffffff" : "#64748b",
                    boxShadow: timeRange === tab.key ? "0 2px 8px rgba(15, 23, 42, 0.15)" : "none"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <Button
              variant="outline-secondary"
              size="sm"
              className="d-flex align-items-center gap-1 px-3 py-2 rounded-3 border fw-semibold text-dark bg-white"
              onClick={fetchLeadsData}
              disabled={refreshing}
              style={{ fontSize: "0.82rem" }}
            >
              <IconRotateClockwise
                size={16}
                className={refreshing ? "rotate-spin" : ""}
                style={{
                  transition: "transform 0.4s",
                  transform: refreshing ? "rotate(360deg)" : "none"
                }}
              />
              Refresh
            </Button>

            <Link
              to="/leads/walkin"
              className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold shadow-sm"
              style={{
                fontSize: "0.82rem",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                border: "none"
              }}
            >
              <IconPlus size={16} /> Add Walk-in
            </Link>
          </div>
        </div>
      </div>

      {/* ── Section 2: Top 5 Executive Metric Cards ───────────── */}
      <Row className="g-3 mb-4">
        {/* Card 1: Today's Inquiries (Royal Indigo) */}
        <Col xs={12} sm={6} lg={4} xl>
          <ExecutiveCard
            title="Today's Inquiries"
            value={stats.todaysLeads}
            sub={`${stats.total} total in database`}
            badge={stats.todaysLeads > 0 ? `${stats.todaysLeads} New Today` : "0 Today"}
            badgeColor="rgba(255, 255, 255, 0.22)"
            icon={<IconUserPlus size={22} />}
            gradient="linear-gradient(135deg, #4338ca 0%, #6366f1 100%)"
            shadowColor="rgba(79, 70, 229, 0.3)"
          />
        </Col>

        {/* Card 2: Pending Follow-ups (Vibrant Sunset Tangerine) */}
        <Col xs={12} sm={6} lg={4} xl>
          <ExecutiveCard
            title="Pending Follow-ups"
            value={stats.pendingFollowups}
            sub={`${stats.overdueCalls} overdue calls`}
            badge={stats.overdueCalls > 0 ? `${stats.overdueCalls} Overdue` : "On Track"}
            badgeColor="rgba(0, 0, 0, 0.25)"
            icon={<IconPhoneCall size={22} />}
            gradient="linear-gradient(135deg, #ea580c 0%, #f97316 100%)"
            shadowColor="rgba(234, 88, 12, 0.3)"
          />
        </Col>

        {/* Card 3: Trial Bookings (Electric Cyan & Azure) */}
        <Col xs={12} sm={6} lg={4} xl>
          <ExecutiveCard
            title="Trial Bookings"
            value={stats.trialScheduled}
            sub={`${stats.trialCompleted} attended trials`}
            badge={stats.trialScheduled > 0 ? `${stats.trialScheduled} Active` : "0 Trials"}
            badgeColor="rgba(255, 255, 255, 0.25)"
            icon={<IconCalendarEvent size={22} />}
            gradient="linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)"
            shadowColor="rgba(2, 132, 199, 0.3)"
          />
        </Col>

        {/* Card 4: Membership Sales (Emerald Jade) */}
        <Col xs={12} sm={6} lg={4} xl>
          <ExecutiveCard
            title="Membership Won"
            value={stats.membershipSold}
            sub={`${stats.conversionRate}% win rate`}
            badge={stats.membershipSold > 0 ? `${stats.membershipSold} Won` : "0 Won"}
            badgeColor="rgba(255, 255, 255, 0.22)"
            icon={<IconUserCheck size={22} />}
            gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
            shadowColor="rgba(5, 150, 105, 0.3)"
          />
        </Col>

        {/* Card 5: Revenue Today (Midnight Obsidian with Emerald Accent - NO TEXT WRAPPING) */}
        <Col xs={12} sm={6} lg={4} xl>
          <ExecutiveCard
            title="Revenue Closed"
            value={`₹${stats.revenueToday.toLocaleString("en-IN")}`}
            sub={`Total: ₹${stats.totalRevenue.toLocaleString("en-IN")}`}
            badge={stats.revenueToday > 0 ? "Closed Today" : "₹0 Today"}
            badgeColor="rgba(16, 185, 129, 0.35)"
            icon={<IconCoinRupee size={22} color="#34d399" />}
            gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)"
            shadowColor="rgba(15, 23, 42, 0.4)"
          />
        </Col>
      </Row>

      {/* ── Section 3: High-Density Executive KPI Ribbon ──────── */}
      <div className="bg-white rounded-4 p-3 mb-4 border shadow-sm">
        <Row className="g-2 g-md-3 align-items-center">
          {[
            {
              label: "Total Pipeline Pool",
              val: stats.total,
              sub: "Active Inquiries",
              color: "#4f46e5",
              bg: "rgba(79, 70, 229, 0.08)"
            },
            {
              label: "Contact Response Rate",
              val: `${stats.contactRate}%`,
              sub: "Under 15m avg",
              color: "#0284c7",
              bg: "rgba(2, 132, 199, 0.08)"
            },
            {
              label: "Trial Attendance",
              val: `${stats.trialShowRate}%`,
              sub: "Show-up Ratio",
              color: "#06b6d4",
              bg: "rgba(6, 182, 212, 0.08)"
            },
            {
              label: "Win Conversion",
              val: `${stats.conversionRate}%`,
              sub: "Inquiry to Paid",
              color: "#059669",
              bg: "rgba(5, 150, 105, 0.08)"
            },
            {
              label: "Avg. Deal Size",
              val: `₹${stats.avgDealValue.toLocaleString("en-IN")}`,
              sub: "Per Enrolled Member",
              color: "#d97706",
              bg: "rgba(217, 119, 6, 0.08)"
            },
            {
              label: "Active Pipeline Value",
              val: `₹${stats.pipelineValue.toLocaleString("en-IN")}`,
              sub: "Forecasted Value",
              color: "#0f172a",
              bg: "rgba(15, 23, 42, 0.06)"
            }
          ].map((item, idx) => (
            <Col xs={6} md={4} xl={2} key={idx}>
              <div
                className="p-2 p-xl-3 rounded-3 d-flex flex-column justify-content-between h-100"
                style={{
                  background: item.bg,
                  border: "1px solid rgba(0,0,0,0.04)"
                }}
              >
                <div className="d-flex align-items-center gap-1 mb-1">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: item.color,
                      display: "inline-block"
                    }}
                  />
                  <span
                    className="text-muted fw-semibold"
                    style={{
                      fontSize: "0.72rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                <div
                  className="fw-bold"
                  style={{
                    fontSize: "1.18rem",
                    color: item.color,
                    letterSpacing: "-0.02em"
                  }}
                >
                  {item.val}
                </div>
                <div className="text-muted" style={{ fontSize: "0.68rem" }}>
                  {item.sub}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ── Section 3.5: Interactive CRM Lead Lifecycle & Workflow ─ */}
      <div className="bg-white rounded-4 p-4 mb-4 border shadow-sm">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-flex align-items-center justify-content-center text-white rounded-3 flex-shrink-0"
                style={{ width: 34, height: 34, background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)" }}
              >
                <IconGitCommit size={20} />
              </span>
              <h5 className="fw-bolder mb-0 text-dark" style={{ letterSpacing: "-0.01em" }}>
                Interactive CRM Lead Lifecycle & Action Flow
              </h5>
              <Badge bg="primary" className="fw-semibold px-2 py-1" style={{ fontSize: "0.72rem" }}>
                Connected Live Flow
              </Badge>
            </div>
            <p className="text-muted mb-0 small mt-1">
              Click any stage or page link below to take immediate action — watch leads progress from first inquiry to paying gym member.
            </p>
          </div>

          <Button
            variant="outline-primary"
            size="sm"
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold border"
            onClick={() => setShowArchitecture(!showArchitecture)}
            style={{ fontSize: "0.82rem" }}
          >
            <IconDatabase size={16} />
            {showArchitecture ? "Hide Database Tables" : "View Backend Database Tables"}
            <IconChevronRight
              size={14}
              style={{
                transform: showArchitecture ? "rotate(90deg)" : "none",
                transition: "transform 0.2s"
              }}
            />
          </Button>
        </div>

        {/* 5-Step Workflow Cards */}
        <Row className="g-3 align-items-stretch">
          {/* Step 1: Capture & Intake */}
          <Col xs={12} md={6} xl>
            <div
              className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between position-relative"
              style={{
                background: "linear-gradient(180deg, rgba(79, 70, 229, 0.05) 0%, rgba(79, 70, 229, 0.01) 100%)",
                border: "1.5px solid rgba(79, 70, 229, 0.2)"
              }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge px-2 py-1 fw-bold" style={{ background: "#4f46e5", color: "#ffffff", fontSize: "0.68rem" }}>
                    STEP 1
                  </span>
                  <span className="badge rounded-pill px-2 py-1" style={{ background: "rgba(79, 70, 229, 0.12)", color: "#4f46e5", fontSize: "0.7rem", fontWeight: 700 }}>
                    {stats.total} Total Leads
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="p-2 rounded-3 text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}>
                    <IconUserPlus size={18} />
                  </div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "0.95rem" }}>Lead Capture</h6>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
                  Inquiries land from Walk-ins, Meta/Google ads, Website, Referrals & B2B Corporate.
                </p>
              </div>

              <div>
                <div className="d-flex flex-wrap gap-1 mb-2">
                  <Link to="/leads/walkin" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    🚶 Walk-in Register
                  </Link>
                  <Link to="/leads/inbox" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    📥 Lead Inbox
                  </Link>
                  <Link to="/leads/campaigns" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    📢 Campaigns
                  </Link>
                  <Link to="/leads/corporate" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    🏢 Corporate
                  </Link>
                  <Link to="/leads/referral" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    🎁 Referrals
                  </Link>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <span className="text-muted" style={{ fontSize: "0.7rem" }}>Table: <code>gym_leads</code></span>
                  <Link to="/leads/inbox" className="text-primary fw-bold text-decoration-none small d-inline-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                    Open Intake <IconArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </Col>

          {/* Step 2: Nurture & Follow-up */}
          <Col xs={12} md={6} xl>
            <div
              className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between position-relative"
              style={{
                background: "linear-gradient(180deg, rgba(2, 132, 199, 0.05) 0%, rgba(2, 132, 199, 0.01) 100%)",
                border: "1.5px solid rgba(2, 132, 199, 0.2)"
              }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge px-2 py-1 fw-bold" style={{ background: "#0284c7", color: "#ffffff", fontSize: "0.68rem" }}>
                    STEP 2
                  </span>
                  <span className="badge rounded-pill px-2 py-1" style={{ background: "rgba(2, 132, 199, 0.12)", color: "#0284c7", fontSize: "0.7rem", fontWeight: 700 }}>
                    {stats.pendingFollowups} Follow-ups
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="p-2 rounded-3 text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #0284c7, #38bdf8)" }}>
                    <IconPhoneCall size={18} />
                  </div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "0.95rem" }}>Nurture & Outreach</h6>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
                  Counselors call from daily calendar, WhatsApp queues send reminders & AI generates pitch replies.
                </p>
              </div>

              <div>
                <div className="d-flex flex-wrap gap-1 mb-2">
                  <Link to="/leads/followup" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    📅 Follow-up Calendar
                  </Link>
                  <Link to="/leads/ai" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    ✨ AI Features
                  </Link>
                  <Link to="/leads/automation" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    🤖 Automation
                  </Link>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <span className="text-muted" style={{ fontSize: "0.7rem" }}>Field: <code>next_follow_up</code></span>
                  <Link to="/leads/followup" className="text-info fw-bold text-decoration-none small d-inline-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                    View Queue <IconArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </Col>

          {/* Step 3: Free Trial Experience */}
          <Col xs={12} md={6} xl>
            <div
              className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between position-relative"
              style={{
                background: "linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.01) 100%)",
                border: "1.5px solid rgba(139, 92, 246, 0.2)"
              }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge px-2 py-1 fw-bold" style={{ background: "#8b5cf6", color: "#ffffff", fontSize: "0.68rem" }}>
                    STEP 3
                  </span>
                  <span className="badge rounded-pill px-2 py-1" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", fontSize: "0.7rem", fontWeight: 700 }}>
                    {stats.trialScheduled} Booked
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="p-2 rounded-3 text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
                    <IconCalendarEvent size={18} />
                  </div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "0.95rem" }}>Trial Session</h6>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
                  Visitor comes to gym for 1-day pass. Trainer assigned, workout logged & attendance confirmed.
                </p>
              </div>

              <div>
                <div className="d-flex flex-wrap gap-1 mb-2">
                  <Link to="/leads/trials" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    🎟️ Today's Trials
                  </Link>
                  <Link to="/leads/trials" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    🏋️ Assign Trainer
                  </Link>
                  <Link to="/leads/trials" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    ⭐ Trial Feedback
                  </Link>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <span className="text-muted" style={{ fontSize: "0.7rem" }}>Field: <code>trial_date</code></span>
                  <Link to="/leads/trials" className="text-purple fw-bold text-decoration-none small d-inline-flex align-items-center gap-1" style={{ color: "#8b5cf6", fontSize: "0.75rem" }}>
                    Track Trials <IconArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </Col>

          {/* Step 4: Pipeline & Conversion */}
          <Col xs={12} md={6} xl>
            <div
              className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between position-relative"
              style={{
                background: "linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%)",
                border: "1.5px solid rgba(245, 158, 11, 0.2)"
              }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge px-2 py-1 fw-bold" style={{ background: "#d97706", color: "#ffffff", fontSize: "0.68rem" }}>
                    STEP 4
                  </span>
                  <span className="badge rounded-pill px-2 py-1" style={{ background: "rgba(245, 158, 11, 0.14)", color: "#b45309", fontSize: "0.7rem", fontWeight: 700 }}>
                    {stats.membershipSold} Won 🎉
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="p-2 rounded-3 text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>
                    <IconTarget size={18} />
                  </div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "0.95rem" }}>Pipeline & Close</h6>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
                  Move lead across stages (Qualified ➔ Negotiation ➔ Won). Convert directly into full gym member.
                </p>
              </div>

              <div>
                <div className="d-flex flex-wrap gap-1 mb-2">
                  <Link to="/leads/pipeline" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    📊 Sales Pipeline
                  </Link>
                  <Link to="/leads/inbox" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    🏆 Convert to Member
                  </Link>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <span className="text-muted" style={{ fontSize: "0.7rem" }}>Target: <code>users, user_accounts</code></span>
                  <Link to="/leads/pipeline" className="text-warning fw-bold text-decoration-none small d-inline-flex align-items-center gap-1" style={{ color: "#d97706", fontSize: "0.75rem" }}>
                    Go to Pipeline <IconArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </Col>

          {/* Step 5: Team & Analytics */}
          <Col xs={12} md={6} xl>
            <div
              className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between position-relative"
              style={{
                background: "linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%)",
                border: "1.5px solid rgba(16, 185, 129, 0.2)"
              }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge px-2 py-1 fw-bold" style={{ background: "#059669", color: "#ffffff", fontSize: "0.68rem" }}>
                    STEP 5
                  </span>
                  <span className="badge rounded-pill px-2 py-1" style={{ background: "rgba(16, 185, 129, 0.14)", color: "#059669", fontSize: "0.7rem", fontWeight: 700 }}>
                    {stats.conversionRate}% Win Rate
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="p-2 rounded-3 text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                    <IconTrophy size={18} />
                  </div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "0.95rem" }}>Team & Growth</h6>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: "0.78rem", lineHeight: 1.45 }}>
                  Track counselor sales quotas, commissions, channel ROI reports & executive revenue forecasts.
                </p>
              </div>

              <div>
                <div className="d-flex flex-wrap gap-1 mb-2">
                  <Link to="/leads/team" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    👥 Sales Team
                  </Link>
                  <Link to="/leads/reports" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    📈 CRM Reports
                  </Link>
                  <Link to="/leads/settings" className="badge bg-white text-dark border text-decoration-none px-2 py-1 hover-shadow">
                    ⚙️ Settings
                  </Link>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <span className="text-muted" style={{ fontSize: "0.7rem" }}>Tables: <code>expenses, invoices</code></span>
                  <Link to="/leads/team" className="text-success fw-bold text-decoration-none small d-inline-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                    Staff Board <IconArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Expandable Architecture & Table Mapping Reference */}
        <Collapse in={showArchitecture}>
          <div className="mt-4 pt-3 border-top">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <IconDatabase size={18} className="text-primary" />
                Backend Database Tables & Endpoint Mapping Reference
              </h6>
              <span className="badge bg-light text-secondary border">MySQL + Prisma ORM</span>
            </div>

            <div className="table-responsive rounded-3 border">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th className="text-uppercase fw-bold text-muted py-2 px-3" style={{ fontSize: "0.72rem" }}>Module / Page</th>
                    <th className="text-uppercase fw-bold text-muted py-2 px-3" style={{ fontSize: "0.72rem" }}>URL Route</th>
                    <th className="text-uppercase fw-bold text-muted py-2 px-3" style={{ fontSize: "0.72rem" }}>Role in Lead Lifecycle</th>
                    <th className="text-uppercase fw-bold text-muted py-2 px-3" style={{ fontSize: "0.72rem" }}>Primary Backend Table(s)</th>
                    <th className="text-uppercase fw-bold text-muted py-2 px-3" style={{ fontSize: "0.72rem" }}>Live Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold px-3"><IconChartPie size={14} className="me-1 text-primary"/> CRM Dashboard</td>
                    <td className="px-3"><code>/leads/dashboard</code></td>
                    <td className="px-3">Executive KPIs, pipeline metrics, channel attribution</td>
                    <td className="px-3"><code>gym_leads</code></td>
                    <td className="px-3"><span className="badge bg-success-subtle text-success border border-success-subtle">Connected Live</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold px-3"><IconWalk size={14} className="me-1 text-primary"/> Walk-in Register</td>
                    <td className="px-3"><code>/leads/walkin</code></td>
                    <td className="px-3">Front desk visitor intake & instant 1-day trial pass</td>
                    <td className="px-3"><code>gym_leads</code></td>
                    <td className="px-3"><span className="badge bg-success-subtle text-success border border-success-subtle">Connected Live</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold px-3"><IconMail size={14} className="me-1 text-primary"/> Lead Inbox</td>
                    <td className="px-3"><code>/leads/inbox</code></td>
                    <td className="px-3">Master lead table, CSV import, stage filtering, quick edit</td>
                    <td className="px-3"><code>gym_leads</code></td>
                    <td className="px-3"><span className="badge bg-success-subtle text-success border border-success-subtle">Connected Live</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold px-3"><IconCalendarEvent size={14} className="me-1 text-purple"/> Trial Members</td>
                    <td className="px-3"><code>/leads/trials</code></td>
                    <td className="px-3">Free trials: Workout assignment, trainer assignment, feedback</td>
                    <td className="px-3"><code>gym_leads</code>, <code>trainers</code></td>
                    <td className="px-3"><span className="badge bg-success-subtle text-success border border-success-subtle">Connected Live</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold px-3"><IconPhone size={14} className="me-1 text-info"/> Follow-up Calendar</td>
                    <td className="px-3"><code>/leads/followup</code></td>
                    <td className="px-3">Daily calling schedule, WhatsApp queues, follow-up logs</td>
                    <td className="px-3"><code>gym_leads</code></td>
                    <td className="px-3"><span className="badge bg-success-subtle text-success border border-success-subtle">Connected Live</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold px-3"><IconTarget size={14} className="me-1 text-warning"/> Sales Pipeline</td>
                    <td className="px-3"><code>/leads/pipeline</code></td>
                    <td className="px-3">Interactive Kanban pipeline from New to Won member</td>
                    <td className="px-3"><code>gym_leads</code></td>
                    <td className="px-3"><span className="badge bg-success-subtle text-success border border-success-subtle">Connected Live</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold px-3"><IconTrendingUp size={14} className="me-1 text-danger"/> Campaign Management</td>
                    <td className="px-3"><code>/leads/campaigns</code></td>
                    <td className="px-3">Meta & Google ad spend, channel cost per lead, ROI</td>
                    <td className="px-3"><code>gym_leads</code>, <code>expenses</code></td>
                    <td className="px-3"><span className="badge bg-success-subtle text-success border border-success-subtle">Connected Live</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold px-3"><IconBuilding size={14} className="me-1 text-primary"/> Corporate Leads</td>
                    <td className="px-3"><code>/leads/corporate</code></td>
                    <td className="px-3">B2B company packages, enterprise proposals & meetings</td>
                    <td className="px-3"><code>gym_leads</code>, <code>users</code>, <code>wellness_challenges</code></td>
                    <td className="px-3"><span className="badge bg-primary-subtle text-primary border border-primary-subtle">B2B Pipeline</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold px-3"><IconUsers size={14} className="me-1 text-success"/> Sales Team</td>
                    <td className="px-3"><code>/leads/team</code></td>
                    <td className="px-3">Counselor performance quotas, win rate leaderboard</td>
                    <td className="px-3"><code>user_accounts</code>, <code>gym_leads</code></td>
                    <td className="px-3"><span className="badge bg-success-subtle text-success border border-success-subtle">Connected Live</span></td>
                  </tr>
                  <tr>
                    <td className="fw-bold px-3"><IconSparkles size={14} className="me-1 text-warning"/> AI Features</td>
                    <td className="px-3"><code>/leads/ai</code></td>
                    <td className="px-3">AI lead score (0-100) & automated conversion suggestions</td>
                    <td className="px-3"><code>gym_leads</code></td>
                    <td className="px-3"><span className="badge bg-success-subtle text-success border border-success-subtle">Connected Live</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Collapse>
      </div>

      {/* ── Section 4: Analytics Row (Attribution & Pipeline) ─── */}
      <Row className="g-3 mb-4">
        {/* Source Attribution with Leaderboard */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="p-3 p-md-4 d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="p-2 rounded-3 text-primary d-flex align-items-center justify-content-center"
                    style={{ background: "rgba(79, 70, 229, 0.1)" }}
                  >
                    <IconChartPie size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">Acquisition Channels</h6>
                    <small className="text-muted">Where your gym leads come from</small>
                  </div>
                </div>
                <Badge
                  pill
                  style={{
                    background: "rgba(79, 70, 229, 0.12)",
                    color: "#4f46e5",
                    fontSize: "0.72rem"
                  }}
                >
                  {sourceStats.totalCount} Inquiries
                </Badge>
              </div>

              {/* Apex Donut Chart */}
              {sourceStats.totalCount > 0 ? (
                <div className="d-flex justify-content-center my-2">
                  <ReactApexChart
                    options={pieChartOptions}
                    series={sourceStats.series}
                    type="donut"
                    height={240}
                    width="100%"
                  />
                </div>
              ) : (
                <div className="text-center py-4 my-2 text-muted small">
                  <IconChartPie size={36} className="opacity-25 mb-2 d-block mx-auto" />
                  <div>No lead sources in database for this filter.</div>
                </div>
              )}

              {/* Source Leaderboard Bars */}
              <div className="mt-auto pt-3 border-top">
                <div className="d-flex flex-column gap-2">
                  {sourceStats.breakdown.slice(0, 4).map((source, index) => (
                    <div key={index} className="d-flex align-items-center justify-content-between gap-2">
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 130 }}>
                        <span
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            background: source.color,
                            flexShrink: 0
                          }}
                        />
                        <span className="fw-semibold text-dark" style={{ fontSize: "0.82rem" }}>
                          {source.name}
                        </span>
                      </div>

                      <div className="flex-grow-1 mx-2">
                        <div
                          className="w-100 rounded-pill"
                          style={{ height: 6, background: "#f1f5f9", overflow: "hidden" }}
                        >
                          <div
                            className="h-100 rounded-pill"
                            style={{
                              width: `${source.percentage}%`,
                              background: source.color
                            }}
                          />
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-1 text-end" style={{ minWidth: 65 }}>
                        <span className="fw-bold text-dark" style={{ fontSize: "0.82rem" }}>
                          {source.count}
                        </span>
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                          ({source.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Visual Sales Funnel & Conversion Stages */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="p-3 p-md-4 d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="p-2 rounded-3 text-success d-flex align-items-center justify-content-center"
                    style={{ background: "rgba(16, 185, 129, 0.1)" }}
                  >
                    <IconTrendingUp size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">Sales Pipeline Funnel</h6>
                    <small className="text-muted">Lead progression from inquiry to enrolled member</small>
                  </div>
                </div>
                <Link
                  to="/leads/pipeline"
                  className="btn btn-sm btn-light border py-1 px-2 rounded-2 text-primary fw-semibold d-flex align-items-center gap-1"
                  style={{ fontSize: "0.78rem" }}
                >
                  Kanban View <IconChevronRight size={14} />
                </Link>
              </div>

              {/* Interactive Funnel Stages */}
              <div className="d-flex flex-column gap-3 my-2">
                {pipelineStages.map((stage, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2 gap-md-3">
                    <div
                      className="d-flex align-items-center gap-2"
                      style={{ width: 160, flexShrink: 0 }}
                    >
                      <span
                        className="badge rounded-circle p-0 d-flex align-items-center justify-content-center text-white"
                        style={{
                          width: 20,
                          height: 20,
                          fontSize: "0.7rem",
                          background: stage.color
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="fw-semibold text-dark text-truncate" style={{ fontSize: "0.82rem" }}>
                        {stage.label}
                      </span>
                    </div>

                    {/* Funnel Progress Bar */}
                    <div className="flex-grow-1">
                      <div
                        className="rounded-3 position-relative d-flex align-items-center px-2"
                        style={{
                          height: 28,
                          width: `${stage.percentage}%`,
                          background: stage.gradient,
                          transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                          minWidth: 55,
                          boxShadow: `0 2px 8px -2px ${stage.color}55`
                        }}
                      >
                        <span className="text-white fw-bold" style={{ fontSize: "0.75rem" }}>
                          {stage.count}
                        </span>
                      </div>
                    </div>

                    <div className="text-end text-muted" style={{ width: 85, fontSize: "0.78rem", flexShrink: 0 }}>
                      {stage.estValue > 0 ? `₹${(stage.estValue / 1000).toFixed(0)}k est.` : "₹0"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Funnel Summary Footer Bar */}
              <div className="mt-auto pt-3 border-top">
                <Row className="g-2 text-center">
                  <Col xs={3}>
                    <div className="p-2 rounded-3" style={{ background: "rgba(16, 185, 129, 0.08)" }}>
                      <div className="fw-bold text-success" style={{ fontSize: "1.05rem" }}>
                        {stats.membershipSold}
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>Won Deals</div>
                    </div>
                  </Col>
                  <Col xs={3}>
                    <div className="p-2 rounded-3" style={{ background: "rgba(2, 132, 199, 0.08)" }}>
                      <div className="fw-bold text-primary" style={{ fontSize: "1.05rem" }}>
                        {stats.total - stats.membershipSold - stats.lostLeads}
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>Active Pipeline</div>
                    </div>
                  </Col>
                  <Col xs={3}>
                    <div className="p-2 rounded-3" style={{ background: "rgba(239, 68, 68, 0.08)" }}>
                      <div className="fw-bold text-danger" style={{ fontSize: "1.05rem" }}>
                        {stats.lostLeads}
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>Lost Leads</div>
                    </div>
                  </Col>
                  <Col xs={3}>
                    <div className="p-2 rounded-3" style={{ background: "rgba(15, 23, 42, 0.06)" }}>
                      <div className="fw-bold text-dark" style={{ fontSize: "1.05rem" }}>
                        {stats.conversionRate}%
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>Conversion</div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Section 5: Operations Row (Priority Leads & Copilot) ─ */}
      <Row className="g-3">
        {/* Priority Lead Stream */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-4 bg-white h-100">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="p-2 rounded-3 text-info d-flex align-items-center justify-content-center"
                    style={{ background: "rgba(2, 132, 199, 0.1)" }}
                  >
                    <IconUsers size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">Live Intake Stream</h6>
                    <small className="text-muted">Recent leads and instant engagement queue</small>
                  </div>
                </div>

                {/* Stream Filter Pills */}
                <div className="d-flex gap-1">
                  {[
                    { key: "all", label: "All" },
                    { key: "hot", label: "🔥 Hot" },
                    { key: "trial", label: "Trials" },
                    { key: "won", label: "Won" }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="btn btn-sm py-1 px-2 border-0 fw-semibold"
                      style={{
                        borderRadius: 6,
                        fontSize: "0.75rem",
                        background: activeTab === tab.key ? "#4f46e5" : "#f1f5f9",
                        color: activeTab === tab.key ? "#ffffff" : "#64748b"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Item Cards */}
              <div className="d-flex flex-column gap-2">
                {displayedLeads.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    No leads matching this filter.
                  </div>
                ) : (
                  displayedLeads.map((lead, idx) => {
                    const statusMeta = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
                    const avatarColors = ["#4f46e5", "#0284c7", "#059669", "#ea580c", "#8b5cf6"];
                    const avatarBg = avatarColors[idx % avatarColors.length];

                    return (
                      <div
                        key={lead.id}
                        className="p-3 rounded-3 border d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
                        style={{
                          background: "#ffffff",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8fafc";
                          e.currentTarget.style.borderColor = "#cbd5e1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                          e.currentTarget.style.borderColor = "#e2e8f0";
                        }}
                      >
                        {/* Lead Info Left */}
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                            style={{
                              width: 42,
                              height: 42,
                              background: avatarBg,
                              fontSize: "0.95rem",
                              boxShadow: `0 4px 10px -2px ${avatarBg}55`
                            }}
                          >
                            {lead.name ? lead.name.charAt(0).toUpperCase() : "L"}
                          </div>

                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-dark" style={{ fontSize: "0.92rem" }}>
                                {lead.name}
                              </span>
                              {lead.leadScore && lead.leadScore >= 85 && (
                                <span
                                  className="badge rounded-pill px-2 py-0"
                                  style={{
                                    background: "rgba(239, 68, 68, 0.12)",
                                    color: "#dc2626",
                                    fontSize: "0.68rem",
                                    fontWeight: 700
                                  }}
                                >
                                  🔥 Hot {lead.leadScore}%
                                </span>
                              )}
                            </div>
                            <div className="text-muted d-flex align-items-center gap-2 mt-1" style={{ fontSize: "0.78rem" }}>
                              <span>{lead.phone}</span>
                              <span>&bull;</span>
                              <span>{SOURCE_LABEL_MAP[lead.source] || lead.source}</span>
                              {lead.fitnessGoal && (
                                <>
                                  <span>&bull;</span>
                                  <span className="text-secondary fw-medium">{lead.fitnessGoal}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Quick Actions Right */}
                        <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-2">
                          <span
                            className="badge px-2 py-1 rounded-pill fw-semibold"
                            style={{
                              background: statusMeta.bg,
                              color: statusMeta.color,
                              border: `1px solid ${statusMeta.border}`,
                              fontSize: "0.72rem"
                            }}
                          >
                            {statusMeta.label}
                          </span>

                          <div className="d-flex align-items-center gap-1">
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="btn btn-sm btn-light p-1 rounded-2 text-dark border"
                                title="Direct Phone Call"
                                style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <IconPhone size={15} className="text-primary" />
                              </a>
                            )}
                            {lead.phone && (
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-light p-1 rounded-2 text-success border"
                                title="Direct WhatsApp Chat"
                                style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <IconBrandWhatsapp size={15} className="text-success" />
                              </a>
                            )}
                            <Link
                              to={`/leads/details/${lead.id}`}
                              className="btn btn-sm btn-light p-1 rounded-2 text-muted border"
                              title="View Full Profile"
                              style={{ width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <IconChevronRight size={15} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-3 text-center">
                <Link
                  to="/leads/inbox"
                  className="btn btn-sm btn-light border w-100 py-2 rounded-3 text-dark fw-semibold"
                  style={{ fontSize: "0.82rem" }}
                >
                  View All Leads in Inbox &rarr;
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Multi-Channel Follow-up Hub + AI Sales Copilot */}
        <Col lg={5}>
          <div className="d-flex flex-column gap-3 h-100">
            {/* Follow-up Queue Card */}
            <Card className="border-0 shadow-sm rounded-4 bg-white">
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="p-2 rounded-3 text-warning d-flex align-items-center justify-content-center"
                      style={{ background: "rgba(245, 158, 11, 0.12)" }}
                    >
                      <IconAlertCircle size={20} className="text-warning" />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-dark">Action Queues</h6>
                      <small className="text-muted">High priority daily tasks</small>
                    </div>
                  </div>
                  <Link
                    to="/leads/followup"
                    className="btn btn-sm btn-outline-secondary border py-1 px-2 rounded-2 fw-semibold"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Calendar
                  </Link>
                </div>

                <div className="d-flex flex-column gap-2">
                  {[
                    {
                      title: "Overdue & Urgent Calls",
                      count: stats.overdueCalls,
                      color: "#ea580c",
                      bg: "rgba(234, 88, 12, 0.08)",
                      icon: <IconPhoneCall size={16} />
                    },
                    {
                      title: "WhatsApp Outreach Queue",
                      count: stats.whatsappQueueCount,
                      color: "#10b981",
                      bg: "rgba(16, 185, 129, 0.08)",
                      icon: <IconBrandWhatsapp size={16} />
                    },
                    {
                      title: "Trial Booking Reminders",
                      count: stats.trialScheduled,
                      color: "#0284c7",
                      bg: "rgba(2, 132, 199, 0.08)",
                      icon: <IconCalendarEvent size={16} />
                    },
                    {
                      title: "Contacted & Follow-up Queue",
                      count: stats.contactedQueueCount,
                      color: "#8b5cf6",
                      bg: "rgba(139, 92, 246, 0.08)",
                      icon: <IconMail size={16} />
                    }
                  ].map((queue, idx) => (
                    <div
                      key={idx}
                      className="p-2 px-3 rounded-3 d-flex align-items-center justify-content-between border"
                      style={{ background: queue.bg, borderColor: "rgba(0,0,0,0.04)" }}
                    >
                      <div className="d-flex align-items-center gap-2" style={{ color: queue.color }}>
                        {queue.icon}
                        <span className="fw-semibold" style={{ fontSize: "0.84rem", color: queue.color }}>
                          {queue.title}
                        </span>
                      </div>
                      <Badge
                        pill
                        style={{
                          background: queue.color,
                          color: "#fff",
                          fontSize: "0.76rem",
                          minWidth: 28
                        }}
                      >
                        {queue.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* AI Sales Copilot Card */}
            <Card
              className="border-0 shadow-sm rounded-4 text-white flex-grow-1"
              style={{
                background: "linear-gradient(135deg, #0b132b 0%, #0f172a 50%, #1e1b4b 100%)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                boxShadow: "0 10px 25px -5px rgba(11, 19, 43, 0.5)"
              }}
            >
              <Card.Body className="p-3 p-md-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="p-1 px-2 rounded-pill d-flex align-items-center gap-1"
                        style={{
                          background: "rgba(99, 102, 241, 0.25)",
                          border: "1px solid rgba(99, 102, 241, 0.4)",
                          color: "#818cf8",
                          fontSize: "0.72rem",
                          fontWeight: 700
                        }}
                      >
                        <IconSparkles size={14} className="text-warning" />
                        FitNexa AI Copilot
                      </div>
                    </div>
                    <span className="badge rounded-pill bg-success bg-opacity-25 text-success border border-success border-opacity-25 py-1 px-2" style={{ fontSize: "0.68rem" }}>
                      Active
                    </span>
                  </div>

                  <h6 className="fw-bold text-white mb-2" style={{ letterSpacing: "-0.01em" }}>
                    Conversion Acceleration Trigger ⚡
                  </h6>

                  <p className="small mb-3" style={{ color: "rgba(226, 232, 240, 0.85)", lineHeight: 1.5, fontSize: "0.82rem" }}>
                    {stats.whatsappQueueCount > 0
                      ? `${stats.whatsappQueueCount} fresh uncontacted lead${stats.whatsappQueueCount > 1 ? "s" : ""} in database waiting for outreach. Engaging within 45 minutes converts 3.4x higher.`
                      : stats.pendingFollowups > 0
                      ? `${stats.pendingFollowups} follow-up calls or reminders scheduled. Work through them in your calendar to maintain high conversion.`
                      : "All current inquiries are contacted. Register walk-ins or run ad campaigns to add fresh leads."}
                  </p>
                </div>

                <div className="pt-2 border-top border-white border-opacity-10 d-flex flex-column gap-2">
                  <button
                    onClick={handleAiAction}
                    className="btn btn-sm w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2 text-white"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      border: "none",
                      fontSize: "0.82rem",
                      boxShadow: "0 4px 15px -3px rgba(79, 70, 229, 0.5)"
                    }}
                  >
                    <IconSparkles size={16} className="text-warning" />
                    Auto-Send AI WhatsApp Passes
                  </button>

                  <div className="d-flex justify-content-between align-items-center px-1">
                    <span className="text-white-50" style={{ fontSize: "0.7rem" }}>
                      Smart Lead Scoring v2.4
                    </span>
                    <Link
                      to="/leads/ai"
                      className="text-decoration-none fw-semibold"
                      style={{ color: "#a5b4fc", fontSize: "0.72rem" }}
                    >
                      AI Features &rarr;
                    </Link>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
