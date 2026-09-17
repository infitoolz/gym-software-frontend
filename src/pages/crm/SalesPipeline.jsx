import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import {
  IconTrendingDown, IconTrendingUp, IconUsers, IconUserCheck,
  IconRefresh, IconChartBar, IconArrowDown, IconCoinRupee,
  IconPercentage, IconStar, IconArrowRight, IconChevronRight
} from "@tabler/icons-react";
import ReactApexChart from "react-apexcharts";
import { getLeads } from "../../api/leadsApi";

/* ─── Pipeline Stage Definitions ────────────────────────────── */
const PIPELINE_STAGES = [
  {
    id: "NEW",
    label: "New Leads",
    emoji: "🆕",
    hex: "#6366f1",
    light: "#ede9fe",
    border: "#c4b5fd",
    description: "Fresh leads entering the funnel",
    statuses: ["NEW"],
  },
  {
    id: "QUALIFIED",
    label: "Qualified",
    emoji: "🙋",
    hex: "#0ea5e9",
    light: "#e0f2fe",
    border: "#bae6fd",
    description: "Contacted & showed interest",
    statuses: ["CONTACTED", "INTERESTED"],
  },
  {
    id: "TRIAL",
    label: "Trial",
    emoji: "📅",
    hex: "#8b5cf6",
    light: "#f3e8ff",
    border: "#d8b4fe",
    description: "Trial booked or completed",
    statuses: ["TRIAL_BOOKED", "TRIAL_COMPLETED"],
  },
  {
    id: "NEGOTIATION",
    label: "Negotiation",
    emoji: "🤝",
    hex: "#ec4899",
    light: "#fce7f3",
    border: "#f9a8d4",
    description: "In discussion / closing stage",
    statuses: ["NEGOTIATION"],
  },
  {
    id: "MEMBERSHIP",
    label: "Membership",
    emoji: "🏆",
    hex: "#16a34a",
    light: "#dcfce7",
    border: "#86efac",
    description: "Converted to paid member",
    statuses: ["WON"],
  },
  {
    id: "RENEWAL",
    label: "Renewal",
    emoji: "🔄",
    hex: "#f59e0b",
    light: "#fef9c3",
    border: "#fde68a",
    description: "Renewed or returning members",
    statuses: ["RENEWAL"],
  },
  {
    id: "REFERRAL",
    label: "Referral",
    emoji: "🌟",
    hex: "#10b981",
    light: "#d1fae5",
    border: "#6ee7b7",
    description: "Leads from referral program",
    statuses: ["REFERRAL"],
  },
];

/* ─── Drop-off arrow ────────────────────────────────────────── */
function DropArrow({ from, to, dropPct }) {
  const isGood = dropPct <= 30;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "6px 0", position: "relative",
    }}>
      <div style={{
        width: 2, height: 24,
        background: `linear-gradient(180deg, ${from}88, ${to}88)`,
      }} />
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 20,
        background: isGood ? "#dcfce7" : "#fee2e2",
        color: isGood ? "#16a34a" : "#ef4444",
        fontSize: 11, fontWeight: 700, margin: "2px 0",
      }}>
        <IconTrendingDown size={12} />
        -{dropPct}% drop-off
      </div>
      <div style={{ width: 2, height: 24, background: `linear-gradient(180deg, ${from}88, ${to}88)` }} />
      <IconArrowDown size={18} color={to} style={{ marginTop: -4 }} />
    </div>
  );
}

