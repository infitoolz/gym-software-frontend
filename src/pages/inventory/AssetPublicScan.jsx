import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Card, Button, Form, Spinner, Badge } from "react-bootstrap";
import {
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconBarbell,
  IconBottle,
  IconHeartHandshake,
  IconTools,
  IconSend,
  IconArrowLeft,
  IconShieldCheck,
  IconInfoCircle,
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getPublicInventoryById, reportPublicIssue } from "../../api/inventoryApi";
import "./inventory.css";

const COMMON_ISSUES = [
  "Belt Slipping / Loose",
  "Screen Not Turning On",
  "Unusual Noise / Motor Heat",
  "Emergency Stop Key Missing",
  "Speed / Incline Not Responding",
  "Wear & Tear / Broken Part",
];

export default function AssetPublicScan() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Report form state
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState(COMMON_ISSUES[0]);
  const [issueDetails, setIssueDetails] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAsset = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicInventoryById(id);
      if (data) {
        setItem(data);
      } else {
        setError("Equipment not found or removed from gym directory.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load equipment details. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAsset();
    }
  }, [id]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);
    try {
      await reportPublicIssue(id, {
        issueType: selectedIssueType,
        issue: issueDetails,
        reportedBy: reportedBy?.trim() || "Gym Floor Member",
      });

      Swal.fire({
        title: "Report Submitted!",
        text: "Thank you for reporting. Gym staff and technicians have been notified.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      setShowReportForm(false);
      setIssueDetails("");
      fetchAsset(); // Refresh status to show under maintenance
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to submit report. Please inform front desk.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center p-4 text-center"
        style={{ minHeight: "100vh", background: "#f8fafc" }}
      >
        <Spinner animation="border" variant="primary" style={{ width: 44, height: 44 }} />
        <h6 className="mt-3 text-dark fw-bold">Connecting to FitNexa Gym...</h6>
        <p className="text-muted small">Loading equipment information</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center p-4 text-center"
        style={{ minHeight: "100vh", background: "#f8fafc" }}
      >
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mb-3 p-3"
          style={{ background: "#fee2e2", color: "#ef4444" }}
        >
          <IconAlertTriangle size={36} />
        </div>
        <h4 className="fw-bold text-dark mb-2">Asset Not Found</h4>
        <p className="text-muted small mb-4" style={{ maxWidth: 320 }}>
          {error || "This equipment tag is not registered in the gym inventory."}
        </p>
        <Button variant="outline-primary" size="sm" onClick={fetchAsset}>
          Try Again
        </Button>
      </div>
    );
  }

  const isOperational = item.status === "IN_STOCK";
  const isMaintenance = item.status === "MAINTENANCE";
  const skuTag = `AST-${String(item.id || id).padStart(4, "0")}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
        padding: "1.25rem 0.85rem",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <Container style={{ maxWidth: 480 }}>
        {/* ── Brand Header ────────────────────────────────────────────── */}
        <div className="text-center mb-3">
          <div className="d-inline-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill shadow-sm mb-2 border">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#2563eb",
                display: "inline-block",
              }}
            />
            <span className="fw-bold text-dark" style={{ fontSize: "12px", letterSpacing: "1px" }}>
              FITNEXA SMART GYM
            </span>
          </div>
          <h5 className="fw-bold text-dark mb-0">Equipment Status & Floor Check</h5>
        </div>

        {/* ── Main Asset Card ─────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-3 bg-white">
          {/* Status Banner */}
          <div
            style={{
              padding: "0.85rem 1.25rem",
              background: isOperational
                ? "linear-gradient(90deg, #059669, #10b981)"
                : isMaintenance
                ? "linear-gradient(90deg, #dc2626, #ef4444)"
                : "linear-gradient(90deg, #d97706, #f59e0b)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              {isOperational ? (
                <IconCheck size={20} className="bg-white text-success rounded-circle p-1" />
              ) : isMaintenance ? (
                <IconTools size={20} className="bg-white text-danger rounded-circle p-1" />
              ) : (
                <IconAlertTriangle size={20} className="bg-white text-warning rounded-circle p-1" />
              )}
              <span className="fw-bold fs-6">
                {isOperational
                  ? "Operational & Ready to Use"
                  : isMaintenance
                  ? "Under Maintenance / Out of Order"
                  : "Needs Attention"}
              </span>
            </div>
            <span
              className="badge bg-white text-dark fw-bold px-2 py-1"
              style={{ fontSize: "11px", letterSpacing: "0.5px" }}
            >
              {skuTag}
            </span>
          </div>

          <Card.Body className="p-3">
            <div className="mb-3">
              <span className="badge bg-light text-primary border px-2 py-1 mb-1">
                {item.category || "Equipment"}
              </span>
              <h4 className="fw-bold text-dark mb-1">{item.itemName}</h4>
              {item.notes && (
                <p className="text-muted small mb-0" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                  {item.notes.split("\n")[0]}
                </p>
              )}
            </div>

            {/* Quick Metrics */}
            <div
              className="p-2 rounded-3 mb-3 d-flex justify-content-between align-items-center"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
            >
              <div>
                <span className="text-muted small d-block" style={{ fontSize: "11px" }}>
                  Last Checked
                </span>
                <span className="fw-semibold text-dark small d-flex align-items-center gap-1">
                  <IconClock size={13} className="text-primary" />
                  {item.lastMaintained
                    ? new Date(item.lastMaintained).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Verified"}
                </span>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block" style={{ fontSize: "11px" }}>
                  Floor Availability
                </span>
                <span className="fw-bold text-success small">
                  {item.quantity ? `${item.quantity} available` : "Verified"}
                </span>
              </div>
            </div>

            {/* Report Issue Button / Expand Trigger */}
            {!showReportForm ? (
              <Button
                variant={isMaintenance ? "outline-secondary" : "outline-danger"}
                className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 rounded-3 fw-semibold"
                onClick={() => setShowReportForm(true)}
              >
                <IconAlertTriangle size={18} />
                <span>Notice an issue? Report to Staff</span>
              </Button>
            ) : (
              /* Report Problem Form */
              <div
                className="p-3 rounded-3 border mt-2"
                style={{ background: "#fffafb", borderColor: "#fecaca" }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-danger mb-0 d-flex align-items-center gap-1">
                    <IconAlertTriangle size={16} /> Report Machine Problem
                  </h6>
                  <button
                    type="button"
                    className="btn-close"
                    style={{ fontSize: "10px" }}
                    onClick={() => setShowReportForm(false)}
                  />
                </div>

                <Form onSubmit={handleReportSubmit}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold text-dark mb-1">
                      Problem Type
                    </Form.Label>
                    <Form.Select
                      size="sm"
                      value={selectedIssueType}
                      onChange={(e) => setSelectedIssueType(e.target.value)}
                    >
                      {COMMON_ISSUES.map((issue) => (
                        <option key={issue} value={issue}>
                          {issue}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold text-dark mb-1">
                      What happened? (optional)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      size="sm"
                      placeholder="e.g. Belt slips above speed 5.0, strange grinding noise..."
                      value={issueDetails}
                      onChange={(e) => setIssueDetails(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold text-dark mb-1">
                      Your Name or Mobile (optional)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      size="sm"
                      placeholder="e.g. Alex (Member)"
                      value={reportedBy}
                      onChange={(e) => setReportedBy(e.target.value)}
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="w-50"
                      onClick={() => setShowReportForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      type="submit"
                      disabled={submitting}
                      className="w-50 d-flex align-items-center justify-content-center gap-1"
                    >
                      {submitting ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        <>
                          <IconSend size={14} /> Submit
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* ── Safe Usage Guide ────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white">
          <div className="d-flex align-items-center gap-2 mb-2">
            <IconShieldCheck size={20} className="text-primary" />
            <h6 className="fw-bold text-dark mb-0">Safe Gym Floor Tips</h6>
          </div>
          <ul className="text-muted small ps-3 mb-0" style={{ fontSize: "12px", lineHeight: "1.6" }}>
            <li>Attach the emergency safety magnetic clip before starting.</li>
            <li>Stand on side rails while starting belt or adjusting speed.</li>
            <li>Wipe down console, handles, and heart rate sensors after use.</li>
          </ul>
        </Card>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="text-center text-muted small mt-3" style={{ fontSize: "11px" }}>
          FitNexa Asset Tracking System &bull; Powered by FitNexa Smart Gym
        </div>
      </Container>
    </div>
  );
}
