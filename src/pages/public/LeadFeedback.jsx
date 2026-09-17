import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Spinner, Form } from "react-bootstrap";
import { IconStarFilled, IconCheck, IconBuildingCommunity } from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getLeadById, updateLead } from "../../api/leadsApi";

export default function LeadFeedback() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const data = await getLeadById(id);
        if (data) {
          setLead(data);
          // Check if already submitted
          if (data.notes && data.notes.includes("⭐ Rating:")) {
            setSubmitted(true);
          }
        }
      } catch (error) {
        console.error("Failed to load lead details", error);
        Swal.fire("Error", "Invalid or expired feedback link.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Swal.fire("Required", "Please select a star rating.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const prob = lead.conversionProbability || 50;
      const newProb = rating >= 4 ? Math.min(prob + 20, 95) : rating >= 3 ? Math.min(prob + 10, 95) : prob;
      
      await updateLead(id, {
        ...lead,
        notes: `${lead.notes || ""}\n⭐ Rating: ${rating}/5 | Feedback: ${feedback} [${new Date().toLocaleDateString()}]`,
        conversionProbability: newProb
      });
      setSubmitted(true);
    } catch (error) {
      Swal.fire("Error", "Failed to submit feedback. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ background: "#f8fafc" }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted fw-semibold">Loading...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ background: "#f8fafc" }}>
        <h4 className="fw-bold text-danger">Link Expired</h4>
        <p className="text-muted">This feedback link is no longer valid.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 20px" }}>
      <Container className="d-flex justify-content-center">
        <Card style={{ maxWidth: 500, width: "100%", borderRadius: 20, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <Card.Body className="p-4 p-md-5 text-center">
            
            <div className="mb-4 d-flex justify-content-center align-items-center">
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconBuildingCommunity size={28} />
              </div>
            </div>

            <h3 className="fw-bold mb-1" style={{ color: "#1e293b" }}>FitNexus Gym</h3>
            <p className="text-muted mb-4">Trial Experience Feedback</p>

            {submitted ? (
              <div className="py-5">
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <IconCheck size={32} />
                </div>
                <h4 className="fw-bold text-success mb-2">Thank You!</h4>
                <p className="text-muted mb-0">Your feedback has been successfully submitted. We hope to see you again soon!</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.6, marginBottom: 30 }}>
                  Hi <b>{lead.name.split(" ")[0]}</b>! Thank you for completing your free trial. How was your experience with our trainers and facility today?
                </p>

                <div className="mb-4 d-flex justify-content-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      style={{
                        background: "none", border: "none", padding: 0,
                        color: rating >= star ? "#f59e0b" : "#e2e8f0",
                        transition: "color 0.2s",
                        cursor: "pointer"
                      }}
                    >
                      <IconStarFilled size={42} />
                    </button>
                  ))}
                </div>

                <Form.Group className="mb-4 text-start">
                  <Form.Label className="fw-bold text-muted small text-uppercase">Any additional comments? (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Tell us what you loved or what we could improve..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    style={{ borderRadius: 12, border: "1.5px solid #e2e8f0", padding: 16, fontSize: 14, resize: "none" }}
                  />
                </Form.Group>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 12,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
                    fontWeight: 700, fontSize: 16,
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)"
                  }}
                >
                  {submitting ? <Spinner size="sm" /> : "Submit Feedback"}
                </Button>
              </>
            )}

          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
