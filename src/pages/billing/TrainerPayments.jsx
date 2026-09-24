import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, InputGroup } from "react-bootstrap";
import {
  IconWallet, IconPlus, IconSearch, IconDownload, IconCheck, IconX,
  IconRefresh, IconReceipt, IconFileText, IconUser
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getTrainerPayments, createTrainerPayment } from "../../api/billingApi";
import { getTrainers } from "../../api/userAdminApi";

export default function TrainerPayments() {
  const [payments, setPayments] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const initialForm = {
    trainerId: "",
    paymentPeriodStart: "",
    paymentPeriodEnd: "",
    paymentDate: new Date().toISOString().split("T")[0],
    baseSalary: "",
    commissionAmount: "",
    bonusAmount: "",
    deductionAmount: "",
    paymentMethod: "BANK_TRANSFER",
    status: "PAID",
    transactionReference: "",
    notes: ""
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsData, trainersData] = await Promise.all([
        getTrainerPayments().catch(() => []),
        getTrainers().catch(() => [])
      ]);

      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setTrainers(Array.isArray(trainersData) ? trainersData : []);
    } catch (err) {
      console.error("Error loading trainer payments:", err);
      Swal.fire("Error", "Could not load trainer payment records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = payments.filter((p) => {
    const trainerName = (p.trainerName || "").toLowerCase();
    const trainerIdStr = String(p.trainerId || "");
    const matchesSearch =
      trainerName.includes(search.toLowerCase()) ||
      trainerIdStr.includes(search);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID":
        return <Badge bg="success" className="d-inline-flex align-items-center gap-1"><IconCheck size={13} /> Paid</Badge>;
      case "PENDING":
        return <Badge bg="warning" text="dark">⧗ Pending</Badge>;
      case "PROCESSING":
        return <Badge bg="info">⟳ Processing</Badge>;
      case "FAILED":
        return <Badge bg="danger" className="d-inline-flex align-items-center gap-1"><IconX size={13} /> Failed</Badge>;
      default:
        return <Badge bg="secondary">{status || "UNKNOWN"}</Badge>;
    }
  };

  const computedTotal = Math.max(
    0,
    (Number(formData.baseSalary) || 0) +
      (Number(formData.commissionAmount) || 0) +
      (Number(formData.bonusAmount) || 0) -
      (Number(formData.deductionAmount) || 0)
  );

  const printPaymentSlip = (payment) => {
    if (!payment) return;
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payout_Slip_${payment.id}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .payout-container {
            max-width: 560px;
            margin: 0 auto;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 36px 32px;
            background: #ffffff;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #cbd5e1;
            padding-bottom: 24px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 28px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 1.5px;
          }
          .tagline {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .slip-badge {
            display: inline-block;
            margin-top: 14px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            padding: 6px 18px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: 800;
            font-family: monospace;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .details-table tr {
            border-bottom: 1px solid #f1f5f9;
          }
          .details-table td {
            padding: 12px 6px;
            font-size: 14px;
          }
          .details-table td.label {
            color: #64748b;
            font-weight: 500;
            width: 45%;
          }
          .details-table td.value {
            font-weight: 700;
            color: #0f172a;
            text-align: right;
          }
          .total-row {
            border-top: 2px solid #0f172a !important;
            border-bottom: 2px solid #0f172a !important;
            background: #f8fafc;
          }
          .total-row td {
            padding: 16px 8px !important;
          }
          .total-price {
            font-size: 24px;
            font-weight: 900;
            color: #2563eb;
          }
          .stamp-box {
            text-align: center;
            margin: 20px 0 16px;
          }
          .stamp {
            display: inline-block;
            border: 2px solid #16a34a;
            color: #16a34a;
            padding: 6px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .footer {
            text-align: center;
            border-top: 1px dashed #cbd5e1;
            padding-top: 18px;
            margin-top: 16px;
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="payout-container">
          <div class="header">
            <div class="brand">FITNEXA FITNESS</div>
            <div class="tagline">Trainer Salary & Disbursement Voucher</div>
            <div class="slip-badge">PAYOUT #${payment.id}</div>
          </div>

          <table class="details-table">
            <tbody>
              <tr>
                <td class="label">Date:</td>
                <td class="value">${payment.paymentDate || new Date().toISOString().split("T")[0]}</td>
              </tr>
              <tr>
                <td class="label">Trainer:</td>
                <td class="value">${payment.trainerName || "Trainer #" + payment.trainerId}</td>
              </tr>
              <tr>
                <td class="label">Payment Period:</td>
                <td class="value">
                  ${payment.paymentPeriodStart && payment.paymentPeriodEnd ? payment.paymentPeriodStart + " → " + payment.paymentPeriodEnd : "—"}
                </td>
              </tr>
              <tr>
                <td class="label">Base Salary:</td>
                <td class="value">₹${(Number(payment.baseSalary) || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td class="label">Commission:</td>
                <td class="value" style="color: #16a34a;">+₹${(Number(payment.commissionAmount) || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td class="label">Bonus:</td>
                <td class="value" style="color: #16a34a;">+₹${(Number(payment.bonusAmount) || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td class="label">Deductions:</td>
                <td class="value" style="color: #dc2626;">-₹${(Number(payment.deductionAmount) || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td class="label">Payment Method:</td>
                <td class="value">${payment.paymentMethod || "BANK_TRANSFER"}</td>
              </tr>
              ${payment.transactionReference ? `
              <tr>
                <td class="label">Reference / UTR:</td>
                <td class="value" style="font-family: monospace;">${payment.transactionReference}</td>
              </tr>` : ""}
              ${payment.notes ? `
              <tr>
                <td class="label">Notes:</td>
                <td class="value">${payment.notes}</td>
              </tr>` : ""}
              <tr class="total-row">
                <td class="label" style="font-size: 16px; font-weight: 800; color: #0f172a;">Net Payout:</td>
                <td class="value total-price">₹${(Number(payment.totalAmount) || 0).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div class="stamp-box">
            <span class="stamp">✓ ${payment.status || "DISBURSED"}</span>
          </div>

          <div class="footer">
            <div>FitNexa Fitness Management System</div>
            <div>This is an official computer-generated payout voucher.</div>
          </div>
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1500);
    }, 250);
  };

  const handleCreatePayment = async (e) => {
    if (e) e.preventDefault();
    if (!formData.trainerId) {
      Swal.fire("Validation Error", "Please select a trainer", "warning");
      return;
    }
    if (formData.baseSalary === "" || Number(formData.baseSalary) < 0) {
      Swal.fire("Validation Error", "Please enter a valid base salary (0 or higher)", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        trainerId: formData.trainerId,
        paymentPeriodStart: formData.paymentPeriodStart || null,
        paymentPeriodEnd: formData.paymentPeriodEnd || null,
        paymentDate: formData.paymentDate || new Date().toISOString().split("T")[0],
        baseSalary: Number(formData.baseSalary || 0),
        commissionAmount: Number(formData.commissionAmount || 0),
        bonusAmount: Number(formData.bonusAmount || 0),
        deductionAmount: Number(formData.deductionAmount || 0),
        totalAmount: computedTotal,
        paymentMethod: formData.paymentMethod || "BANK_TRANSFER",
        status: formData.status || "PAID",
        transactionReference: formData.transactionReference || null,
        notes: formData.notes || null
      };

      await createTrainerPayment(payload);

      Swal.fire({
        icon: "success",
        title: "Payout Recorded",
        text: "Trainer payment recorded successfully!",
        timer: 2000,
        showConfirmButton: false
      });

      setShowModal(false);
      setFormData(initialForm);
      await fetchData();
    } catch (err) {
      console.error("Error creating payment:", err);
      Swal.fire("Error", err?.response?.data?.message || err.message || "Failed to create payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + (Number(p.totalAmount) || 0), 0);

  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + (Number(p.totalAmount) || 0), 0);

  const avgPayment =
    payments.length > 0
      ? Math.round(
          payments.reduce((s, p) => s + (Number(p.totalAmount) || 0), 0) / payments.length
        )
      : 0;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px 20px", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: "#1e293b" }}>
            <IconWallet size={28} className="text-primary" /> Trainer Payments & Payouts
          </h2>
          <p className="text-muted small mb-0">
            Manage live trainer salaries, commissions, attendance bonuses, and disbursement records.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={fetchData} disabled={loading}>
            <IconRefresh size={16} className={loading ? "spin" : ""} /> Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={() => setShowModal(true)}
          >
            <IconPlus size={16} /> Process Payout
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Payments", value: payments.length, color: "#6366f1" },
          { label: "Total Paid", value: `₹${totalPaid.toLocaleString("en-IN")}`, color: "#10b981" },
          { label: "Pending Payouts", value: `₹${totalPending.toLocaleString("en-IN")}`, color: "#f59e0b" },
          { label: "Avg Payment", value: `₹${avgPayment.toLocaleString("en-IN")}`, color: "#0ea5e9" }
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <div style={{ color: stat.color, fontSize: 24, fontWeight: 800 }}>{stat.value}</div>
              <div className="text-muted small mt-1">{stat.label}</div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <IconSearch size={16} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by trainer name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <Button
                variant="primary"
                className="w-100 d-flex align-items-center justify-content-center gap-1"
                onClick={() => setShowModal(true)}
              >
                <IconPlus size={16} /> Process Payout
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Payments Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="text-muted small mt-2">Loading live trainer payments...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <IconWallet size={48} className="text-muted opacity-50 mb-2" />
              <h5 className="fw-bold text-dark">No payments recorded</h5>
              <p className="text-muted small mb-3">
                {search || statusFilter !== "ALL"
                  ? "No payment records match your filters."
                  : "No trainer payment records found in the database. Process the first payout to get started."}
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                <IconPlus size={15} /> Process First Payout
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light text-uppercase small text-muted">
                  <tr>
                    <th className="ps-4">Trainer</th>
                    <th>Period / Date</th>
                    <th>Base Salary</th>
                    <th>Commission</th>
                    <th>Bonus</th>
                    <th>Deduction</th>
                    <th>Total Net</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment) => {
                    const periodStr =
                      payment.paymentPeriodStart && payment.paymentPeriodEnd
                        ? `${payment.paymentPeriodStart} → ${payment.paymentPeriodEnd}`
                        : payment.paymentDate || "—";

                    return (
                      <tr key={payment.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-light-primary text-primary d-flex align-items-center justify-content-center fw-bold"
                              style={{ width: 34, height: 34, fontSize: 13 }}
                            >
                              {(payment.trainerName || "T").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{payment.trainerName || `Trainer #${payment.trainerId}`}</div>
                              <small className="text-muted">ID: {payment.trainerId}</small>
                            </div>
                          </div>
                        </td>
                        <td className="small text-muted">{periodStr}</td>
                        <td>₹{(Number(payment.baseSalary) || 0).toLocaleString("en-IN")}</td>
                        <td className="text-success fw-semibold">
                          +₹{(Number(payment.commissionAmount) || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="text-success fw-semibold">
                          +₹{(Number(payment.bonusAmount) || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="text-danger fw-semibold">
                          -₹{(Number(payment.deductionAmount) || 0).toLocaleString("en-IN")}
                        </td>
                        <td>
                          <span className="fw-bold text-primary fs-6">
                            ₹{(Number(payment.totalAmount) || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="border text-uppercase small">
                            {payment.paymentMethod || "BANK"}
                          </Badge>
                        </td>
                        <td>{getStatusBadge(payment.status)}</td>
                        <td className="text-end pe-4">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="p-1 px-2"
                            title="View / Print Slip"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <IconFileText size={15} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create Payment Modal */}
      <Modal show={showModal} onHide={() => !submitting && setShowModal(false)} centered size="lg">
        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <IconWallet size={22} className="text-primary" /> Process Trainer Payout
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreatePayment}>
          <Modal.Body className="p-4">
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Trainer <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Trainer --</option>
                    {trainers.map((t) => {
                      const name = t.firstName
                        ? `${t.firstName} ${t.lastName || ""}`.trim()
                        : (t.name || t.email || `Trainer #${t.id}`);
                      return (
                        <option key={t.id} value={t.id}>
                          {name} (ID: {t.id})
                        </option>
                      );
                    })}
                  </Form.Select>
                  {trainers.length === 0 && (
                    <small className="text-muted d-block mt-1">
                      No trainers found. Ensure trainers are registered in User Management.
                    </small>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Payment Method</Form.Label>
                  <Form.Select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="CASH">Cash</option>
                    <option value="RAZORPAY">Razorpay Payout</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CHEQUE">Cheque</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Period Start</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.paymentPeriodStart}
                    onChange={(e) => setFormData({ ...formData, paymentPeriodStart: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Period End</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.paymentPeriodEnd}
                    onChange={(e) => setFormData({ ...formData, paymentPeriodEnd: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Payment Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Card className="bg-light border-0 p-3 mb-3">
              <h6 className="fw-bold small mb-2 text-dark">Salary Breakdown</h6>
              <Row className="g-2">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">Base Salary (₹) *</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">Commission (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={formData.commissionAmount}
                      onChange={(e) => setFormData({ ...formData, commissionAmount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">Bonus (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={formData.bonusAmount}
                      onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">Deduction (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={formData.deductionAmount}
                      onChange={(e) => setFormData({ ...formData, deductionAmount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <span className="fw-semibold text-dark">Calculated Net Payout:</span>
                <span className="fs-5 fw-bold text-success">
                  ₹{computedTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </Card>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Payout Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PAID">PAID (Disbursed)</option>
                    <option value="PENDING">PENDING (Scheduled)</option>
                    <option value="PROCESSING">PROCESSING</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Transaction / Reference ID</Form.Label>
                  <Form.Control
                    placeholder="e.g. UTR12345678, CHQ#4401"
                    value={formData.transactionReference}
                    onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="fw-semibold small">Notes / Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Optional payment notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" /> Recording...
                </>
              ) : (
                "Confirm & Record Payout"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Slip Modal */}
      {selectedPayment && (
        <Modal show={true} onHide={() => setSelectedPayment(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-6">
              Payment Receipt #{selectedPayment.id}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <div className="text-center mb-3">
              <div className="fw-bold fs-5">{selectedPayment.trainerName || `Trainer #${selectedPayment.trainerId}`}</div>
              <small className="text-muted">Date: {selectedPayment.paymentDate || "—"}</small>
            </div>
            <Table size="sm" bordered className="mb-3">
              <tbody>
                <tr>
                  <td>Base Salary</td>
                  <td className="text-end">₹{(Number(selectedPayment.baseSalary) || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td>Commission</td>
                  <td className="text-end text-success">+₹{(Number(selectedPayment.commissionAmount) || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td>Bonus</td>
                  <td className="text-end text-success">+₹{(Number(selectedPayment.bonusAmount) || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td>Deductions</td>
                  <td className="text-end text-danger">-₹{(Number(selectedPayment.deductionAmount) || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr className="fw-bold table-light">
                  <td>Total Net Amount</td>
                  <td className="text-end text-primary">₹{(Number(selectedPayment.totalAmount) || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td>Payment Method</td>
                  <td className="text-end">{selectedPayment.paymentMethod || "BANK"}</td>
                </tr>
                <tr>
                  <td>Status</td>
                  <td className="text-end">{getStatusBadge(selectedPayment.status)}</td>
                </tr>
                {selectedPayment.transactionReference && (
                  <tr>
                    <td>Reference UTR</td>
                    <td className="text-end font-monospace">{selectedPayment.transactionReference}</td>
                  </tr>
                )}
                {selectedPayment.notes && (
                  <tr>
                    <td>Notes</td>
                    <td className="text-end text-muted">{selectedPayment.notes}</td>
                  </tr>
                )}
              </tbody>
            </Table>
            <Button variant="outline-primary" className="w-100" onClick={() => printPaymentSlip(selectedPayment)}>
              <IconDownload size={16} className="me-1" /> Print / Save Slip
            </Button>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
