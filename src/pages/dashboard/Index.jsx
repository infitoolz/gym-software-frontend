import React, { useEffect, useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import { Row, Col, Card, Container, CardBody, ProgressBar } from 'react-bootstrap';
import Chart from "react-apexcharts";
import ReactECharts from "echarts-for-react";
import Slider from "react-slick";
import Footer from '../../components/Footer';
import { getProgressSummary } from '../../api/progressApi';
import { getMyGoals } from '../../api/goalsApi';
import { getWorkoutPlans, getExercises } from '../../api/workoutApi';
import { resolveWorkoutImage } from '../../utils/workoutImages';
import { useAuth } from '../../context/AuthContext';
import AdminOverview from './AdminOverview';
import DashboardChatCard from '../../components/DashboardChatCard';

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TRAINER', 'COUNSELOR'];
import {
  IconBarbell, IconDroplet, IconFlame, IconHeartbeat,
  IconRun, IconTargetArrow, IconPlayerPlay, IconCalendar,
  IconClock, IconArrowUpRight
} from '@tabler/icons-react';

const cardslider = {
  dots: false, infinite: true, speed: 500, slidesToShow: 3, slidesToScroll: 1,
  autoplay: true, autoplaySpeed: 3000,
  responsive: [
    { breakpoint: 1441, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 481, settings: { slidesToShow: 1 } },
  ],
};

// White ring gauge for the coloured stat cards
const ringGauge = (value, max) => ({
  series: [{
    type: 'gauge', startAngle: 90, endAngle: -270, min: 0, max: max || 1,
    pointer: { show: false },
    progress: { show: true, overlap: false, roundCap: true, clip: false, itemStyle: { color: '#ffffff' } },
    axisLine: { lineStyle: { width: 12, color: [[1, 'rgba(255,255,255,0.25)']] } },
    splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false },
    data: [{ value: value || 0 }],
    detail: { show: false },
    radius: '95%',
  }],
});

export default function Index() {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  if (role === 'CORPORATE_HR') {
    return <Navigate to="/hr-portal" replace />;
  }
  if (STAFF_ROLES.includes(role)) {
    return <AdminOverview />;
  }
  return <MemberDashboard />;
}

function MemberDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [goals, setGoals] = useState([]);
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, g, p, e] = await Promise.allSettled([
        getProgressSummary(), getMyGoals(), getWorkoutPlans(), getExercises(),
      ]);
      if (!mounted) return;
      if (s.status === 'fulfilled') setSummary(s.value);
      if (g.status === 'fulfilled') setGoals(Array.isArray(g.value) ? g.value : []);
      if (p.status === 'fulfilled') setPlans(Array.isArray(p.value) ? p.value : []);
      if (e.status === 'fulfilled') setExercises(Array.isArray(e.value) ? e.value : []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const steps = summary?.latestSteps ?? 0;
  const stepsGoal = summary?.stepsGoal ?? 8000;
  const stepsPct = Math.min(100, Math.round((steps / stepsGoal) * 100)) || 0;

  const water = summary?.latestWaterLiters ?? 0;
  const waterGoal = summary?.waterGoalLiters ?? 3;
  const waterPct = Math.min(100, Math.round((water / waterGoal) * 100)) || 0;

  const calories = summary?.caloriesToday ?? 0;
  const caloriesGoal = summary?.caloriesGoal ?? 2500;
  const caloriesPct = Math.min(100, Math.round((calories / caloriesGoal) * 100)) || 0;

  const heartRate = summary?.latestHeartRate;
  const weekly = summary?.weeklyActivity || [];
  const totalWeeklyMinutes = useMemo(() => weekly.reduce((acc, curr) => acc + (curr.minutes || 0), 0), [weekly]);

  const activityChart = useMemo(() => ({
    options: {
      chart: { toolbar: { show: false }, fontFamily: "inherit" },
      plotOptions: {
        bar: { borderRadius: 6, columnWidth: "36%" },
      },
      dataLabels: { enabled: false },
      colors: ["#2563eb"],
      grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
      xaxis: {
        categories: weekly.map((d) => d.label || ""),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#64748b", fontSize: "12px", fontWeight: 500 } },
      },
      yaxis: {
        labels: {
          style: { colors: "#64748b", fontSize: "12px" },
          formatter: (val) => `${val}m`,
        },
      },
      tooltip: {
        y: { formatter: (val) => `${val} mins` },
      },
    },
    series: [{ name: "Minutes", data: weekly.map((d) => d.minutes || 0) }],
  }), [weekly]);

  const heartLine = useMemo(() => ({
    options: {
      chart: { sparkline: { enabled: true }, fontFamily: "inherit" },
      stroke: { curve: "smooth", width: 2.5 },
      colors: ["#e11d48"],
      tooltip: { enabled: false },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 95, 100],
        },
      },
    },
    series: [
      {
        name: "Pulse",
        data: weekly.length
          ? weekly.map((d) => (d.minutes ? Math.min(145, 68 + d.minutes) : 72))
          : [68, 72, 75, 71, 74, 72, 70],
      },
    ],
  }), [weekly]);

  const statusBreakdown = useMemo(() => {
    const order = ["Completed", "In Progress", "Not Started", "Skipped"];
    const counts = order.map((st) => goals.filter((g) => g.status === st).length);
    return {
      options: {
        labels: order,
        colors: ["#10b981", "#2563eb", "#94a3b8", "#f59e0b"],
        legend: { position: "bottom", fontSize: "12px", markers: { radius: 12 } },
        dataLabels: { enabled: false },
        stroke: { width: 2, colors: ["#ffffff"] },
        plotOptions: {
          pie: {
            donut: {
              size: "72%",
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "Total Goals",
                  fontSize: "12px",
                  color: "#64748b",
                  formatter: () => counts.reduce((a, b) => a + b, 0),
                },
              },
            },
          },
        },
      },
      series: counts,
      total: counts.reduce((a, b) => a + b, 0),
    };
  }, [goals]);

  const topGoals = goals.slice(0, 4);
  const popularPlans = plans.slice(0, 6);
  const bestExercises = exercises.slice(0, 4);

  return (
    <main className="themebody-wrap member-overview-dashboard">
      <div className="theme-body">
        <Container fluid className="px-3 px-md-4 py-3">
          {loading && <div className="alert alert-info">Loading your overview...</div>}

          {/* Welcome Banner */}
          <div className="dashboard-welcome-banner">
            <div>
              <h2 className="welcome-title">Welcome back, {user?.name || "Athlete"} 👋</h2>
              <p className="welcome-subtitle">Here is your personal fitness metrics and activity progress for today.</p>
            </div>
            <div className="date-badge">
              <IconCalendar size={16} className="text-primary" />
              <span>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>

          {/* Top 4 KPI Metric Cards */}
          <Row className="g-3 mb-2">
            {/* Steps */}
            <Col xl={3} md={6}>
              <div className="stat-metric-card theme-steps">
                <div className="stat-header">
                  <div className="stat-icon-wrap">
                    <IconRun size={22} />
                  </div>
                  <span className="stat-badge">{stepsPct}% Met</span>
                </div>
                <div className="stat-title">Daily Steps</div>
                <div className="stat-value">
                  {steps.toLocaleString()} <small>Steps</small>
                </div>
                <div className="stat-progress-bar-wrap">
                  <div className="stat-progress-bar-fill" style={{ width: `${stepsPct}%` }} />
                </div>
                <div className="stat-meta">
                  <span>Goal: {stepsGoal.toLocaleString()}</span>
                  <span>{Math.max(0, stepsGoal - steps).toLocaleString()} left</span>
                </div>
              </div>
            </Col>

            {/* Water */}
            <Col xl={3} md={6}>
              <div className="stat-metric-card theme-water">
                <div className="stat-header">
                  <div className="stat-icon-wrap">
                    <IconDroplet size={22} />
                  </div>
                  <span className="stat-badge">{waterPct}% Met</span>
                </div>
                <div className="stat-title">Water Intake</div>
                <div className="stat-value">
                  {water} <small>Liters</small>
                </div>
                <div className="stat-progress-bar-wrap">
                  <div className="stat-progress-bar-fill" style={{ width: `${waterPct}%` }} />
                </div>
                <div className="stat-meta">
                  <span>Goal: {waterGoal} Liters</span>
                  <span>{water >= waterGoal ? "Target achieved!" : `${(waterGoal - water).toFixed(1)}L remaining`}</span>
                </div>
              </div>
            </Col>

            {/* Calories */}
            <Col xl={3} md={6}>
              <div className="stat-metric-card theme-calories">
                <div className="stat-header">
                  <div className="stat-icon-wrap">
                    <IconFlame size={22} />
                  </div>
                  <span className="stat-badge">{caloriesPct}% Met</span>
                </div>
                <div className="stat-title">Active Calories</div>
                <div className="stat-value">
                  {calories.toLocaleString()} <small>Kcal</small>
                </div>
                <div className="stat-progress-bar-wrap">
                  <div className="stat-progress-bar-fill" style={{ width: `${caloriesPct}%` }} />
                </div>
                <div className="stat-meta">
                  <span>Goal: {caloriesGoal.toLocaleString()} Kcal</span>
                  <span>{calories >= caloriesGoal ? "Goal reached!" : `${(caloriesGoal - calories).toLocaleString()} kcal left`}</span>
                </div>
              </div>
            </Col>

            {/* Heart Rate */}
            <Col xl={3} md={6}>
              <div className="stat-metric-card theme-heart">
                <div className="stat-header">
                  <div className="stat-icon-wrap">
                    <IconHeartbeat size={22} />
                  </div>
                  <span className="stat-badge">Pulse</span>
                </div>
                <div className="stat-title">Heart Rate</div>
                <div className="stat-value">
                  {heartRate != null ? heartRate : "--"} <small>Bpm</small>
                </div>
                <div className="sparkline-container">
                  <Chart options={heartLine.options} series={heartLine.series} height={42} type="area" />
                </div>
                <div className="stat-meta">
                  <span>Resting avg: 68-75</span>
                  <span className="text-success fw-semibold">Normal</span>
                </div>
              </div>
            </Col>
          </Row>

          {/* Main Dashboard Layout */}
          <Row className="g-4">
            {/* Left 7 Columns: Activity, Goals, Popular Workouts */}
            <Col xxl={7}>
              <Row className="g-4">
                {/* Activity Chart Card */}
                <Col md={6}>
                  <div className="overview-panel-card h-100">
                    <div className="card-header-clean">
                      <div>
                        <h5 className="card-title-main">Activity</h5>
                        <div className="card-subtitle">Minutes trained per day</div>
                      </div>
                      <span className="badge bg-light text-primary border font-monospace px-2.5 py-1">
                        {totalWeeklyMinutes}m total
                      </span>
                    </div>
                    <div className="card-body-clean">
                      <Chart options={activityChart.options} series={activityChart.series} height={250} type="bar" />
                    </div>
                  </div>
                </Col>

                {/* Goals Progress Donut */}
                <Col md={6}>
                  <div className="overview-panel-card h-100">
                    <div className="card-header-clean">
                      <div>
                        <h5 className="card-title-main">Goals Progress</h5>
                        <div className="card-subtitle">Target completion status</div>
                      </div>
                      <span className="badge bg-light text-secondary border font-monospace px-2.5 py-1">
                        {statusBreakdown.total} {statusBreakdown.total === 1 ? "Goal" : "Goals"}
                      </span>
                    </div>
                    <div className="card-body-clean d-flex align-items-center justify-content-center" style={{ minHeight: 250 }}>
                      {statusBreakdown.total > 0 ? (
                        <Chart options={statusBreakdown.options} series={statusBreakdown.series} height={250} type="donut" />
                      ) : (
                        <div className="text-center text-muted py-4">
                          <IconTargetArrow size={36} className="text-secondary opacity-50 mb-2" />
                          <div className="fw-semibold">No active goals tracked</div>
                          <small>Set goals to visualize your progress donut</small>
                        </div>
                      )}
                    </div>
                  </div>
                </Col>

                {/* Active Goals Section */}
                <Col md={12}>
                  <div className="overview-panel-card">
                    <div className="card-header-clean">
                      <div>
                        <h5 className="card-title-main">My Active Goals</h5>
                        <div className="card-subtitle">Track your physical milestones</div>
                      </div>
                      <Link to="/goals" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 rounded-pill px-3">
                        <span>View All Goals</span>
                        <IconArrowUpRight size={14} />
                      </Link>
                    </div>
                    <div className="card-body-clean">
                      {topGoals.length === 0 ? (
                        <div className="goals-empty-state">
                          <div className="empty-icon">
                            <IconTargetArrow size={24} />
                          </div>
                          <h6 className="empty-title">No goals set yet</h6>
                          <p className="empty-desc">Establish weight, workout consistency, or endurance goals to stay motivated.</p>
                          <Link to="/goals" className="btn btn-primary btn-sm rounded-pill px-3 py-1.5 fw-semibold">
                            + Add New Goal
                          </Link>
                        </div>
                      ) : (
                        <Row className="g-3">
                          {topGoals.map((goal) => (
                            <Col md={6} key={goal.id}>
                              <div className="goal-card-item">
                                <div className="goal-top">
                                  <div>
                                    <div className="goal-name">{goal.name}</div>
                                    <div className="goal-value">
                                      {goal.targetValue != null
                                        ? `${goal.currentValue ?? 0} / ${goal.targetValue} ${goal.unit || ""}`
                                        : goal.status}
                                    </div>
                                  </div>
                                  <div className="goal-pct">{goal.progressPercent ?? 0}%</div>
                                </div>
                                <div className="stat-progress-bar-wrap m-0">
                                  <div
                                    className="stat-progress-bar-fill"
                                    style={{
                                      width: `${Math.min(100, goal.progressPercent ?? 0)}%`,
                                      background: "linear-gradient(90deg, #2563eb, #38bdf8)",
                                    }}
                                  />
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      )}
                    </div>
                  </div>
                </Col>

                {/* Popular Workouts */}
                <Col md={12}>
                  <div className="overview-panel-card">
                    <div className="card-header-clean">
                      <div>
                        <h5 className="card-title-main">Popular Workouts</h5>
                        <div className="card-subtitle">Recommended training routines</div>
                      </div>
                      <Link to="/workout" className="btn btn-sm btn-link text-primary text-decoration-none fw-semibold p-0">
                        Explore all plans →
                      </Link>
                    </div>
                    <div className="card-body-clean">
                      {popularPlans.length === 0 ? (
                        <p className="text-muted mb-0">No workout plans available yet.</p>
                      ) : popularPlans.length >= 3 ? (
                        <Slider {...cardslider} className="popularworkout-slider arrow-style1">
                          {popularPlans.map((plan) => (
                            <div key={plan.id} className="px-2">
                              <WorkoutCard plan={plan} />
                            </div>
                          ))}
                        </Slider>
                      ) : (
                        <Row className="g-3">
                          {popularPlans.map((plan) => (
                            <Col md={4} key={plan.id}>
                              <WorkoutCard plan={plan} />
                            </Col>
                          ))}
                        </Row>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </Col>

            {/* Right 5 Columns: This Week Hero, Best Exercises, Wellness Chat */}
            <Col xxl={5}>
              <Row className="g-4">
                {/* This Week Hero Card */}
                <Col xxl={12} lg={6}>
                  <div className="this-week-hero-card">
                    <div className="hero-eyebrow">Weekly Workout Summary</div>
                    <div className="hero-headline">
                      {summary?.workoutMinutesThisWeek ?? 0} Mins Trained
                    </div>
                    <p className="hero-desc">
                      Completed {summary?.workoutsThisWeek ?? 0} workouts this week. Keep the momentum going!
                    </p>
                    <Link to="/my-schedule" className="hero-btn">
                      <IconPlayerPlay size={16} />
                      <span>Start Training</span>
                    </Link>
                  </div>
                </Col>

                {/* Best Exercises */}
                <Col xxl={12} lg={6}>
                  <div className="overview-panel-card">
                    <div className="card-header-clean">
                      <div>
                        <h5 className="card-title-main">Best Exercises</h5>
                        <div className="card-subtitle">Top movements from your routine</div>
                      </div>
                      <span className="badge bg-light text-secondary border font-monospace px-2.5 py-1">
                        {exercises.length} Exercises
                      </span>
                    </div>
                    <div className="card-body-clean">
                      {bestExercises.length === 0 ? (
                        <p className="text-muted mb-0">No exercises in the catalog yet.</p>
                      ) : (
                        <div className="exercises-compact-list">
                          {bestExercises.map((ex) => (
                            <div key={ex.id} className="exercise-item">
                              <div className="d-flex align-items-center gap-3">
                                <div className="ex-icon">
                                  <IconBarbell size={20} />
                                </div>
                                <div>
                                  <div className="ex-name">{ex.name}</div>
                                  <div className="ex-category">{ex.bodyPart?.name || ex.workoutType?.name || ex.difficulty || "Exercise"}</div>
                                </div>
                              </div>
                              <span className="ex-pill">{ex.difficulty || "Standard"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>

                {/* Wellness Chat Mini Preview */}
                <Col xxl={12}>
                  <DashboardChatCard />
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </main>
  );
}

function WorkoutCard({ plan }) {
  const img = resolveWorkoutImage(plan);
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="popular-plan-card">
      <div className="plan-img-wrap">
        <Link to={`/workout-plan/${plan.id}`}>
          {img && !imgFailed ? (
            <img src={img} alt={plan.name} onError={() => setImgFailed(true)} />
          ) : (
            <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center text-muted">
              <IconBarbell size={32} />
            </div>
          )}
        </Link>
        <span className="plan-level-badge">{plan.level || "All levels"}</span>
      </div>
      <div className="plan-content">
        <Link to={`/workout-plan/${plan.id}`} className="plan-title" title={plan.name}>
          {plan.name}
        </Link>
        <div className="plan-meta">
          <IconClock size={14} />
          <span>{plan.estimatedTimeMinutes || plan.durationWeeks || "—"} {plan.estimatedTimeMinutes ? "mins" : "weeks"}</span>
        </div>
      </div>
    </div>
  );
}
