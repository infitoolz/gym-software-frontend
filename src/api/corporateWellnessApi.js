// ─── Mock data ──────────────────────────────────────────────────────

const MOCK_DASHBOARD = {
  totalEmployees: 342,
  activeParticipants: 218,
  avgWellnessScore: 74,
  engagementRate: 63.7,
  wellnessScoreTrend: [
    { month: "Jul", score: 68 },
    { month: "Aug", score: 71 },
    { month: "Sep", score: 69 },
    { month: "Oct", score: 73 },
    { month: "Nov", score: 72 },
    { month: "Dec", score: 74 },
  ],
  departmentBreakdown: [
    { dept: "Engineering", employees: 98, participants: 71, avgScore: 76 },
    { dept: "Sales", employees: 54, participants: 38, avgScore: 69 },
    { dept: "HR", employees: 28, participants: 22, avgScore: 81 },
    { dept: "Finance", employees: 32, participants: 18, avgScore: 65 },
    { dept: "Operations", employees: 45, participants: 29, avgScore: 72 },
    { dept: "Marketing", employees: 40, participants: 30, avgScore: 78 },
    { dept: "Support", employees: 45, participants: 10, avgScore: 58 },
  ],
  upcomingChallenges: [
    { id: 1, name: "Step Challenge Q1", participants: 86, startDate: "2026-01-15", endDate: "2026-02-15" },
    { id: 2, name: "Weight Loss Warrior", participants: 54, startDate: "2026-02-01", endDate: "2026-03-01" },
    { id: 3, name: "Hydration Heroes", participants: 42, startDate: "2026-01-20", endDate: "2026-02-20" },
  ],
};

const MOCK_BMI_DATA = {
  current: {
    bmi: 24.8,
    category: "Normal",
    height: 172,
    weight: 73,
    lastUpdated: "2026-01-10",
  },
  history: [
    { date: "2025-07-15", bmi: 27.1, weight: 80, category: "Overweight" },
    { date: "2025-08-15", bmi: 26.5, weight: 78, category: "Overweight" },
    { date: "2025-09-15", bmi: 25.8, weight: 76, category: "Overweight" },
    { date: "2025-10-15", bmi: 25.3, weight: 74.5, category: "Overweight" },
    { date: "2025-11-15", bmi: 24.9, weight: 73.2, category: "Normal" },
    { date: "2025-12-15", bmi: 24.8, weight: 73, category: "Normal" },
    { date: "2026-01-10", bmi: 24.8, weight: 73, category: "Normal" },
  ],
  distribution: [
    { category: "Underweight", count: 12, pct: 3.5 },
    { category: "Normal", count: 156, pct: 45.6 },
    { category: "Overweight", count: 118, pct: 34.5 },
    { category: "Obese", count: 56, pct: 16.4 },
  ],
};

const MOCK_CHALLENGES = [
  {
    id: 1, name: "Step Challenge Q1", type: "STEPS",
    description: "Walk 10,000 steps daily for 30 days. Track via your fitness band or mobile app.",
    startDate: "2026-01-15", endDate: "2026-02-15",
    goal: 300000, unit: "steps", status: "ACTIVE",
    participants: 86, maxParticipants: 200,
    leaderboard: [
      { rank: 1, name: "Rajesh K", steps: 285430, completion: 95 },
      { rank: 2, name: "Priya M", steps: 272100, completion: 91 },
      { rank: 3, name: "Amit S", steps: 258900, completion: 86 },
      { rank: 4, name: "Sneha R", steps: 241200, completion: 80 },
      { rank: 5, name: "Vikram J", steps: 229800, completion: 77 },
    ],
  },
  {
    id: 2, name: "Weight Loss Warrior", type: "WEIGHT_LOSS",
    description: "Lose 5% body weight in 4 weeks. Healthy eating tips and workout plans provided.",
    startDate: "2026-02-01", endDate: "2026-03-01",
    goal: 5, unit: "% body weight", status: "UPCOMING",
    participants: 54, maxParticipants: 100,
    leaderboard: [
      { rank: 1, name: "Neha G", loss: 3.2, completion: 64 },
      { rank: 2, name: "Arun K", loss: 2.8, completion: 56 },
      { rank: 3, name: "Deepa P", loss: 2.5, completion: 50 },
    ],
  },
  {
    id: 3, name: "Hydration Heroes", type: "HYDRATION",
    description: "Drink 8 glasses of water daily for 4 weeks. Log your intake in the app.",
    startDate: "2026-01-20", endDate: "2026-02-20",
    goal: 224, unit: "glasses", status: "ACTIVE",
    participants: 42, maxParticipants: 150,
    leaderboard: [
      { rank: 1, name: "Kavita S", glasses: 198, completion: 88 },
      { rank: 2, name: "Rahul V", glasses: 185, completion: 83 },
      { rank: 3, name: "Anita D", glasses: 172, completion: 77 },
    ],
  },
  {
    id: 4, name: "Meditation Marathon", type: "MINDFULNESS",
    description: "Meditate 10 minutes daily for 21 days. Build a lasting mindfulness habit.",
    startDate: "2026-03-01", endDate: "2026-03-21",
    goal: 210, unit: "minutes", status: "UPCOMING",
    participants: 0, maxParticipants: 100,
    leaderboard: [],
  },
];

