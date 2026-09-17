import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Col, Container, Row } from "react-bootstrap";
import Slider from "react-slick";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { resolveDietImage } from "../../utils/dietImages";
import { IconArrowLeft, IconChartBar, IconClock, IconGrill, IconHeartBroken, IconListNumbers, IconPointFilled, IconSlice, IconToolsKitchen2Off, IconPhoto } from "@tabler/icons-react";

function normalizeDietPlan(plan) {
  return {
    ...plan,
    name: plan?.name || plan?.title || "Untitled menu item",
    description: plan?.description || "",
    ingredients: Array.isArray(plan?.ingredients) ? plan.ingredients : [],
    directions: Array.isArray(plan?.directions) ? plan.directions : [],
    tools: Array.isArray(plan?.tools) ? plan.tools : [],
    galleryImages: (plan?.galleryImages || []).map(resolveDietImage),
    mainImage: resolveDietImage(plan?.mainImage || plan?.image),
    calories: Number(plan?.calories) || 0,
    protein: Number(plan?.protein) || 0,
    carbs: Number(plan?.carbs) || 0,
    fats: Number(plan?.fats) || 0,
    cholesterol: Number(plan?.cholesterol) || 0,
    sodium: Number(plan?.sodium) || 0,
    potassium: Number(plan?.potassium) || 0,
    vitaminA: Number(plan?.vitaminA) || 0,
    vitaminC: Number(plan?.vitaminC) || 0,
    calcium: Number(plan?.calcium) || 0,
    iron: Number(plan?.iron) || 0,
    prepTime: Number(plan?.prepTime) || 0,
    cookTime: Number(plan?.cookTime) || 0,
    totalSteps: Math.max(Number(plan?.totalSteps) || 1, 1),
    healthScore: Number(plan?.healthScore) || 0,
    status: plan?.status || "ACTIVE",
  };
}

