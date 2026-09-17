import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTrainerPerformances } from "../../api/userAdminApi";

const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
const medalLabels = ["🥇", "🥈", "🥉"];

const getRankColor = (idx) => {
  if (idx === 0) return "linear-gradient(135deg, #f6d365 0%, #fda085 100%)";
  if (idx === 1) return "linear-gradient(135deg, #c1c1c1 0%, #a8a8a8 100%)";
  if (idx === 2) return "linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)";
  return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
};

const ScoreBar = ({ value, color }) => (
  <div style={{ background: "#e9ecef", borderRadius: 999, height: 8, width: "100%", overflow: "hidden" }}>
    <div
      style={{
        width: `${Math.min(value, 100)}%`,
        background: color,
        height: "100%",
        borderRadius: 999,
        transition: "width 1s ease",
      }}
    />
  </div>
);

const StatPill = ({ label, value, color }) => (
  <div
    style={{
      background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 12,
      padding: "6px 14px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minWidth: 80,
    }}
  >
    <span style={{ fontSize: 18, fontWeight: 800, color }}>{value}</span>
    <span style={{ fontSize: 10, color: "#6c757d", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
  </div>
);

export default function TrainerPerformanceDashboard() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);
    getTrainerPerformances(user.userId)
      .then((data) => {
        setTrainers(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(() => setError("Failed to load trainer performance data."))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = trainers.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const avgScore =
    trainers.length > 0
      ? Math.round(trainers.reduce((s, t) => s + t.performanceScore, 0) / trainers.length)
      : 0;
  const topTrainer = trainers[0];
  const totalRevenue = trainers.reduce((s, t) => s + t.revenueGenerated, 0);
  const totalMembers = trainers.reduce((s, t) => s + t.assignedMembers, 0);

  return (
    <div style={{ background: "#f0f2f8", minHeight: "100vh", padding: "32px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>
          🏆 Trainer Performance Dashboard
        </h1>
        <p style={{ color: "#6c757d", marginTop: 6, fontSize: 15 }}>
          Real-time leaderboard & metrics for every trainer in your gym
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 36 }}>
        {[
          {
            label: "Total Trainers",
            value: trainers.length,
            icon: "👥",
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          },
          {
            label: "Avg Performance",
            value: `${avgScore}%`,
            icon: "📈",
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          },
          {
            label: "Total Members",
            value: totalMembers,
            icon: "🏋️",
            gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          },
          {
            label: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            icon: "💰",
            gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          },
          {
            label: "Top Performer",
            value: topTrainer ? topTrainer.name.split(" ")[0] : "–",
            icon: "🥇",
            gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "20px 22px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                background: card.gradient,
                borderRadius: 14,
                width: 52,
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>{card.value}</div>
              <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 600, textTransform: "uppercase" }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      {trainers.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", marginBottom: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", marginBottom: 20 }}>🏆 Leaderboard</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {trainers.slice(0, 10).map((t, idx) => (
              <div
                key={t.trainerId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: idx < 3 ? `${medalColors[idx]}0d` : "#f8f9fa",
                  border: idx < 3 ? `1.5px solid ${medalColors[idx]}50` : "1.5px solid transparent",
                  borderRadius: 14,
                  padding: "14px 18px",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {/* Rank */}
                <div
                  style={{
                    minWidth: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: getRankColor(idx),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: idx < 3 ? 20 : 16,
                    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                    flexShrink: 0,
                  }}
                >
                  {idx < 3 ? medalLabels[idx] : `#${idx + 1}`}
                </div>

                {/* Name + bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.name}
                  </div>
                  <ScoreBar value={t.performanceScore} color={idx < 3 ? medalColors[idx] : "#667eea"} />
                </div>

                {/* Score badge */}
                <div
                  style={{
                    background: getRankColor(idx),
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 18,
                    borderRadius: 12,
                    padding: "6px 16px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {t.performanceScore}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>📊 Detailed Metrics</h2>
          <input
            type="text"
            placeholder="🔍 Search trainer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "1.5px solid #e0e0e0",
              borderRadius: 12,
              padding: "9px 16px",
              fontSize: 14,
              outline: "none",
              width: 220,
              background: "#f8f9fa",
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6c757d" }}>
            <div className="spinner-border text-primary" />
            <p style={{ marginTop: 16 }}>Loading trainer data...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#dc3545" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <p>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6c757d" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p>No trainers found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr>
                  {["#", "Trainer", "Members", "Attendance", "Retention", "Revenue", "Rating", "Transformations", "Score"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Trainer" ? "left" : "center",
                        padding: "10px 14px",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        color: "#6c757d",
                        borderBottom: "2px solid #f0f2f8",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => {
                  const rank = trainers.findIndex((x) => x.trainerId === t.trainerId);
                  return (
                    <tr
                      key={t.trainerId}
                      style={{ background: "#f8f9ff", borderRadius: 12, transition: "box-shadow 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(102,126,234,0.2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <td style={{ padding: "14px", textAlign: "center", fontWeight: 700, color: "#6c757d", borderRadius: "12px 0 0 12px" }}>
                        {rank < 3 ? medalLabels[rank] : `#${rank + 1}`}
                      </td>
                      <td style={{ padding: "14px 14px", fontWeight: 700, color: "#1a1a2e", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: getRankColor(rank),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: 15,
                              flexShrink: 0,
                            }}
                          >
                            {t.name?.charAt(0)?.toUpperCase()}
                          </div>
                          {t.name}
                        </div>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span style={{ background: "#e8f4fd", color: "#0066cc", fontWeight: 700, borderRadius: 8, padding: "4px 12px", fontSize: 14 }}>
                          {t.assignedMembers}
                        </span>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 700, color: t.attendancePercentage >= 70 ? "#28a745" : t.attendancePercentage >= 40 ? "#fd7e14" : "#dc3545" }}>
                            {t.attendancePercentage}%
                          </span>
                          <ScoreBar value={t.attendancePercentage} color={t.attendancePercentage >= 70 ? "#28a745" : t.attendancePercentage >= 40 ? "#fd7e14" : "#dc3545"} />
                        </div>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 700, color: t.retentionPercentage >= 70 ? "#28a745" : t.retentionPercentage >= 40 ? "#fd7e14" : "#dc3545" }}>
                            {t.retentionPercentage}%
                          </span>
                          <ScoreBar value={t.retentionPercentage} color={t.retentionPercentage >= 70 ? "#28a745" : t.retentionPercentage >= 40 ? "#fd7e14" : "#dc3545"} />
                        </div>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center", fontWeight: 700, color: "#28a745", whiteSpace: "nowrap" }}>
                        ₹{t.revenueGenerated.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                          <span style={{ color: "#ffa500", fontSize: 16 }}>{"★".repeat(Math.round(t.rating))}</span>
                          <span style={{ fontWeight: 600, color: "#6c757d", fontSize: 13 }}>{t.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span style={{ background: "#e8f5e9", color: "#2e7d32", fontWeight: 700, borderRadius: 8, padding: "4px 12px" }}>
                          💪 {t.transformations}
                        </span>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center", borderRadius: "0 12px 12px 0" }}>
                        <div
                          style={{
                            display: "inline-block",
                            background: getRankColor(rank),
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: 15,
                            borderRadius: 10,
                            padding: "6px 14px",
                          }}
                        >
                          {t.performanceScore}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