const MOCK_REPORTS = {
  overallWellness: { score: 74, previousScore: 71, change: "+3" },
  departmentRankings: [
    { dept: "HR", score: 81, participation: 78.6, change: "+2" },
    { dept: "Marketing", score: 78, participation: 75, change: "+4" },
    { dept: "Engineering", score: 76, participation: 72.4, change: "+1" },
    { dept: "Operations", score: 72, participation: 64.4, change: "-1" },
    { dept: "Sales", score: 69, participation: 70.4, change: "+3" },
    { dept: "Finance", score: 65, participation: 56.3, change: "-2" },
    { dept: "Support", score: 58, participation: 22.2, change: "-5" },
  ],
  healthMetrics: {
    avgBmi: 24.8,
    normalBmiPct: 45.6,
    avgStepsPerDay: 7200,
    avgWaterGlasses: 5.2,
    avgSleepHours: 6.8,
    avgExerciseMinutes: 34,
    stressLevel: "Moderate",
  },
  monthlyTrend: [
    { month: "Aug", participants: 142, avgScore: 68 },
    { month: "Sep", participants: 168, avgScore: 70 },
    { month: "Oct", participants: 185, avgScore: 69 },
    { month: "Nov", participants: 194, avgScore: 72 },
    { month: "Dec", participants: 210, avgScore: 71 },
    { month: "Jan", participants: 218, avgScore: 74 },
  ],
  challengeStats: {
    total: 12,
    completed: 8,
    active: 2,
    upcoming: 2,
    totalParticipants: 486,
    avgCompletionRate: 72,
  },
};

// ─── Demo-only: return mock data directly ──────────────────────────
// Backend endpoints not yet implemented (Future Enterprise Version).
// These functions simulate async load for a realistic demo experience.

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getWellnessDashboard(hrUserId) {
  const response = await api.get("/corporate/dashboard", { params: { hrUserId } });
  return response.data;
}

export async function getCorporateEmployees(hrUserId) {
  const response = await api.get("/corporate/employees", { params: { hrUserId } });
  return response.data;
}

export async function getBmiData(hrUserId) {
  const response = await api.get("/corporate/bmi-data", { params: { hrUserId } });
  return response.data;
}

export async function addBmiEntry(_payload) {
  await delay(200);
  return { success: true };
}

export async function getChallenges(hrUserId) {
  const response = await api.get("/corporate/challenges", { params: { hrUserId } });
  return response.data;
}

export async function createChallenge(payload, hrUserId) {
  const response = await api.post("/corporate/challenges", payload, { params: { hrUserId } });
  return response.data;
}

export async function joinChallenge(_challengeId, _employeeId) {
  await delay(200);
  return { success: true };
}

export async function getCorporateReports(_params) {
  await delay();
  return MOCK_REPORTS;
}

export async function getCorporateAttendance() {
  // Placeholder until backend is implemented
  return [];
}
