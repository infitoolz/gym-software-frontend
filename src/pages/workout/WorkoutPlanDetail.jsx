import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Col, Container, Row, Modal } from "react-bootstrap";
import Slider from "react-slick";
import Footer from "../../components/Footer";
import api from "../../utils/api";
import { resolveDietImage } from "../../utils/dietImages";
import { resolveWorkoutImage } from "../../utils/workoutImages";
import {
  IconArrowLeft,
  IconBarbell,
  IconCalendarEvent,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconFlame,
  IconInfoCircle,
  IconPhoto,
  IconPlayerPause,
  IconPlayerPlay,
  IconPrinter,
  IconRotateClockwise,
  IconShare,
  IconSparkles,
  IconTarget,
  IconZoomIn,
  IconCircleCheck,
} from "@tabler/icons-react";
import { normalizeWorkoutPlan } from "./workoutUtils";

const unwrapResponseData = (response) => {
  if (response?.data && Object.prototype.hasOwnProperty.call(response.data, "data")) {
    return response.data.data;
  }
  return response?.data ?? null;
};

const formatTime = (value) => {
  if (!value && value !== 0) return "--";
  return `${value} min`;
};

// Pure Web Audio API tone synthesizer
const playChimeTone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio tone fallback
  }
};

export default function WorkoutPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");
  const [coverFailed, setCoverFailed] = useState(false);

  // Interactive UI states
  const [expandedInstructions, setExpandedInstructions] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Exercise card quick rest timer state
  const [activeRestTimer, setActiveRestTimer] = useState(null);
  const timerRef = useRef(null);

  // Interactive Workout Session Runner Modal state
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [currentRunnerStep, setCurrentRunnerStep] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [runnerTimerSeconds, setRunnerTimerSeconds] = useState(60);
  const [isRunnerTimerRunning, setIsRunnerTimerRunning] = useState(false);
  const runnerTimerRef = useRef(null);

  useEffect(() => {
    const loadPlan = async () => {
      setLoading(true);
      setError("");
      setEmptyMessage("");
      try {
        if (!id) {
          setPlan(null);
          setEmptyMessage("Pick a workout plan from Workout Plan Master to view its details.");
          return;
        }

        const res = await api.get(`/workout-plans/${id}`);
        const data = unwrapResponseData(res);
        setPlan(data ? normalizeWorkoutPlan(data) : null);
      } catch (err) {
        setPlan(null);
        setError("Unable to load this workout plan.");
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [id]);

  // Card Rest Timer effect
  useEffect(() => {
    if (activeRestTimer && activeRestTimer.isRunning) {
      timerRef.current = setInterval(() => {
        setActiveRestTimer((prev) => {
          if (!prev) return null;
          if (prev.seconds <= 1) {
            clearInterval(timerRef.current);
            playChimeTone();
            return { ...prev, seconds: 0, isRunning: false };
          }
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeRestTimer?.isRunning]);

  // Workout Runner Rest Timer effect
  useEffect(() => {
    if (isRunnerTimerRunning) {
      runnerTimerRef.current = setInterval(() => {
        setRunnerTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(runnerTimerRef.current);
            setIsRunnerTimerRunning(false);
            playChimeTone();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(runnerTimerRef.current);
    }
    return () => clearInterval(runnerTimerRef.current);
  }, [isRunnerTimerRunning]);

  const startCardTimer = (exId, seconds) => {
    setActiveRestTimer({ exId, seconds, total: seconds, isRunning: true });
  };

  const toggleCardTimer = () => {
    setActiveRestTimer((prev) => (prev ? { ...prev, isRunning: !prev.isRunning } : null));
  };

  const resetCardTimer = () => {
    setActiveRestTimer((prev) => (prev ? { ...prev, seconds: prev.total, isRunning: false } : null));
  };

  const toggleInstructions = (exId) => {
    setExpandedInstructions((prev) => ({
      ...prev,
      [exId]: prev[exId] === undefined ? false : !prev[exId],
    }));
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const imageList = useMemo(() => {
    if (!plan) return [];
    return [plan.mainImage].filter(Boolean);
  }, [plan]);

  const sliderSettings = useMemo(
    () => ({
      infinite: false,
      slidesToShow: 1,
      slidesToScroll: 1,
      speed: 600,
      dots: false,
      arrows: false,
      autoplay: false,
      adaptiveHeight: true,
    }),
    []
  );

  const goBack = () => navigate(-1);

  // Compute coach notes lines
  const coachingNotes = useMemo(() => {
    if (!plan?.notes) return [];
    return plan.notes
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }, [plan?.notes]);

  // Derive weekly schedule split from daysPerWeek
  const weeklySplit = useMemo(() => {
    const days = [
      { name: "Mon", short: "M", isWorkout: false },
      { name: "Tue", short: "T", isWorkout: false },
      { name: "Wed", short: "W", isWorkout: false },
      { name: "Thu", short: "T", isWorkout: false },
      { name: "Fri", short: "F", isWorkout: false },
      { name: "Sat", short: "S", isWorkout: false },
      { name: "Sun", short: "S", isWorkout: false },
    ];
    const count = Math.min(Math.max(plan?.daysPerWeek || 0, 1), 7);
    const presets = {
      1: [0],
      2: [0, 3],
      3: [0, 2, 4],
      4: [0, 1, 3, 4],
      5: [0, 1, 2, 3, 4],
      6: [0, 1, 2, 3, 4, 5],
      7: [0, 1, 2, 3, 4, 5, 6],
    };
    const indices = presets[count] || [0, 2, 4];
    indices.forEach((idx) => {
      if (days[idx]) days[idx].isWorkout = true;
    });
    return days;
  }, [plan?.daysPerWeek]);

  // Aggregate stats from exercises
  const aggregateStats = useMemo(() => {
    if (!plan?.exercises?.length) {
      return { totalSets: 0, totalReps: 0, totalCalories: 0, bodyParts: [] };
    }
    let totalSets = 0;
    let totalReps = 0;
    let totalCalories = 0;
    const bodyPartSet = new Set();

    plan.exercises.forEach((ex) => {
      totalSets += ex.sets || 0;
      totalReps += (ex.sets || 1) * (ex.reps || 0);
      totalCalories += ex.caloriesBurned || 0;
      if (ex.bodyPart?.name) bodyPartSet.add(ex.bodyPart.name);
    });

    return {
      totalSets,
      totalReps,
      totalCalories,
      bodyParts: Array.from(bodyPartSet),
    };
  }, [plan?.exercises]);

  const coverSrc = imageList.length === 1 ? resolveDietImage(imageList[0]) : resolveWorkoutImage(plan);

  return (
    <>
      <main className="themebody-wrap has-sticky-detail">
        <div className="theme-body">
          <Container fluid className="wpd-wrapper">
            {/* Top Navigation & Actions Bar */}
            <div className="wpd-topbar">
              <div className="wpd-breadcrumb-area">
                <button type="button" className="wpd-back-btn" onClick={goBack}>
                  <IconArrowLeft size={16} />
                  <span>Back</span>
                </button>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="text-end d-none d-sm-block">
                  <h3 className="mb-0 fw-bold">Workout Plan Detail</h3>
                  <small className="text-muted">{plan?.name || "Full Body Strength Workout"}</small>
                </div>
                <div className="wpd-actions-group">
                  {plan && (
                    <>
                      <button
                        type="button"
                        className="btn-wpd-start"
                        onClick={() => {
                          setCurrentRunnerStep(0);
                          setRunnerOpen(true);
                        }}
                      >
                        <IconPlayerPlay size={16} />
                        <span>Start Workout</span>
                      </button>

                      <button type="button" className="btn-wpd-outline" onClick={() => window.print()}>
                        <IconPrinter size={16} />
                        <span className="d-none d-md-inline">Print</span>
                      </button>

                      <button type="button" className="btn-wpd-outline" onClick={copyShareLink}>
                        <IconShare size={16} />
                        <span className="d-none d-md-inline">{copiedLink ? "Copied!" : "Share"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {loading && (
              <div className="alert alert-info d-flex align-items-center gap-2">
                <div className="spinner-border spinner-border-sm" role="status" />
                <span>Loading workout plan...</span>
              </div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && emptyMessage && <div className="alert alert-warning">{emptyMessage}</div>}
            {!loading && !error && id && !plan && (
              <div className="alert alert-warning">No workout plan was found for this ID.</div>
            )}

            {plan && (
              <Row className="g-4 align-items-start">
                {/* LEFT SIDE: Scrolling Details (Col 8) */}
                <Col xxl={8} xl={7} lg={7} className="wpd-scrollable-left">
                  {/* Hero Cover Card */}
                  <div className="wpd-hero-card">
                    <div className="wpd-hero-media" onClick={() => setLightboxImage(coverSrc)}>
                      {imageList.length > 1 ? (
                        <Slider {...sliderSettings} className="popularworkout-slider">
                          {imageList.map((img, idx) => (
                            <div key={`${img}-${idx}`}>
                              <img src={resolveDietImage(img)} alt={`${plan.name} ${idx + 1}`} />
                            </div>
                          ))}
                        </Slider>
                      ) : !coverFailed ? (
                        <img
                          src={coverSrc}
                          alt={plan.name}
                          onError={() => setCoverFailed(true)}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                          <IconPhoto size={40} className="me-2" />
                          <span>No cover image available</span>
                        </div>
                      )}
                      <div className="wpd-hero-overlay" />

                      {/* HUD Badges */}
                      <div className="wpd-hero-hud-top">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`wpd-hud-pill ${
                              plan.status === "ACTIVE" ? "status-active" : "status-inactive"
                            }`}
                          >
                            <span className="wpd-pulse-dot" />
                            {plan.status}
                          </span>
                          {plan.goal && (
                            <span className="wpd-hud-pill glass-pill d-none d-sm-inline-flex">
                              <IconTarget size={14} />
                              {plan.goal}
                            </span>
                          )}
                        </div>
                        <span className="wpd-hud-pill level-pill">
                          <IconSparkles size={14} />
                          {plan.level || "Beginner"}
                        </span>
                      </div>

                      <div className="wpd-hero-zoom-hint">
                        <IconZoomIn size={14} />
                        <span>View Diagram</span>
                      </div>
                    </div>

                    {/* Hero Title & Description */}
                    <div className="wpd-hero-content">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className={`badge ${plan.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>
                          {plan.status}
                        </span>
                        {plan.goal && (
                          <span className="text-muted small d-flex align-items-center gap-1">
                            <IconTarget size={15} />
                            {plan.goal}
                          </span>
                        )}
                      </div>

                      <h2 className="wpd-plan-title">{plan.name}</h2>
                      <p className="wpd-plan-desc">
                        {plan.description || "A structured workout program designed to elevate your strength and conditioning."}
                      </p>

                      <div className="wpd-tags-strip">
                        {aggregateStats.bodyParts.map((bp) => (
                          <span key={bp} className="wpd-tag-chip highlight">
                            ⚡ {bp}
                          </span>
                        ))}
                        <span className="wpd-tag-chip">
                          🏋️ {(plan.exercises || []).length} Exercise{(plan.exercises || []).length !== 1 ? "s" : ""}
                        </span>
                        {aggregateStats.totalSets > 0 && (
                          <span className="wpd-tag-chip">
                            🔢 {aggregateStats.totalSets} Total Sets
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4 Performance Vitals KPI Cards */}
                  <div className="wpd-vitals-grid">
                    <div className="wpd-vital-card vital-blue">
                      <div className="wpd-vital-icon">
                        <IconClock size={24} />
                      </div>
                      <div>
                        <div className="wpd-vital-label">Duration</div>
                        <div className="wpd-vital-value">{plan.durationWeeks} Weeks</div>
                        <div className="wpd-vital-sub">Full Training Cycle</div>
                      </div>
                    </div>

                    <div className="wpd-vital-card vital-orange">
                      <div className="wpd-vital-icon">
                        <IconFlame size={24} />
                      </div>
                      <div>
                        <div className="wpd-vital-label">Days / Week</div>
                        <div className="wpd-vital-value">{plan.daysPerWeek} Days</div>
                        <div className="wpd-vital-sub">Weekly Frequency</div>
                      </div>
                    </div>

                    <div className="wpd-vital-card vital-emerald">
                      <div className="wpd-vital-icon">
                        <IconBarbell size={24} />
                      </div>
                      <div>
                        <div className="wpd-vital-label">Level</div>
                        <div className="wpd-vital-value">{plan.level || "Beginner"}</div>
                        <div className="wpd-vital-sub">Intensity Rating</div>
                      </div>
                    </div>

                    <div className="wpd-vital-card vital-cyan">
                      <div className="wpd-vital-icon">
                        <IconClock size={24} />
                      </div>
                      <div>
                        <div className="wpd-vital-label">Estimated Time</div>
                        <div className="wpd-vital-value">{formatTime(plan.estimatedTimeMinutes)}</div>
                        <div className="wpd-vital-sub">Per Training Session</div>
                      </div>
                    </div>
                  </div>

                  {/* Coach Directives & Protocol (Notes) */}
                  <div className="wpd-side-card wpd-notes-card mb-4">
                    <div className="wpd-side-title">
                      <IconSparkles size={20} className="text-primary" />
                      <span>Notes & Coaching Directives</span>
                    </div>

                    {coachingNotes.length === 0 ? (
                      <p className="text-muted small mb-0">No notes added.</p>
                    ) : (
                      coachingNotes.map((note, nIdx) => (
                        <div key={nIdx} className="wpd-note-bullet">
                          <IconCircleCheck size={18} className="bullet-icon" />
                          <span>{note}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Weekly Routine Split & Recovery */}
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="wpd-side-card h-100 mb-0">
                        <div className="wpd-side-title">
                          <IconCalendarEvent size={20} className="text-primary" />
                          <span>Weekly Routine Split</span>
                        </div>
                        <p className="small text-muted mb-2">
                          Scheduled for {plan.daysPerWeek} active training sessions weekly.
                        </p>
                        <div className="wpd-split-grid">
                          {weeklySplit.map((day, dIdx) => (
                            <div
                              key={dIdx}
                              className={`wpd-split-day ${day.isWorkout ? "is-workout" : "is-rest"}`}
                            >
                              <span className="day-name">{day.name}</span>
                              <span className="day-status">
                                {day.isWorkout ? "✓" : "–"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="wpd-side-card h-100 mb-0">
                        <div className="wpd-side-title">
                          <IconFlame size={20} className="text-primary" />
                          <span>Recovery & Guidelines</span>
                        </div>
                        <div className="wpd-tip-item">
                          <span className="tip-emoji">💧</span>
                          <div>
                            <div className="tip-main">Hydration Target</div>
                            <div className="tip-sub">2.5L – 3L water daily</div>
                          </div>
                        </div>
                        <div className="wpd-tip-item">
                          <span className="tip-emoji">😴</span>
                          <div>
                            <div className="tip-main">Deep Sleep Recovery</div>
                            <div className="tip-sub">7–8 hours nightly for cellular repair</div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Col>

                {/* RIGHT SIDE: FIXED Exercises Column (Col 4) */}
                <Col xxl={4} xl={5} lg={5} className="wpd-fixed-right">
                  <div className="wpd-side-card mb-0 shadow-sm">
                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <IconBarbell size={22} className="text-primary" />
                        <h4 className="fw-bold mb-0">Exercises</h4>
                      </div>
                      <span className="wpd-count-badge">
                        {(plan.exercises || []).length} {(plan.exercises || []).length === 1 ? "Exercise" : "Exercises"}
                      </span>
                    </div>

                    {/* Exercise List */}
                    {(plan.exercises || []).length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <IconInfoCircle size={32} className="mx-auto mb-2 opacity-50" />
                        <div>No exercises linked to this workout plan.</div>
                      </div>
                    ) : (
                      <div className="d-grid gap-3">
                        {plan.exercises.map((exercise, index) => {
                          const isExpanded = expandedInstructions[exercise.id] ?? true;
                          const instructions = exercise.instructions || [];
                          const exerciseImg = exercise.image ? resolveDietImage(exercise.image) : "";
                          const timerActiveForThis = activeRestTimer?.exId === exercise.id;

                          return (
                            <div key={exercise.id || index} className="wpd-exercise-card mb-0">
                              <div className="wpd-exercise-top">
                                {/* Thumbnail */}
                                <div
                                  className="wpd-exercise-thumb-wrap"
                                  onClick={() => exerciseImg && setLightboxImage(exerciseImg)}
                                >
                                  <span className="wpd-exercise-index">
                                    #{String(index + 1).padStart(2, "0")}
                                  </span>
                                  {exerciseImg ? (
                                    <>
                                      <img src={exerciseImg} alt={exercise.name} />
                                      <div className="wpd-thumb-overlay">
                                        <IconZoomIn size={20} />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                      <IconPhoto size={28} />
                                    </div>
                                  )}
                                </div>

                                {/* Exercise Name & Meta */}
                                <div className="wpd-exercise-info">
                                  <div className="wpd-exercise-name">{exercise.name}</div>
                                  <div className="wpd-exercise-meta">
                                    {exercise.workoutType?.name && (
                                      <span className="wpd-pill-type">
                                        {exercise.workoutType.name}
                                      </span>
                                    )}
                                    {exercise.bodyPart?.name && (
                                      <span className="wpd-pill-body">
                                        {exercise.bodyPart.name}
                                      </span>
                                    )}
                                    {exercise.equipment && (
                                      <span className="wpd-pill-equip">
                                        {exercise.equipment}
                                      </span>
                                    )}
                                  </div>
                                  <p className="wpd-exercise-desc">
                                    {exercise.description || "Target this movement with strict form and full range of motion."}
                                  </p>
                                </div>
                              </div>

                              {/* 4 Specs Mini Strip */}
                              <div className="wpd-specs-strip">
                                <div className="wpd-spec-item">
                                  <span className="wpd-spec-label">Sets</span>
                                  <span className="wpd-spec-val">
                                    {exercise.sets ? `${exercise.sets}` : "--"}
                                  </span>
                                </div>
                                <div className="wpd-spec-item">
                                  <span className="wpd-spec-label">Reps</span>
                                  <span className="wpd-spec-val">
                                    {exercise.reps ? `${exercise.reps}` : "--"}
                                  </span>
                                </div>
                                <div className="wpd-spec-item">
                                  <span className="wpd-spec-label">Duration</span>
                                  <span className="wpd-spec-val">
                                    {exercise.durationMinutes ? `${exercise.durationMinutes} min` : "--"}
                                  </span>
                                </div>
                                <div className="wpd-spec-item">
                                  <span className="wpd-spec-label">Calories</span>
                                  <span className="wpd-spec-val">
                                    {exercise.caloriesBurned ? `${exercise.caloriesBurned}` : "--"}
                                  </span>
                                </div>
                              </div>

                              {/* Rest Timer Widget */}
                              <div className="wpd-rest-timer-box">
                                <div className="wpd-timer-label">
                                  <IconClock size={15} />
                                  <span>Rest:</span>
                                  {timerActiveForThis && (
                                    <span className="wpd-timer-countdown">
                                      {Math.floor(activeRestTimer.seconds / 60)}:
                                      {String(activeRestTimer.seconds % 60).padStart(2, "0")}
                                    </span>
                                  )}
                                </div>

                                <div className="wpd-timer-btns">
                                  {timerActiveForThis ? (
                                    <>
                                      <button
                                        type="button"
                                        className={activeRestTimer.isRunning ? "active" : ""}
                                        onClick={toggleCardTimer}
                                      >
                                        {activeRestTimer.isRunning ? <IconPlayerPause size={13} /> : <IconPlayerPlay size={13} />}
                                        <span>{activeRestTimer.isRunning ? "Pause" : "Resume"}</span>
                                      </button>
                                      <button type="button" onClick={resetCardTimer}>
                                        <IconRotateClockwise size={13} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button type="button" onClick={() => startCardTimer(exercise.id, 30)}>
                                        30s
                                      </button>
                                      <button type="button" onClick={() => startCardTimer(exercise.id, 60)}>
                                        60s
                                      </button>
                                      <button type="button" onClick={() => startCardTimer(exercise.id, 90)}>
                                        90s
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Instructions Checklist */}
                              {instructions.length > 0 && (
                                <div className="wpd-instructions-box">
                                  <button
                                    type="button"
                                    className="wpd-instructions-toggle"
                                    onClick={() => toggleInstructions(exercise.id)}
                                  >
                                    <span className="d-flex align-items-center gap-2">
                                      <IconCheck size={15} className="text-primary" />
                                      <span>Technique Steps ({instructions.length})</span>
                                    </span>
                                    {isExpanded ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
                                  </button>

                                  {isExpanded && (
                                    <ul className="wpd-steps-list">
                                      {instructions.map((step, sIdx) => (
                                        <li key={`${exercise.id}-step-${sIdx}`} className="wpd-step-item">
                                          <span className="wpd-step-num">{sIdx + 1}</span>
                                          <span>{step}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            )}
          </Container>
        </div>
      </main>
      <Footer />

      {/* Lightbox Modal for Diagram Preview */}
      <Modal
        show={Boolean(lightboxImage)}
        onHide={() => setLightboxImage(null)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6 fw-bold">Exercise Form Diagram</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-3">
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Expanded diagram"
              className="img-fluid rounded-3"
              style={{ maxHeight: "75vh", objectFit: "contain" }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Interactive Workout Runner Modal */}
      <Modal
        show={runnerOpen}
        onHide={() => {
          setRunnerOpen(false);
          setIsRunnerTimerRunning(false);
        }}
        centered
        size="lg"
      >
        <div className="wpd-runner-header">
          <div>
            <span className="badge bg-primary mb-1">Session In Progress</span>
            <h5 className="mb-0 fw-bold">{plan?.name}</h5>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => {
              setRunnerOpen(false);
              setIsRunnerTimerRunning(false);
            }}
          />
        </div>

        <div className="wpd-runner-body">
          {plan?.exercises && plan.exercises[currentRunnerStep] && (
            <>
              {(() => {
                const ex = plan.exercises[currentRunnerStep];
                const exImg = ex.image ? resolveDietImage(ex.image) : "";
                const totalEx = plan.exercises.length;

                return (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="text-muted small">
                        Exercise {currentRunnerStep + 1} of {totalEx}
                      </span>
                      <span className="badge bg-secondary">{ex.difficulty || "Medium"}</span>
                    </div>

                    <div className="d-flex align-items-center gap-3 mb-4">
                      {exImg ? (
                        <img
                          src={exImg}
                          alt={ex.name}
                          className="rounded-3"
                          style={{ width: 80, height: 80, objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="bg-light rounded-3 d-flex align-items-center justify-content-center"
                          style={{ width: 80, height: 80 }}
                        >
                          <IconBarbell size={32} className="text-muted" />
                        </div>
                      )}
                      <div>
                        <h4 className="fw-bold mb-1">{ex.name}</h4>
                        <div className="text-muted small">
                          {ex.sets || 3} Sets • {ex.reps || 10} Reps • {ex.equipment || "Standard Gear"}
                        </div>
                      </div>
                    </div>

                    <div className="wpd-runner-timer-hero">
                      <div className="text-uppercase small fw-bold text-muted">
                        {isRunnerTimerRunning ? "Rest Timer Running" : "Rest Countdown"}
                      </div>
                      <div className="runner-big-time">
                        {Math.floor(runnerTimerSeconds / 60)}:
                        {String(runnerTimerSeconds % 60).padStart(2, "0")}
                      </div>
                      <div className="runner-controls">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary px-3 rounded-pill"
                          onClick={() => setIsRunnerTimerRunning((prev) => !prev)}
                        >
                          {isRunnerTimerRunning ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                          <span className="ms-1">{isRunnerTimerRunning ? "Pause" : "Start"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary px-3 rounded-pill"
                          onClick={() => {
                            setIsRunnerTimerRunning(false);
                            setRunnerTimerSeconds(60);
                          }}
                        >
                          <IconRotateClockwise size={16} />
                          <span className="ms-1">60s</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary px-3 rounded-pill"
                          onClick={() => {
                            setIsRunnerTimerRunning(false);
                            setRunnerTimerSeconds(90);
                          }}
                        >
                          <IconRotateClockwise size={16} />
                          <span className="ms-1">90s</span>
                        </button>
                      </div>
                    </div>

                    <h6 className="fw-bold mb-3">Set Log</h6>
                    {Array.from({ length: ex.sets || 3 }).map((_, sIdx) => {
                      const key = `${ex.id}-set-${sIdx}`;
                      const isDone = Boolean(completedSets[key]);

                      return (
                        <div
                          key={key}
                          className={`wpd-set-row ${isDone ? "completed" : ""}`}
                          onClick={() => {
                            setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
                            if (!isDone) {
                              playChimeTone();
                              setRunnerTimerSeconds(60);
                              setIsRunnerTimerRunning(true);
                            }
                          }}
                        >
                          <span className="set-text">
                            Set {sIdx + 1} — {ex.reps || 10} Reps
                          </span>
                          <span
                            className={`badge ${
                              isDone ? "bg-success" : "bg-light text-dark border"
                            }`}
                          >
                            {isDone ? "✓ Completed" : "Mark Done"}
                          </span>
                        </div>
                      );
                    })}

                    <div className="d-flex align-items-center justify-content-between mt-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill px-3"
                        disabled={currentRunnerStep === 0}
                        onClick={() => setCurrentRunnerStep((prev) => prev - 1)}
                      >
                        Previous Exercise
                      </button>

                      {currentRunnerStep < totalEx - 1 ? (
                        <button
                          type="button"
                          className="btn btn-primary rounded-pill px-4"
                          onClick={() => setCurrentRunnerStep((prev) => prev + 1)}
                        >
                          Next Exercise →
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-success rounded-pill px-4"
                          onClick={() => {
                            playChimeTone();
                            alert("🎉 Outstanding workout completed! Great dedication!");
                            setRunnerOpen(false);
                          }}
                        >
                          Finish Workout 🏆
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
