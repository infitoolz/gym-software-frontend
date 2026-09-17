import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Col, Container, Row } from "react-bootstrap";
import Slider from "react-slick";
import Footer from "../../components/Footer";
import api from "../../utils/api";
import { resolveDietImage } from "../../utils/dietImages";
import { resolveWorkoutImage } from "../../utils/workoutImages";
import { IconArrowLeft, IconChartBar, IconClock, IconPhoto, IconTarget, IconToolsKitchen2Off, IconListNumbers } from "@tabler/icons-react";
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

export default function WorkoutPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");
  const [coverFailed, setCoverFailed] = useState(false);

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

  const imageList = useMemo(() => {
    if (!plan) return [];
    return [plan.mainImage].filter(Boolean);
  }, [plan]);

  const sliderSettings = useMemo(() => ({
    infinite: false,
    slidesToShow: 1,
    slidesToScroll: 1,
    speed: 600,
    dots: false,
    arrows: false,
    autoplay: false,
    adaptiveHeight: true,
  }), []);

  // Read-only detail view: go back to wherever the user came from (the staff
  // list for staff, the dashboard for members) rather than a fixed staff route.
  const goBack = () => navigate(-1);

  return (
    <>
      <main className="themebody-wrap">
        <div className="theme-body">
          <Container fluid>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <button type="button" className="btn btn-light btn-sm" onClick={goBack}>
                  <IconArrowLeft size={16} className="me-1" />
                  Back
                </button>
              </div>
              <div className="text-end">
                <h2 className="mb-0">Workout Plan Detail</h2>
                <small className="text-muted">{plan?.name || "View the selected workout plan"}</small>
              </div>
            </div>

            {loading && <div className="alert alert-info">Loading workout plan...</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && emptyMessage && <div className="alert alert-warning">{emptyMessage}</div>}
            {!loading && !error && id && !plan && <div className="alert alert-warning">No workout plan was found for this id.</div>}

            {plan && (
              <Row>
                <Col xxl={8}>
                  <Card className="mb-4">
                    <Card.Body>
                      {imageList.length > 1 ? (
                        <Slider {...sliderSettings} className="popularworkout-slider arrow-style1">
                          {imageList.map((image, index) => (
                            <div key={`${image}-${index}`}>
                              <div className="workout-grid">
                                <img src={resolveDietImage(image)} alt={`${plan.name} ${index + 1}`} className="img-fluid w-100 rounded-3" style={{ maxHeight: 420, objectFit: "cover" }} />
                              </div>
                            </div>
                          ))}
                        </Slider>
                      ) : !coverFailed ? (
                        // Uploaded mainImage if present, otherwise a curated cover matched to the plan.
                        <img
                          src={imageList.length === 1 ? resolveDietImage(imageList[0]) : resolveWorkoutImage(plan)}
                          alt={plan.name}
                          className="img-fluid w-100 rounded-3"
                          style={{ maxHeight: 420, objectFit: "cover" }}
                          onError={() => setCoverFailed(true)}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center bg-light rounded-3" style={{ minHeight: 320 }}>
                          <div className="text-center text-muted">
                            <IconPhoto size={32} className="mb-2" />
                            <div>No image attached</div>
                          </div>
                        </div>
                      )}

                      <div className="d-flex align-items-center justify-content-between mt-4 mb-2">
                        <span className={`badge ${plan.status === "ACTIVE" ? "bg-success" : "bg-danger"}`}>{plan.status}</span>
                        <span className="d-flex align-items-center gap-1 text-muted">
                          <IconTarget size={16} />
                          {plan.goal || "General fitness"}
                        </span>
                      </div>

                      <h3 className="mb-2 fw-bold">{plan.name}</h3>
                      <p className="text-muted mb-4">{plan.description || "No description provided."}</p>

                      <Row className="gy-3">
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconClock />
                            </div>
                            <div>
                              <p>Duration</p>
                              <strong>{plan.durationWeeks} weeks</strong>
                            </div>
                          </div>
                        </Col>
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconListNumbers />
                            </div>
                            <div>
                              <p>Days / Week</p>
                              <strong>{plan.daysPerWeek}</strong>
                            </div>
                          </div>
                        </Col>
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconChartBar />
                            </div>
                            <div>
                              <p>Level</p>
                              <strong>{plan.level || "Beginner"}</strong>
                            </div>
                          </div>
                        </Col>
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconToolsKitchen2Off />
                            </div>
                            <div>
                              <p>Estimated Time</p>
                              <strong>{formatTime(plan.estimatedTimeMinutes)}</strong>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      <div className="mt-4">
                        <h5 className="fw-semibold mb-3">Notes</h5>
                        <p className="text-muted mb-0">{plan.notes || "No notes added."}</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xxl={4}>
                  <Card className="mb-4">
                    <Card.Body>
                      <h5 className="fw-semibold mb-3">Exercises</h5>
                      <div className="d-grid gap-3">
                        {(plan.exercises || []).length === 0 ? (
                          <div className="text-muted">No exercises linked to this plan.</div>
                        ) : (
                          plan.exercises.map((exercise) => (
                            <div key={exercise.id} className="border rounded-3 p-3">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                {exercise.image ? (
                                  <img src={resolveDietImage(exercise.image)} alt={exercise.name} className="rounded-2" style={{ width: 56, height: 56, objectFit: "cover" }} />
                                ) : (
                                  <div className="bg-light rounded-2 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                                    <IconPhoto size={18} />
                                  </div>
                                )}
                                <div>
                                  <div className="fw-semibold">{exercise.name}</div>
                                  <small className="text-muted">{exercise.workoutType?.name || "-"} | {exercise.bodyPart?.name || "-"}</small>
                                </div>
                              </div>
                              <div className="small text-muted mb-2">{exercise.description || "No description provided."}</div>
                              <div className="small">
                                <div><strong>Sets:</strong> {exercise.sets}</div>
                                <div><strong>Reps:</strong> {exercise.reps}</div>
                                <div><strong>Duration:</strong> {exercise.durationMinutes} min</div>
                                <div><strong>Calories Burned:</strong> {exercise.caloriesBurned}</div>
                              </div>
                              {Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
                                <ul className="mt-2 mb-0 small text-muted">
                                  {exercise.instructions.map((step, index) => <li key={`${exercise.id}-${index}`}>{step}</li>)}
                                </ul>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Container>
        </div>
      </main>
      <Footer />
    </>
  );
}