const formatTime = (value) => {
  if (!value) return "--";
  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const unwrapResponseData = (response) => {
  if (response?.data && Object.prototype.hasOwnProperty.call(response.data, "data")) {
    return response.data.data;
  }

  return response?.data ?? null;
};

export default function Dietdetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = String(user?.role || "").toUpperCase();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");

  useEffect(() => {
    // Staff have no "own" diet plan — opening this page without a selected item is
    // meaningless, so send them to the Diet Menu to pick one. Members fall through
    // and load their assigned plan below.
    if (!id && currentRole && currentRole !== "USER") {
      navigate("/dietplan", { replace: true });
      return;
    }

    const loadPlan = async () => {
      setLoading(true);
      setError("");
      setEmptyMessage("");
      try {
        if (currentRole === "USER" && !id) {
          const res = await api.get("/users/me/diet-plan");
          const data = unwrapResponseData(res);
          if (data) {
            setPlan(normalizeDietPlan(data));
          } else {
            setPlan(null);
            setEmptyMessage("No diet plan has been assigned to you yet.");
          }
          return;
        }

        if (!id) {
          setPlan(null);
          setEmptyMessage(currentRole === "USER"
            ? "No diet plan has been assigned to you yet."
            : "Pick a menu item from Diet Menu to view its details.");
          return;
        }

        const res = await api.get(`/diet-plans/${id}`);
        const data = unwrapResponseData(res);
        setPlan(data ? normalizeDietPlan(data) : null);
      } catch (err) {
        setPlan(null);
        setError(currentRole === "USER" && !id
          ? "Unable to load your assigned diet plan."
          : "Unable to load this diet menu item.");
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [id, currentRole, navigate]);

  const imageList = useMemo(() => {
    if (!plan) return [];
    const unique = [plan.mainImage, ...(plan.galleryImages || [])].filter(Boolean);
    return [...new Set(unique)];
  }, [plan]);

  const sliderSettings = useMemo(() => ({
    infinite: imageList.length > 1,
    slidesToShow: 1,
    slidesToScroll: 1,
    speed: 900,
    autoplay: imageList.length > 1,
    autoplaySpeed: 1800,
    cssEase: "linear",
    dots: imageList.length > 1,
    arrows: imageList.length > 1,
    pauseOnHover: false,
    pauseOnFocus: false,
    adaptiveHeight: true,
  }), [imageList.length]);

  const goBack = () => navigate("/dietplan");

  return (
    <>
      <main className="themebody-wrap">
        <div className="theme-body">
          <Container fluid>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <button type="button" className="btn btn-light btn-sm" onClick={goBack}>
                  <IconArrowLeft size={16} className="me-1" />
                  Back to Diet Menu
                </button>
              </div>
              <div className="text-end">
                <h2 className="mb-0">{currentRole === "USER" ? "My Diet Plan" : "Diet Detail"}</h2>
                <small className="text-muted">{plan?.name || "View the selected menu item"}</small>
              </div>
            </div>

            {loading && <div className="alert alert-info">Loading diet menu item...</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && emptyMessage && (
              <div className="alert alert-warning">{emptyMessage}</div>
            )}
            {!loading && !error && !emptyMessage && !id && currentRole !== "USER" && (
              <div className="alert alert-warning">
                Pick a menu item from <Link to="/dietplan">Diet Menu</Link> to view its details.
              </div>
            )}
            {!loading && !error && !emptyMessage && id && !plan && currentRole !== "USER" && (
              <div className="alert alert-warning">No diet menu item was found for this id.</div>
            )}

            {plan && (
              <Row>
                <Col xxl={8}>
                  <Card className="mb-4">
                    <Card.Body>
                      {imageList.length > 0 ? (
                        imageList.length > 1 ? (
                          <Slider {...sliderSettings} className="popularworkout-slider arrow-style1">
                            {imageList.map((image, index) => (
                              <div key={`${image}-${index}`}>
                                <div className="workout-grid">
                                  <img src={image} alt={`${plan.name} ${index + 1}`} className="img-fluid w-100 rounded-3" style={{ maxHeight: 420, objectFit: "cover" }} />
                                </div>
                              </div>
                            ))}
                          </Slider>
                        ) : (
                          <img src={imageList[0]} alt={plan.name} className="img-fluid w-100 rounded-3" style={{ maxHeight: 420, objectFit: "cover" }} />
                        )
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
                          <IconHeartBroken size={16} />
                          {plan.healthScore}/100
                        </span>
                      </div>

                      <h3 className="mb-2 fw-bold">{plan.name}</h3>
                      <p className="text-muted mb-4">{plan.description || "No description provided."}</p>

                      <Row className="gy-3">
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconToolsKitchen2Off />
                            </div>
                            <div>
                              <p>Eat Time</p>
                              <strong>{formatTime(plan.eatTime)}</strong>
                            </div>
                          </div>
                        </Col>
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconSlice />
                            </div>
                            <div>
                              <p>Prep Time</p>
                              <strong>{plan.prepTime} minutes</strong>
                            </div>
                          </div>
                        </Col>
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconGrill />
                            </div>
                            <div>
                              <p>Cook Time</p>
                              <strong>{plan.cookTime} minutes</strong>
                            </div>
                          </div>
                        </Col>
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconChartBar />
                            </div>
                            <div>
                              <p>Difficulty</p>
                              <strong>{plan.difficulty || "Medium"}</strong>
                            </div>
                          </div>
                        </Col>
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconListNumbers />
                            </div>
                            <div>
                              <p>Total Steps</p>
                              <strong>{plan.totalSteps} steps</strong>
                            </div>
                          </div>
                        </Col>
                        <Col md={4} sm={6}>
                          <div className="cooking-grid">
                            <div className="icon-wrap">
                              <IconClock />
                            </div>
                            <div>
                              <p>Total Time</p>
                              <strong>{plan.prepTime + plan.cookTime} minutes</strong>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <Card className="mb-4">
                    <Card.Body>
                      <div className="row">
                        <div className="col-md-6">
                          <h4 className="fw-bold mb-4">Directions</h4>
                          {plan.directions.length > 0 ? (
                            <ul className="direction-list">
                              {plan.directions.map((step, index) => (
                                <li key={`${step}-${index}`}>
                                  <div className="number-wrap">{index + 1}</div>
                                  <h5 className="fw-semibold">Step {index + 1}</h5>
                                  <p>{step}</p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-muted">No directions added yet.</div>
                          )}
                        </div>
                        <div className="col-md-6">
                          <div className="ps-md-3 h-100">
                            <h4 className="fw-bold mb-4">Tools and Equipment</h4>
                            {plan.tools.length > 0 ? (
                              <ul className="toolequipment-list">
                                {plan.tools.map((tool, index) => (
                                  <li key={`${tool}-${index}`}>
                                    <div className="icon-wrap">
                                      <IconPointFilled />
                                    </div>
                                    {tool}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-muted mb-4">No tools listed.</div>
                            )}

                            <h4 className="fw-bold mt-4 mb-4">Notes</h4>
                            {plan.notes ? (
                              <ul className="toolequipment-list">
                                <li className="align-items-start">
                                  <div className="icon-wrap">
                                    <IconPointFilled />
                                  </div>
                                  {plan.notes}
                                </li>
                              </ul>
                            ) : (
                              <div className="text-muted">No notes added.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xxl={4}>
                  <Row>
                    <Col xxl={12} lg={4} md={6}>
                      <Card className="bg-primary mb-4">
                        <Card.Body>
                          <div className="row gy-4">
                            <div className="col-6 text-center">
                              <h5 className="mb-3 fw-bold text-white text-nowrap">Calories</h5>
                              <div className="py-3 rounded-4 bg-white text-center">
                                <h5 className="fw-bold mb-0">{plan.calories}</h5>
                                <span className="font-light">cal</span>
                              </div>
                            </div>
                            <div className="col-6 text-center">
                              <h5 className="mb-3 fw-bold text-white text-nowrap">Protein</h5>
                              <div className="py-3 rounded-4 bg-white text-center">
                                <h5 className="fw-bold mb-0">{plan.protein}</h5>
                                <span className="font-light">g</span>
                              </div>
                            </div>
                            <div className="col-6 text-center">
                              <h5 className="mb-3 fw-bold text-white text-nowrap">Carbs</h5>
                              <div className="py-3 rounded-4 bg-white text-center">
                                <h5 className="fw-bold mb-0">{plan.carbs}</h5>
                                <span className="font-light">g</span>
                              </div>
                            </div>
                            <div className="col-6 text-center">
                              <h5 className="mb-3 fw-bold text-white text-nowrap">Fats</h5>
                              <div className="py-3 rounded-4 bg-white text-center">
                                <h5 className="fw-bold mb-0">{plan.fats}</h5>
                                <span className="font-light">g</span>
                              </div>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col xxl={12} lg={4} md={6}>
                      <Card className="mb-4">
                        <Card.Body>
                          <h4 className="fw-bold mb-3">Ingredients</h4>
                          {plan.ingredients.length > 0 ? (
                            <ul className="toolequipment-list">
                              {plan.ingredients.map((ingredient, index) => (
                                <li key={`${ingredient}-${index}`}>
                                  <div className="icon-wrap">
                                    <IconPointFilled />
                                  </div>
                                  {ingredient}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-muted">No ingredients added.</div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col xxl={12} lg={4} md={12}>
                      <Card>
                        <Card.Body>
                          <h4 className="fw-bold mb-3">Nutrition Facts</h4>
                          <table className="table nutritionfacts-table">
                            <tbody>
                              <tr><td>Calories</td><td className="text-end">{plan.calories}</td></tr>
                              <tr><td>Protein</td><td className="text-end">{plan.protein} g</td></tr>
                              <tr><td>Carbs</td><td className="text-end">{plan.carbs} g</td></tr>
                              <tr><td>Fats</td><td className="text-end">{plan.fats} g</td></tr>
                              <tr><td>Cholesterol</td><td className="text-end">{plan.cholesterol} mg</td></tr>
                              <tr><td>Sodium</td><td className="text-end">{plan.sodium} mg</td></tr>
                              <tr><td>Potassium</td><td className="text-end">{plan.potassium} mg</td></tr>
                              <tr><td>Vitamin A</td><td className="text-end">{plan.vitaminA}% DV</td></tr>
                              <tr><td>Vitamin C</td><td className="text-end">{plan.vitaminC}% DV</td></tr>
                              <tr><td>Calcium</td><td className="text-end">{plan.calcium}% DV</td></tr>
                              <tr><td>Iron</td><td className="text-end">{plan.iron}% DV</td></tr>
                            </tbody>
                          </table>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
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