/* ─── Funnel Stage Row ──────────────────────────────────────── */
function FunnelStage({ stage, count, total, prevCount, maxCount, leads, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const width = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 8 : 0) : 0;
  const pct   = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  const dropPct = prevCount > 0 ? (((prevCount - count) / prevCount) * 100).toFixed(0) : null;
  const stageLeads = leads.filter(l => stage.statuses.includes(l.status));
  const avgScore = stageLeads.length > 0
    ? (stageLeads.reduce((s, l) => s + (l.conversionProbability || 50), 0) / stageLeads.length).toFixed(0)
    : null;

  return (
    <div>
      {/* Stage row */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
          background: expanded ? stage.light : "#fff",
          border: `1.5px solid ${expanded ? stage.border : "#f1f5f9"}`,
          borderRadius: 16, cursor: "pointer",
          transition: "all 0.22s",
          marginBottom: 4,
        }}
      >
        {/* Stage label */}
        <div style={{ width: 160, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: stage.light, border: `1.5px solid ${stage.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>{stage.emoji}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{stage.label}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{stage.description}</div>
          </div>
        </div>

        {/* Funnel bar */}
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            height: 36, background: "#f1f5f9", borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${width}%`,
              background: `linear-gradient(90deg, ${stage.hex}, ${stage.hex}cc)`,
              borderRadius: 12,
              display: "flex", alignItems: "center", paddingLeft: 12,
              transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
              {count > 0 && (
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{count}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ width: 120, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: stage.hex }}>{count}</div>
          <div style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 600 }}>{pct}% of total</div>
        </div>

        {/* Avg conversion prob */}
        {avgScore && (
          <div style={{
            width: 64, textAlign: "center", padding: "6px 10px", borderRadius: 12,
            background: stage.light, border: `1.5px solid ${stage.border}`,
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: stage.hex }}>{avgScore}%</div>
            <div style={{ fontSize: 9, color: stage.hex, fontWeight: 600, textTransform: "uppercase" }}>Conv.</div>
          </div>
        )}

        {/* Expand chevron */}
        <IconChevronRight
          size={18} color="#94a3b8"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
        />
      </div>

      {/* Expanded leads list */}
      {expanded && stageLeads.length > 0 && (
        <div style={{
          background: stage.light, border: `1.5px solid ${stage.border}`,
          borderRadius: "0 0 16px 16px", marginBottom: 4, padding: "12px 16px",
          display: "flex", flexWrap: "wrap", gap: 8,
        }}>
          {stageLeads.slice(0, 12).map(lead => (
            <div key={lead.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 12px", borderRadius: 12,
              background: "#fff", border: `1px solid ${stage.border}`,
              fontSize: 12,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, background: stage.hex,
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>
                {lead.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#1e293b" }}>{lead.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 10.5 }}>{lead.phone}</div>
              </div>
              <div style={{
                marginLeft: 4, padding: "2px 7px", borderRadius: 20,
                background: stage.hex + "22", color: stage.hex, fontSize: 10.5, fontWeight: 700,
              }}>
                {lead.conversionProbability || 50}%
              </div>
            </div>
          ))}
          {stageLeads.length > 12 && (
            <div style={{ padding: "7px 12px", borderRadius: 12, background: "#fff", border: `1px solid ${stage.border}`, fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              +{stageLeads.length - 12} more
            </div>
          )}
        </div>
      )}
      {expanded && stageLeads.length === 0 && (
        <div style={{ padding: "12px 20px", fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 4 }}>
          No leads in this stage.
        </div>
      )}
    </div>
  );
}

/* ─── CSS Trapezoid Funnel ───────────────────────────────────── */
function CssFunnel({ stages, maxCount }) {
  // Use demo values when all counts are 0 so the funnel always renders
  const allZero = stages.every(s => s.count === 0);
  const DEMO    = [120, 80, 45, 28, 20, 12, 6];

  const displayCounts = stages.map((s, i) =>
    allZero ? DEMO[i] ?? 0 : s.count
  );
  const topVal  = Math.max(...displayCounts, 1);

  // Min width so even the last stage is visible (narrows from 100% → 18%)
  const minPct  = 18;
  const widths  = displayCounts.map(c =>
    minPct + ((c / topVal) * (100 - minPct))
  );

  return (
    <div style={{ position: "relative" }}>
      {allZero && (
        <div style={{
          position: "absolute", top: 0, right: 0, zIndex: 1,
          padding: "2px 10px", borderRadius: 20,
          background: "#fef9c3", color: "#f59e0b",
          fontSize: 10.5, fontWeight: 700,
        }}>
          Demo Preview
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 0" }}>
        {stages.map((stage, idx) => {
          const count   = displayCounts[idx];
          const w       = widths[idx];
          const nextW   = idx < widths.length - 1 ? widths[idx + 1] : w * 0.85;
          const pct     = topVal > 0 ? ((count / topVal) * 100).toFixed(0) : 0;
          const dropPct = idx > 0 && displayCounts[idx - 1] > 0
            ? (((displayCounts[idx - 1] - count) / displayCounts[idx - 1]) * 100).toFixed(0)
            : null;

          return (
            <div key={stage.id} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Drop-off badge */}
              {dropPct !== null && (
                <div style={{
                  fontSize: 10.5, fontWeight: 700, margin: "1px 0",
                  padding: "2px 9px", borderRadius: 20,
                  background: Number(dropPct) > 40 ? "#fee2e2" : "#dcfce7",
                  color:      Number(dropPct) > 40 ? "#ef4444" : "#16a34a",
                }}>
                  ▼ -{dropPct}% drop
                </div>
              )}

              {/* Trapezoid bar */}
              <div
                title={`${stage.label}: ${count} leads`}
                style={{
                  width: `${w}%`,
                  height: 34,
                  background: `linear-gradient(90deg, ${stage.hex}ee, ${stage.hex}bb)`,
                  borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 12px",
                  boxShadow: `0 2px 8px ${stage.hex}33`,
                  transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                  position: "relative", overflow: "hidden",
                  cursor: "default",
                }}
              >
                {/* Shimmer effect */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                  borderRadius: 8,
                }}/>

                <div style={{ display: "flex", alignItems: "center", gap: 7, zIndex: 1 }}>
                  <span style={{ fontSize: 14 }}>{stage.emoji}</span>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
                    {stage.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 1 }}>
                  <span style={{
                    background: "rgba(255,255,255,0.28)",
                    color: "#fff", fontWeight: 800, fontSize: 11,
                    borderRadius: 20, padding: "1px 8px",
                  }}>
                    {pct}%
                  </span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 14, minWidth: 24, textAlign: "right" }}>
                    {count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom label */}
      <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
        {allZero
          ? "Add leads to see real funnel data"
          : `${displayCounts[displayCounts.length - 1]} of ${displayCounts[0]} leads reached the bottom`}
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

export default function SalesPipeline() {
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try { setLeads(Array.isArray(await getLeads()) ? await getLeads() : []); }
    catch { console.error("Failed to load leads"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Compute stage counts ─────────────────────────────── */
  const stageCounts = PIPELINE_STAGES.map(s => ({
    ...s,
    count: leads.filter(l => s.statuses.includes(l.status)).length,
  }));

  const total   = leads.length;
  const maxCount = Math.max(...stageCounts.map(s => s.count), 1);
  const won      = stageCounts.find(s => s.id === "MEMBERSHIP")?.count || 0;
  const revenue  = leads.filter(l => l.status === "WON").reduce((s, l) => s + (l.expectedRevenue || 15000), 0);
  const convRate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;
  const avgScore = leads.length > 0
    ? (leads.reduce((s, l) => s + (l.conversionProbability || 50), 0) / leads.length).toFixed(0)
    : 0;

  /* ── Chart: Stage distribution bar chart ─────────────── */
  const barOptions = {
    chart: { type: "bar", toolbar: { show: false }, sparkline: { enabled: false } },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "55%", distributed: true } },
    colors: PIPELINE_STAGES.map(s => s.hex),
    dataLabels: { enabled: true, style: { fontSize: "12px", fontWeight: 700 } },
    xaxis: {
      categories: PIPELINE_STAGES.map(s => s.label),
      labels: { style: { fontSize: "12px" } },
    },
    yaxis: { labels: { style: { fontSize: "12px" } } },
    legend: { show: false },
    grid: { borderColor: "#f1f5f9" },
    tooltip: {
      y: { formatter: (v) => `${v} leads` },
    },
  };
  const barSeries = [{ name: "Leads", data: stageCounts.map(s => s.count) }];

  /* funnelOptions/funnelSeries removed — replaced with CssFunnel below */

  return (
    <div className="themebody-wrap">
      <div className="theme-body">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "#1e293b" }}>📊 Sales Pipeline</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            Visual funnel — track every lead from acquisition to conversion
          </p>
        </div>
        <button onClick={load} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
          borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff",
          color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          <IconRefresh size={15} /> Refresh
        </button>
      </div>

      {/* ── KPI Row ────────────────────────────────────── */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        {[
          { label: "Total Leads",     value: total,             icon: <IconUsers size={20} />,      color: "#6366f1", bg: "#ede9fe" },
          { label: "Converted",       value: won,               icon: <IconUserCheck size={20} />,  color: "#16a34a", bg: "#dcfce7" },
          { label: "Conversion Rate", value: `${convRate}%`,    icon: <IconPercentage size={20} />, color: "#0ea5e9", bg: "#e0f2fe" },
          { label: "Avg Conv. Prob.", value: `${avgScore}%`,    icon: <IconStar size={20} />,       color: "#f59e0b", bg: "#fef9c3" },
          { label: "Revenue (Est.)",  value: `₹${revenue.toLocaleString("en-IN")}`, icon: <IconCoinRupee size={20} />, color: "#10b981", bg: "#dcfce7" },
        ].map((kpi, i) => (
          <div key={i} style={{
            flex: "1 1 150px", background: "#fff", borderRadius: 16,
            border: "1.5px solid #e2e8f0", padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: kpi.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: kpi.color, flexShrink: 0,
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 400 }}>
          <Spinner animation="border" variant="primary" style={{ width: 48, height: 48, borderWidth: 4 }} />
          <p className="mt-3 text-muted fw-semibold">Loading pipeline data…</p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

          {/* ── Left: Interactive Funnel ───────────────── */}
          <div style={{ flex: "2 1 520px", minWidth: 0 }}>
            <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: "24px" }}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconChartBar size={20} color="#6366f1" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0">Interactive Pipeline Funnel</h6>
                  <p className="text-muted mb-0" style={{ fontSize: 12 }}>Click any stage to expand and see leads</p>
                </div>
              </div>

              {/* Stages */}
              {stageCounts.map((stage, idx) => (
                <div key={stage.id}>
                  <FunnelStage
                    stage={stage}
                    count={stage.count}
                    total={total}
                    prevCount={idx > 0 ? stageCounts[idx - 1].count : null}
                    maxCount={maxCount}
                    leads={leads}
                    isLast={idx === stageCounts.length - 1}
                  />
                  {/* Drop-off arrow between stages */}
                  {idx < stageCounts.length - 1 && stage.count > 0 && stageCounts[idx + 1].count >= 0 && (
                    <DropArrow
                      from={stage.hex}
                      to={stageCounts[idx + 1].hex}
                      dropPct={Math.max(0, (((stage.count - stageCounts[idx + 1].count) / Math.max(stage.count, 1)) * 100).toFixed(0))}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Charts + Insights ───────────────── */}
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

            {/* ── CSS Trapezoid Funnel ─────────────────── */}
            <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: "20px" }}>
              <h6 className="fw-bold mb-3" style={{ fontSize: 13, color: "#1e293b" }}>📉 Conversion Funnel</h6>
              <CssFunnel stages={stageCounts} maxCount={maxCount} />
            </div>

            {/* Stage distribution bar */}
            <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: "20px" }}>
              <h6 className="fw-bold mb-3" style={{ fontSize: 13, color: "#1e293b" }}>📊 Stage Distribution</h6>
              <ReactApexChart
                options={barOptions}
                series={barSeries}
                type="bar"
                height={200}
              />
            </div>

            {/* Stage Summary Table */}
            <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", padding: "20px" }}>
              <h6 className="fw-bold mb-3" style={{ fontSize: 13, color: "#1e293b" }}>📋 Stage Summary</h6>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {stageCounts.map((s, idx) => {
                  const prev = idx > 0 ? stageCounts[idx - 1].count : s.count;
                  const drop = prev > 0 ? (((prev - s.count) / prev) * 100).toFixed(0) : 0;
                  return (
                    <div key={s.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", borderRadius: 12,
                      background: "#f8fafc", border: "1px solid #f1f5f9",
                    }}>
                      <span style={{ fontSize: 16 }}>{s.emoji}</span>
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "#475569" }}>{s.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: s.hex }}>{s.count}</span>
                      {idx > 0 && (
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                          background: drop > 40 ? "#fee2e2" : "#dcfce7",
                          color: drop > 40 ? "#ef4444" : "#16a34a",
                        }}>
                          -{drop}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pipeline health */}
            <div style={{
              borderRadius: 18, padding: "20px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}>
              <h6 className="fw-bold mb-2" style={{ color: "#fff", fontSize: 13 }}>🤖 Pipeline Health</h6>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
                <div>• <strong style={{ color: "#fff" }}>{total}</strong> total leads tracked</div>
                <div>• <strong style={{ color: "#fff" }}>{won}</strong> converted ({convRate}% rate)</div>
                <div>• <strong style={{ color: "#fff" }}>
                  {leads.filter(l => l.conversionProbability >= 70).length}
                </strong> high-probability leads</div>
                <div>• <strong style={{ color: "#fff" }}>₹{revenue.toLocaleString("en-IN")}</strong> estimated revenue</div>
              </div>
              <div className="mt-3 d-flex flex-wrap gap-2">
                <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                  AI Scoring Active
                </span>
                <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                  Live Data
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
