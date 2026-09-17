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
  IconRun, IconTargetArrow, IconPlayerPlay
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
  const calories = summary?.caloriesToday ?? 0;
  const caloriesGoal = summary?.caloriesGoal ?? 2500;
  const heartRate = summary?.latestHeartRate;
  const weekly = summary?.weeklyActivity || [];

  const activityChart = useMemo(() => ({
    options: {
      chart: { toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
      dataLabels: { enabled: false },
      colors: ['#2bb3a3'],
      grid: { borderColor: '#eef2f2' },
      xaxis: { categories: weekly.map((d) => d.label) },
    },
    series: [{ name: 'Minutes', data: weekly.map((d) => d.minutes || 0) }],
  }), [weekly]);

  const heartLine = useMemo(() => ({
    options: {
      chart: { sparkline: { enabled: true } },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#ffffff'],
      tooltip: { enabled: false },
    },
    series: [{ name: 'Activity', data: weekly.length ? weekly.map((d) => d.minutes || 0) : [3, 5, 4, 6, 5, 7, 6] }],
  }), [weekly]);

  const statusBreakdown = useMemo(() => {
    const order = ['Completed', 'In Progress', 'Not Started', 'Skipped'];
    const counts = order.map((st) => goals.filter((g) => g.status === st).length);
    return {
      options: {
        labels: order, colors: ['#2bb3a3', '#f4a23b', '#9aa7b2', '#ff6b6b'],
        legend: { position: 'bottom' }, dataLabels: { enabled: false },
        stroke: { width: 0 }, plotOptions: { pie: { donut: { size: '68%' } } },
      },
      series: counts,
      total: counts.reduce((a, b) => a + b, 0),
    };
  }, [goals]);

  const topGoals = goals.slice(0, 4);
  const popularPlans = plans.slice(0, 6);
  const bestExercises = exercises.slice(0, 4);

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {loading && <div className="alert alert-info">Loading your overview...</div>}
          <Row>
            {/* Steps */}
            <Col lg={3} md={6}>
              <Card className="bg-primary text-white step-card">
                <Card.Body className="p-3">
                  <h6 className="mb-4"><IconRun className='me-1' /> Steps</h6>
                  <h2 className="mb-4 fw-semibold">{steps.toLocaleString()} <small>Steps</small></h2>
                  <ProgressBar now={stepsPct} />
                  <p className="mt-3 text-white">{stepsPct}% of your {stepsGoal.toLocaleString()} goal</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Water */}
            <Col lg={3} md={6}>
              <Card className="bg-secondary text-white step-card">
                <Card.Body className="p-3 pb-0">
                  <h6><IconDroplet className='me-1' /> Water</h6>
                  <div style={{ position: 'relative' }}>
                    <ReactECharts option={ringGauge(water, waterGoal)} style={{ height: 150 }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <h4 className="mb-0 fw-bold">{water}</h4>
                      <small>Liters</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Calories */}
            <Col lg={3} md={6}>
              <Card className="bg-info text-white step-card">
                <Card.Body className="p-3 pb-0">
                  <h6><IconFlame className='me-1' /> Calories</h6>
                  <div style={{ position: 'relative' }}>
                    <ReactECharts option={ringGauge(calories, caloriesGoal)} style={{ height: 150 }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <h4 className="mb-0 fw-bold">{calories}</h4>
                      <small>of {caloriesGoal}</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Heart Rate */}
            <Col lg={3} md={6}>
              <Card className="bg-danger text-white step-card">
                <Card.Body className="p-3">
                  <h6><IconHeartbeat className='me-1' /> Heart Rate</h6>
                  <Chart options={heartLine.options} series={heartLine.series} height={70} type='line' />
                  <h2 className="mb-0 fw-semibold">{heartRate != null ? heartRate : '--'} <small>Bpm</small></h2>
                </Card.Body>
              </Card>
            </Col>

            <Col xxl={7}>
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header><h4>Activity</h4></Card.Header>
                    <Card.Body className="pt-0">
                      <Chart options={activityChart.options} series={activityChart.series} height={270} type='bar' className="mt-3" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="progress-card">
                    <Card.Header><h4>Goals Progress</h4></Card.Header>
                    <Card.Body className="pt-0">
                      {statusBreakdown.total > 0 ? (
                        <Chart options={statusBreakdown.options} series={statusBreakdown.series} height={305} type='donut' className="mt-3" />
                      ) : (
                        <p className="text-muted mt-4 text-center">No goals yet. Add goals to see progress here.</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Real goal cards */}
                {topGoals.length === 0 ? (
                  <Col md={12}>
                    <Card><Card.Body className="text-center text-muted py-4">
                      <IconTargetArrow size={28} className="mb-2" />
                      <div>No goals set yet. <Link to="/goals">Add a goal</Link> to track it here.</div>
                    </Card.Body></Card>
                  </Col>
                ) : topGoals.map((goal) => (
                  <Col md={6} key={goal.id}>
                    <Card className="goals-card">
                      <Card.Body>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center">
                            <div className="icon-wrap me-3 bg-light rounded-3 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                              <IconTargetArrow size={22} />
                            </div>
                            <div>
                              <h6 className="fw-semibold mb-0">{goal.name}</h6>
                              <p className="mb-0 font-light">
                                {goal.targetValue != null
                                  ? `${goal.currentValue ?? 0}/${goal.targetValue} ${goal.unit || ''}`
                                  : goal.status}
                              </p>
                            </div>
                          </div>
                          <h5 className="fw-bold mb-0">{goal.progressPercent ?? 0}%</h5>
                        </div>
                        <ProgressBar now={goal.progressPercent ?? 0} />
                      </Card.Body>
                    </Card>
                  </Col>
                ))}

                {/* Popular Workouts (real plans) */}
                <Col md={12}>
                  <Card>
                    <Card.Header className="d-flex justify-content-between">
                      <h4>Popular Workouts</h4>
                    </Card.Header>
                    <Card.Body>
                      {popularPlans.length === 0 ? (
                        <p className="text-muted mb-0">No workout plans yet.</p>
                      ) : popularPlans.length >= 3 ? (
                        <Slider {...cardslider} className="popularworkout-slider arrow-style1">
                          {popularPlans.map((plan) => <WorkoutCard key={plan.id} plan={plan} />)}
                        </Slider>
                      ) : (
                        <Row>{popularPlans.map((plan) => <Col md={4} key={plan.id}><WorkoutCard plan={plan} /></Col>)}</Row>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>

            <Col xxl={5}>
              <Row>
                <Col xxl={12} lg={6}>
                  <Card className="bg-light-primary">
                    <Card.Body>
                      <h3 className="mb-2 fw-bold">This week</h3>
                      <p className="mb-3">You trained {summary?.workoutMinutesThisWeek ?? 0} minutes across {summary?.workoutsThisWeek ?? 0} workouts.</p>
                      <Link to="/my-schedule" className="btn btn-primary"><IconPlayerPlay size={16} className="me-1" /> Start Training</Link>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xxl={12} lg={6}>
                  <Card>
                    <Card.Header className="d-flex justify-content-between">
                      <h4 className="fw-semibold">Best Exercises</h4>
                      <span className="font-light">Exercises: {exercises.length}</span>
                    </Card.Header>
                    <Card.Body>
                      {bestExercises.length === 0 ? (
                        <p className="text-muted mb-0">No exercises in the catalog yet.</p>
                      ) : (
                        <ul className="warmup-list">
                          {bestExercises.map((ex) => (
                            <li key={ex.id}>
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                  <div className="img-wrap bg-light rounded-3 d-flex align-items-center justify-content-center me-2" style={{ width: 42, height: 42 }}>
                                    <IconBarbell size={20} />
                                  </div>
                                  <div>
                                    <h6 className="fw-semibold mb-0">{ex.name}</h6>
                                    <p className="font-light mb-0">{ex.bodyPart?.name || ex.workoutType?.name || ex.difficulty || 'Exercise'}</p>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Wellness Chat with personal trainer (beside Popular Workouts) */}
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
    <div>
      <div className="workout-grid">
        <div className="img-wrap">
          <Link to={`/workout-plan/${plan.id}`}>
            {img && !imgFailed ? (
              <img src={img} alt={plan.name} className="w-100" style={{ height: 160, objectFit: 'cover', borderRadius: 10 }} onError={() => setImgFailed(true)} />
            ) : (
              <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: 160, borderRadius: 10 }}>
                <IconBarbell size={32} />
              </div>
            )}
          </Link>
        </div>
        <div className="workout-detail">
          <Link to={`/workout-plan/${plan.id}`}><h5 className="fw-semibold mb-2">{plan.name}</h5></Link>
          <h6 className="fw-semibold">{plan.level || 'All levels'}<span> · {plan.estimatedTimeMinutes || plan.durationWeeks || '—'} {plan.estimatedTimeMinutes ? 'min' : 'wks'}</span></h6>
        </div>
      </div>
    </div>
  );
}
