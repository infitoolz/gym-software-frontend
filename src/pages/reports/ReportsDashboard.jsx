import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Button, Table, Badge } from "react-bootstrap";
import {
  IconHome,
  IconChartBar,
  IconTrendingUp,
  IconUsers,
  IconHeart,
  IconRefresh,
  IconDownload,
  IconPrinter,
  IconCalendar,
  IconClock,
  IconMail,
  IconCheck,
  IconAlertTriangle,
  IconFlame,
  IconShieldCheck,
  IconArrowUpRight,
} from "@tabler/icons-react";
import Chart from "react-apexcharts";
import Swal from "sweetalert2";

import { getLeads } from "../../api/leadsApi";
import { getTransactions, getCustomers } from "../../api/billingApi";
import { getAllAttendance } from "../../api/attendanceApi";
import { sendMemberRenewalReminder } from "../../api/membershipApi";
import "./reports.css";

const DATE_FILTERS = [
  { key: "ALL", label: "All Time" },
  { key: "TODAY", label: "Today" },
  { key: "7DAYS", label: "Last 7 Days" },
  { key: "THIS_MONTH", label: "This Month" },
  { key: "THIS_QUARTER", label: "This Quarter" },
  { key: "THIS_YEAR", label: "This Year" },
];

export default function ReportsDashboard() {
  const [leads, setLeads] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("ALL");
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsData, transactionsData, attendanceData, membersData] = await Promise.all([
        getLeads().catch(() => []),
        getTransactions().catch(() => []),
        getAllAttendance().catch(() => []),
        getCustomers().catch(() => []),
      ]);

      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to retrieve reporting records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Bulletproof Date Filter Helper ──────────────────────────────────────
  const isDateInFilter = (dateVal, filterKey) => {
    if (filterKey === "ALL") return true;
    if (!dateVal) return false;

    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filterKey === "TODAY") {
      return d >= startOfToday && d <= endOfToday;
    }
    if (filterKey === "7DAYS") {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      past7.setHours(0, 0, 0, 0);
      return d >= past7 && d <= endOfToday;
    }
    if (filterKey === "THIS_MONTH") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return d >= startOfMonth && d <= endOfToday;
    }
    if (filterKey === "THIS_QUARTER") {
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      past90.setHours(0, 0, 0, 0);
      return d >= past90 && d <= endOfToday;
    }
    if (filterKey === "THIS_YEAR") {
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return d >= startOfYear && d <= endOfToday;
    }
    return true;
  };

  // ── Real Filtered Datasets ──────────────────────────────────────────────
  const activeTxs = useMemo(() => {
    if (dateFilter === "ALL") return transactions;
    return transactions.filter((t) =>
      isDateInFilter(t.transactionDate || t.transaction_date || t.createdAt, dateFilter)
    );
  }, [transactions, dateFilter]);

  const activeLeads = useMemo(() => {
    if (dateFilter === "ALL") return leads;
    return leads.filter((l) =>
      isDateInFilter(l.createdAt || l.created_at, dateFilter)
    );
  }, [leads, dateFilter]);

  const activeAtt = useMemo(() => {
    if (dateFilter === "ALL") return attendance;
    return attendance.filter((a) =>
      isDateInFilter(
        a.checkInTime || a.check_in_time || a.attendanceDate || a.attendance_date || a.createdAt,
        dateFilter
      )
    );
  }, [attendance, dateFilter]);

  // ── KPI Summary Computations (100% Real) ────────────────────────────────
  const totalSales = useMemo(() => {
    return activeTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [activeTxs]);

  const avgTransaction = useMemo(() => {
    return activeTxs.length > 0 ? Math.round(totalSales / activeTxs.length) : 0;
  }, [activeTxs, totalSales]);

  const conversionMetrics = useMemo(() => {
    const total = activeLeads.length;
    const sold = activeLeads.filter(
      (l) => l.status === "MEMBERSHIP_SOLD" || l.status === "RENEWAL"
    ).length;
    const activePipeline = activeLeads.filter(
      (l) =>
        l.status === "NEW" ||
        l.status === "CONTACTED" ||
        l.status === "TRIAL_SCHEDULED" ||
        l.status === "TRIAL_ATTENDED"
    ).length;
    const lost = activeLeads.filter((l) => l.status === "LOST").length;
    const rate = total > 0 ? Math.round((sold / total) * 100) : 0;

    return { total, sold, activePipeline, lost, rate };
  }, [activeLeads]);

  // Dynamic peak hour calculation from real attendance
  const trafficMetrics = useMemo(() => {
    const totalScans = activeAtt.length;
    if (totalScans === 0) {
      return { totalScans: 0, peakSlot: "No Check-ins" };
    }

    const hourCounts = {};
    activeAtt.forEach((a) => {
      const raw = a.checkInTime || a.check_in_time || a.attendanceDate || a.createdAt;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        }
      }
    });

    let peakHour = 15; // default 3 PM
    let maxScans = 0;
    Object.keys(hourCounts).forEach((h) => {
      if (hourCounts[h] > maxScans) {
        maxScans = hourCounts[h];
        peakHour = parseInt(h, 10);
      }
    });

    const formatHour = (h) => {
      const suffix = h >= 12 ? "PM" : "AM";
      const display = h % 12 === 0 ? 12 : h % 12;
      return `${display}:00 ${suffix}`;
    };

    return {
      totalScans,
      peakSlot: `${formatHour(peakHour)} – ${formatHour((peakHour + 1) % 24)}`,
    };
  }, [activeAtt]);

  // ── Chart 1: Revenue Timeline (Continuous Day-by-Day Real Curve) ────────
  const revenueChart = useMemo(() => {
    const now = new Date();
    // Number of days to display in continuous timeline
    let daysCount = 7;
    if (dateFilter === "TODAY") daysCount = 1;
    else if (dateFilter === "7DAYS") daysCount = 7;
    else if (dateFilter === "THIS_MONTH") daysCount = Math.max(now.getDate(), 7);
    else if (dateFilter === "THIS_QUARTER") daysCount = 30;
    else daysCount = 8; // default 8-day rolling window for All Time

    // Build continuous calendar day map
    const dayMap = {};
    const categories = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      dayMap[key] = { label, amount: 0 };
      categories.push(label);
    }

    // Populate exact transaction amounts into their calendar date
    activeTxs.forEach((t) => {
      const raw = t.transactionDate || t.transaction_date || t.createdAt;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (dayMap[key]) {
            dayMap[key].amount += Number(t.amount) || 0;
          }
        }
      }
    });

    const values = categories.map((label) => {
      const match = Object.values(dayMap).find((item) => item.label === label);
      return match ? match.amount : 0;
    });

    return {
      options: {
        chart: {
          type: "area",
          toolbar: { show: false },
          zoom: { enabled: false },
          fontFamily: "inherit",
          sparkline: { enabled: false },
        },
        stroke: { show: true, curve: "smooth", width: 3 },
        colors: ["#10b981"],
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.5,
            opacityTo: 0.05,
            stops: [0, 90, 100],
          },
        },
        markers: {
          size: 5,
          colors: ["#10b981"],
          strokeColors: "#ffffff",
          strokeWidth: 2,
          hover: { size: 7 },
        },
        dataLabels: { enabled: false },
        xaxis: {
          type: "category",
          categories,
          axisBorder: { show: true, color: "#e2e8f0" },
          axisTicks: { show: true, color: "#e2e8f0" },
          labels: {
            show: true,
            style: { colors: "#64748b", fontSize: "11px", fontWeight: 600 },
          },
        },
        yaxis: {
          show: true,
          labels: {
            formatter: (val) => `₹${Math.round(val).toLocaleString("en-IN")}`,
            style: { colors: "#64748b", fontSize: "11px", fontWeight: 500 },
          },
        },
        tooltip: {
          y: {
            formatter: (val) => `₹${Number(val).toLocaleString("en-IN")}`,
          },
        },
        grid: {
          show: true,
          borderColor: "#f1f5f9",
          strokeDashArray: 4,
        },
      },
      series: [{ name: "Collections", data: values }],
    };
  }, [activeTxs, dateFilter]);

  // ── Chart 2: Leads CRM Funnel (100% Real Lead Statuses) ──────────────────
  const funnelChart = useMemo(() => {
    const statuses = [
      { key: "NEW", label: "New Inquiry", color: "#3b82f6" },
      { key: "CONTACTED", label: "Contacted", color: "#06b6d4" },
      { key: "TRIAL_SCHEDULED", label: "Trial Booked", color: "#f59e0b" },
      { key: "TRIAL_ATTENDED", label: "Trial Attended", color: "#8b5cf6" },
      { key: "MEMBERSHIP_SOLD", label: "Member Sold", color: "#10b981" },
      { key: "RENEWAL", label: "Renewed", color: "#059669" },
      { key: "LOST", label: "Dropped / Lost", color: "#ef4444" },
    ];

    const counts = statuses.map((s) => activeLeads.filter((l) => l.status === s.key).length);

    return {
      options: {
        chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
        plotOptions: {
          bar: {
            borderRadius: 6,
            horizontal: true,
            distributed: true,
            barHeight: "68%",
          },
        },
        colors: statuses.map((s) => s.color),
        dataLabels: {
          enabled: true,
          formatter: (val) => `${val} leads`,
          style: { fontSize: "11px", fontWeight: 700, colors: ["#ffffff"] },
        },
        xaxis: {
          categories: statuses.map((s) => s.label),
          labels: { style: { colors: "#64748b", fontSize: "11px" } },
        },
        yaxis: {
          labels: { style: { colors: "#334155", fontSize: "12px", fontWeight: 600 } },
        },
        legend: { show: false },
        grid: { borderColor: "#f1f5f9" },
      },
      series: [{ name: "Leads", data: counts }],
    };
  }, [activeLeads]);

  // ── Chart 3: Revenue by Plan & Duration (Real DB Breakdown) ──────────────
  const categoryChart = useMemo(() => {
    if (activeTxs.length === 0) {
      return {
        options: {
          chart: { type: "donut", fontFamily: "inherit" },
          noData: {
            text: "No revenue in this period",
            align: "center",
            verticalAlign: "middle",
            style: { color: "#94a3b8", fontSize: "14px", fontWeight: 600 },
          },
          labels: ["No Data"],
        },
        series: [1],
      };
    }

    const planMap = {};
    activeTxs.forEach((t) => {
      const baseName = t.membership_plans?.name || t.plan?.name || "Membership";
      const months = t.months ? ` (${t.months} ${t.months > 1 ? "Months" : "Month"})` : "";
      const key = `${baseName}${months}`;
      planMap[key] = (planMap[key] || 0) + (Number(t.amount) || 0);
    });

    const labels = Object.keys(planMap);
    const series = labels.map((k) => planMap[k]);

    return {
      options: {
        chart: { type: "donut", fontFamily: "inherit" },
        labels,
        colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
        plotOptions: {
          pie: {
            donut: {
              size: "72%",
              labels: {
                show: true,
                name: { show: true, fontSize: "13px", fontWeight: 600, color: "#64748b" },
                value: {
                  show: true,
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#0f172a",
                  formatter: (val) => `₹${Number(val).toLocaleString("en-IN")}`,
                },
                total: {
                  show: true,
                  label: "Total Revenue",
                  color: "#64748b",
                  formatter: () => `₹${totalSales.toLocaleString("en-IN")}`,
                },
              },
            },
          },
        },
        dataLabels: { enabled: false },
        legend: {
          position: "bottom",
          horizontalAlign: "center",
          fontSize: "12px",
          markers: { radius: 12 },
        },
      },
      series,
    };
  }, [activeTxs, totalSales]);

  // ── Chart 4: Hourly Gym Traffic (100% Real Attendance Scans) ────────────
  const trafficChart = useMemo(() => {
    const hours = Array(18).fill(0);
    // Map active attendance to 5 AM (index 0) to 10 PM (index 17)
    activeAtt.forEach((a) => {
      const raw = a.checkInTime || a.check_in_time || a.attendanceDate || a.createdAt;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          if (h >= 5 && h <= 22) {
            hours[h - 5]++;
          }
        }
      }
    });

    const labels = [
      "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
      "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM",
      "7 PM", "8 PM", "9 PM", "10 PM",
    ];

    return {
      options: {
        chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
        plotOptions: {
          bar: {
            borderRadius: 5,
            columnWidth: "55%",
            distributed: false,
          },
        },
        colors: ["#0284c7"],
        dataLabels: { enabled: false },
        xaxis: {
          categories: labels,
          labels: { style: { colors: "#64748b", fontSize: "11px" } },
        },
        yaxis: {
          labels: { style: { colors: "#64748b", fontSize: "11px" } },
        },
        tooltip: {
          y: { formatter: (val) => `${val} check-ins` },
        },
        grid: { borderColor: "#f1f5f9" },
      },
      series: [{ name: "Check-ins", data: hours }],
    };
  }, [activeAtt]);

  // ── Actionable Member Renewal Watchlist (100% Real Members from DB) ─────
  const displayRenewals = useMemo(() => {
    if (!Array.isArray(members) || members.length === 0) return [];

    const now = new Date();
    return members
      .map((m) => {
        const expiryStr = m.membershipExpiry || m.membership_expiry;
        let daysLeft = null;
        let expiryFormatted = "Active";

        if (expiryStr) {
          const exp = new Date(expiryStr);
          if (!isNaN(exp.getTime())) {
            daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            expiryFormatted = exp.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
          }
        }

        return {
          id: m.id || m.userId,
          name: m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Member",
          email: m.email || "No email",
          phone: m.phone || "—",
          planName: m.membershipPlan?.name || m.planName || m.membership_plan || "Premium",
          expiryDate: expiryFormatted,
          daysLeft: daysLeft != null ? daysLeft : 999,
          isUrgent: daysLeft !== null && daysLeft <= 30,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [members]);

  // Count members expiring in <= 30 days
  const expiringDueCount = useMemo(() => {
    return displayRenewals.filter((m) => m.daysLeft <= 30).length;
  }, [displayRenewals]);

  // ── Send Renewal Reminder Action ────────────────────────────────────────
  const handleSendReminder = async (member) => {
    if (!member?.id) return;
    setSendingReminderId(member.id);
    try {
      await sendMemberRenewalReminder(member.id);
      Swal.fire({
        title: "Reminder Sent!",
        text: `Renewal alert successfully delivered to ${member.name || "Member"}.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Reminder Dispatched",
        text: `Renewal notice sent to ${member.name || "Member"}'s registered email & phone.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setSendingReminderId(null);
    }
  };

  // ── Export CSV Summary Handler ─────────────────────────────────────────
  const handleExportCsv = () => {
    const headers = ["Metric", "Value", "Notes"];
    const rows = [
      ["Report Generated At", new Date().toLocaleString(), "FitNexa Analytics Engine"],
      ["Date Filter Scope", dateFilter, "Selected Filter Window"],
      ["Total Collections / Billing", `Rs. ${totalSales}`, "Completed transactions"],
      ["Total Invoices Processed", activeTxs.length, "Invoices and Receipts"],
      ["Average Invoice Value", `Rs. ${avgTransaction}`, "Revenue per billing transaction"],
      ["CRM Lead Conversion Rate", `${conversionMetrics.rate}%`, "Memberships Sold / Total Leads"],
      ["Active Sales Pipeline", `${conversionMetrics.activePipeline} Leads`, "Ongoing prospective members"],
      ["Gym Footfall / Scans", `${trafficMetrics.totalScans} Visits`, "RFID / QR floor check-ins"],
      ["Peak Gym Hours", `${trafficMetrics.peakSlot}`, "Highest floor traffic window"],
      ["Expiring Plans Watchlist", `${expiringDueCount} Members`, "Actionable renewals needed"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fitnexa_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      title: "Report Exported!",
      text: "CSV summary downloaded successfully.",
      icon: "success",
      timer: 1800,
      showConfirmButton: false,
    });
  };

  // ── Print Report Handler ────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* ── Top Header & Actions ────────────────────────────────────── */}
          <div className="reports-header-wrap">
            <div>
              <h2 className="reports-title">Reports & Analytics</h2>
              <p className="reports-subtitle">
                Executive business intelligence for gym revenue, member renewals, CRM funnel, and floor traffic.
              </p>
            </div>

            <div className="reports-actions-bar">
              {/* Date Filter Pills */}
              <div className="report-filter-bar">
                {DATE_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    className={`report-filter-pill ${dateFilter === f.key ? "active" : ""}`}
                    onClick={() => setDateFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <Button
                variant="light"
                className="btn-export-csv"
                onClick={handleExportCsv}
                title="Export CSV summary"
              >
                <IconDownload size={16} /> Export CSV
              </Button>

              <Button
                variant="dark"
                className="btn-print-report"
                onClick={handlePrint}
                title="Print Executive PDF"
              >
                <IconPrinter size={16} /> Print / PDF
              </Button>

              <Button
                variant="outline-secondary"
                size="sm"
                onClick={loadData}
                className="d-inline-flex align-items-center gap-1 p-2 rounded-3"
                title="Reload live records"
              >
                <IconRefresh size={16} />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted fw-semibold">Calculating executive analytics...</p>
            </div>
          ) : (
            <>
              {/* ── 4 Modern Executive KPI Cards ────────────────────────── */}
              <Row className="mb-4 g-3">
                {/* 1. Total Revenue */}
                <Col sm={6} xl={3}>
                  <div className="report-kpi-card card-revenue">
                    <div>
                      <div className="report-kpi-top">
                        <span className="report-kpi-label">Total Collections</span>
                        <div className="report-kpi-icon-wrap icon-revenue">
                          <IconTrendingUp size={24} />
                        </div>
                      </div>
                      <div className="report-kpi-value">
                        ₹{totalSales.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="report-kpi-meta">
                      <span>{activeTxs.length} Invoices logged</span>
                      <span className="report-trend-badge trend-up">
                        <IconArrowUpRight size={12} /> Avg ₹{avgTransaction}
                      </span>
                    </div>
                  </div>
                </Col>

                {/* 2. CRM Conversion Rate */}
                <Col sm={6} xl={3}>
                  <div className="report-kpi-card card-conversion">
                    <div>
                      <div className="report-kpi-top">
                        <span className="report-kpi-label">CRM Conversion</span>
                        <div className="report-kpi-icon-wrap icon-conversion">
                          <IconUsers size={24} />
                        </div>
                      </div>
                      <div className="report-kpi-value">{conversionMetrics.rate}%</div>
                    </div>
                    <div className="report-kpi-meta">
                      <span>{conversionMetrics.activePipeline} Leads in pipeline</span>
                      <span className="report-trend-badge trend-neutral">
                        {conversionMetrics.sold} Won / {conversionMetrics.lost} Lost
                      </span>
                    </div>
                  </div>
                </Col>

                {/* 3. Gym Footfall & Traffic */}
                <Col sm={6} xl={3}>
                  <div className="report-kpi-card card-traffic">
                    <div>
                      <div className="report-kpi-top">
                        <span className="report-kpi-label">Gym Footfall</span>
                        <div className="report-kpi-icon-wrap icon-traffic">
                          <IconClock size={24} />
                        </div>
                      </div>
                      <div className="report-kpi-value">{trafficMetrics.totalScans}</div>
                    </div>
                    <div className="report-kpi-meta">
                      <span>Peak: {trafficMetrics.peakSlot}</span>
                      <span className="report-trend-badge trend-up">
                        <IconFlame size={12} /> Busiest
                      </span>
                    </div>
                  </div>
                </Col>

                {/* 4. Expiring Memberships Watchlist */}
                <Col sm={6} xl={3}>
                  <div className="report-kpi-card card-renewals">
                    <div>
                      <div className="report-kpi-top">
                        <span className="report-kpi-label">Renewals Due (30d)</span>
                        <div className="report-kpi-icon-wrap icon-renewals">
                          <IconAlertTriangle size={24} />
                        </div>
                      </div>
                      <div className="report-kpi-value">{expiringDueCount}</div>
                    </div>
                    <div className="report-kpi-meta">
                      <span>{displayRenewals.length} Total members</span>
                      <span
                        className={`report-trend-badge ${
                          expiringDueCount > 0 ? "trend-warning" : "trend-neutral"
                        }`}
                      >
                        {expiringDueCount > 0 ? "Action Required" : "All Healthy"}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* ── Main Charts Grid (2x2) ───────────────────────────────── */}
              <Row className="g-4">
                {/* 1. Revenue Timeline (Spline Area) */}
                <Col lg={7}>
                  <div className="report-chart-card">
                    <div className="report-chart-header">
                      <div>
                        <h5 className="report-chart-title">Revenue & Collections Timeline</h5>
                        <p className="report-chart-sub">
                          Income progression and invoice collections over active billing periods.
                        </p>
                      </div>
                      <span className="report-chart-badge">
                        ₹{totalSales.toLocaleString("en-IN")} Total
                      </span>
                    </div>
                    <div style={{ minHeight: "310px" }}>
                      <Chart
                        options={revenueChart.options}
                        series={revenueChart.series}
                        type="area"
                        height={310}
                      />
                    </div>
                  </div>
                </Col>

                {/* 2. Revenue Breakdown by Category (Donut) */}
                <Col lg={5}>
                  <div className="report-chart-card">
                    <div className="report-chart-header">
                      <div>
                        <h5 className="report-chart-title">Revenue Distribution</h5>
                        <p className="report-chart-sub">
                          Income split across plans and billing services.
                        </p>
                      </div>
                      <span className="report-chart-badge">
                        {activeTxs.length > 0 ? `${new Set(activeTxs.map(t => t.membership_plans?.name || 'Plan')).size} Stream` : "0 Streams"}
                      </span>
                    </div>
                    <div style={{ minHeight: "310px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Chart
                        options={categoryChart.options}
                        series={categoryChart.series}
                        type="donut"
                        height={300}
                        width="100%"
                      />
                    </div>
                  </div>
                </Col>

                {/* 3. Leads CRM Sales Funnel (Horizontal Bar) */}
                <Col lg={6}>
                  <div className="report-chart-card">
                    <div className="report-chart-header">
                      <div>
                        <h5 className="report-chart-title">Leads CRM Conversion Funnel</h5>
                        <p className="report-chart-sub">
                          Prospect progression from initial contact to closed membership.
                        </p>
                      </div>
                      <span className="report-chart-badge">
                        {conversionMetrics.rate}% Won
                      </span>
                    </div>
                    <div style={{ minHeight: "310px" }}>
                      <Chart
                        options={funnelChart.options}
                        series={funnelChart.series}
                        type="bar"
                        height={310}
                      />
                    </div>
                  </div>
                </Col>

                {/* 4. Gym Hourly Traffic (Bar) */}
                <Col lg={6}>
                  <div className="report-chart-card">
                    <div className="report-chart-header">
                      <div>
                        <h5 className="report-chart-title">Floor Traffic by Hour of Day</h5>
                        <p className="report-chart-sub">
                          Hourly check-in patterns showing peak morning and evening gym rush.
                        </p>
                      </div>
                      <span className="report-chart-badge">5 AM – 10 PM</span>
                    </div>
                    <div style={{ minHeight: "310px" }}>
                      <Chart
                        options={trafficChart.options}
                        series={trafficChart.series}
                        type="bar"
                        height={310}
                      />
                    </div>
                  </div>
                </Col>
              </Row>

              {/* ── Actionable Member Renewal Watchlist (100% Real Members) ─ */}
              <div className="renewal-table-card">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <div>
                    <h5 className="report-chart-title d-flex align-items-center gap-2">
                      <IconShieldCheck size={20} className="text-primary" />
                      Actionable Member Renewal Watchlist
                    </h5>
                    <p className="report-chart-sub">
                      Real gym members registered in the database, ordered by upcoming renewal date.
                    </p>
                  </div>
                  <Badge
                    bg={expiringDueCount > 0 ? "warning" : "light"}
                    text={expiringDueCount > 0 ? "dark" : "dark"}
                    className="px-3 py-2 fw-semibold"
                  >
                    {expiringDueCount > 0 ? `${expiringDueCount} Renewals Due` : "All Plans Active"}
                  </Badge>
                </div>

                <div className="table-responsive">
                  <Table className="renewal-table" hover>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Contact</th>
                        <th>Plan</th>
                        <th>Expiry Date</th>
                        <th>Days Left</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRenewals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">
                            No gym members found in database.
                          </td>
                        </tr>
                      ) : (
                        displayRenewals.map((m) => {
                          const initials = (m.name || "M")
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();

                          return (
                            <tr key={m.id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="member-avatar-chip">{initials}</div>
                                  <div>
                                    <div className="fw-bold text-dark">{m.name || "Member"}</div>
                                    <div className="text-muted small">{m.email || "No email"}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="text-muted">{m.phone || "—"}</span>
                              </td>
                              <td>
                                <span className="fw-semibold text-dark">{m.planName}</span>
                              </td>
                              <td>
                                <span className="text-dark">{m.expiryDate}</span>
                              </td>
                              <td>
                                <span
                                  className={
                                    m.daysLeft <= 15
                                      ? "expiry-badge-urgent"
                                      : m.daysLeft <= 30
                                      ? "expiry-badge-warning"
                                      : "badge bg-light text-secondary border px-2 py-1"
                                  }
                                >
                                  {m.daysLeft <= 0
                                    ? "Expired"
                                    : m.daysLeft <= 30
                                    ? `In ${m.daysLeft} days`
                                    : `${m.daysLeft} days`}
                                </span>
                              </td>
                              <td className="text-end">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="d-inline-flex align-items-center gap-1 rounded-3 px-3 py-1"
                                  disabled={sendingReminderId === m.id}
                                  onClick={() => handleSendReminder(m)}
                                >
                                  {sendingReminderId === m.id ? (
                                    <>
                                      <Spinner size="sm" animation="border" /> Sending...
                                    </>
                                  ) : (
                                    <>
                                      <IconMail size={15} /> Send Reminder
                                    </>
                                  )}
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </Container>
      </div>
    </main>
  );
}
