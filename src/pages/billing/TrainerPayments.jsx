import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, InputGroup } from "react-bootstrap";
import { IconWallet, IconPlus, IconSearch, IconDownload, IconCheck, IconX } from "@tabler/icons-react";
import Swal from "sweetalert2";

export default function TrainerPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    trainerId: "",
    paymentPeriodStart: "",
    paymentPeriodEnd: "",
    baseSalary: 0,
    commissionAmount: 0,
    bonusAmount: 0,
    deductionAmount: 0,
    paymentMethod: "BANK_TRANSFER",
    notes: ""
  });

  const mockPayments = [
    {
      id: 1,
      trainerName: "Ravi Kumar",
      paymentPeriod: "2024-06-01 to 2024-06-30",
      baseSalary: 30000,
      commission: 5000,
      bonus: 2000,
      deduction: 1000,
      totalAmount: 36000,
      paymentDate: "2024-07-05",
      status: "PAID",
      method: "BANK_TRANSFER"
    },
    {
      id: 2,
      trainerName: "Priya Singh",
      paymentPeriod: "2024-06-01 to 2024-06-30",
      baseSalary: 25000,
      commission: 3000,
      bonus: 1500,
      deduction: 500,
      totalAmount: 29000,
      paymentDate: "2024-07-05",
      status: "PENDING",
      method: "RAZORPAY"
    },
    {
      id: 3,
      trainerName: "Amit Patel",
      paymentPeriod: "2024-06-01 to 2024-06-30",
      baseSalary: 28000,
      commission: 4500,
      bonus: 2000,
      deduction: 800,
      totalAmount: 33700,
      paymentDate: "2024-07-10",
      status: "PROCESSING",
      method: "BANK_TRANSFER"
    }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPayments(mockPayments);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = payments.filter(p => {
    const matchesSearch = p.trainerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID":
        return <Badge bg="success"><IconCheck size={14} /> Paid</Badge>;
      case "PENDING":
        return <Badge bg="warning">⧗ Pending</Badge>;
      case "PROCESSING":
        return <Badge bg="info">⟳ Processing</Badge>;
      case "FAILED":
        return <Badge bg="danger"><IconX size={14} /> Failed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handleCreatePayment = () => {
    if (!formData.trainerId || !formData.baseSalary) {
      Swal.fire("Validation Error", "Please fill all required fields", "error");
      return;
    }
    Swal.fire("Success", "Payment record created!", "success");
    setShowModal(false);
    setFormData({
      trainerId: "",
      paymentPeriodStart: "",
      paymentPeriodEnd: "",
      baseSalary: 0,
      commissionAmount: 0,
      bonusAmount: 0,
      deductionAmount: 0,
      paymentMethod: "BANK_TRANSFER",
      notes: ""
    });
  };

  const totalPaid = payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.totalAmount, 0);
  const totalPending = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div style={{ background: "#f0f2f8", minHeight: "100vh", padding: "32px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <IconWallet size={32} /> Trainer Payments
        </h1>
        <p style={{ color: "#6c757d", marginTop: 6, fontSize: 15 }}>
          Manage trainer salaries, commissions, and bonuses
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 36 }}>
        {[
          { label: "Total Payments", value: payments.length, color: "#667eea" },
          { label: "Total Paid", value: `₹${totalPaid.toLocaleString("en-IN")}`, color: "#28a745" },
          { label: "Pending", value: `₹${totalPending.toLocaleString("en-IN")}`, color: "#ffc107" },
          { label: "Avg Payment", value: `₹${Math.round(payments.reduce((s, p) => s + p.totalAmount, 0) / payments.length).toLocaleString("en-IN")}`, color: "#17a2b8" }
        ].map((stat) => (
          <Card key={stat.label} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <Card.Body>
              <div style={{ color: stat.color, fontSize: 28, fontWeight: 800 }}>{stat.value}</div>
              <div style={{ color: "#6c757d", fontSize: 13, marginTop: 8 }}>{stat.label}</div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card style={{ marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text style={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}>
                  <IconSearch size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search trainer name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: "1px solid #e0e0e0" }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ border: "1px solid #e0e0e0" }}
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button
                variant="primary"
                style={{ width: "100%", background: "#667eea", border: "none" }}
                onClick={() => setShowModal(true)}
              >
                <IconPlus size={18} /> Create Payment
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Payments Table */}
      <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5" style={{ color: "#6c757d" }}>
              <p>No payments found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Table hover>
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Trainer</th>
                    <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Period</th>
                    <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Base Salary</th>
                    <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Commission</th>
                    <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Bonus</th>
                    <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Deduction</th>
                    <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Total</th>
                    <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Status</th>
                    <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment) => (
                    <tr key={payment.id}>
                      <td style={{ fontWeight: 700 }}>{payment.trainerName}</td>
                      <td style={{ fontSize: 13 }}>{payment.paymentPeriod}</td>
                      <td>₹{payment.baseSalary.toLocaleString("en-IN")}</td>
                      <td style={{ color: "#28a745", fontWeight: 700 }}>+₹{payment.commission.toLocaleString("en-IN")}</td>
                      <td style={{ color: "#28a745", fontWeight: 700 }}>+₹{payment.bonus.toLocaleString("en-IN")}</td>
                      <td style={{ color: "#dc3545", fontWeight: 700 }}>-₹{payment.deduction.toLocaleString("en-IN")}</td>
                      <td style={{ fontWeight: 800, fontSize: 16, color: "#667eea" }}>₹{payment.totalAmount.toLocaleString("en-IN")}</td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>
                        <Button size="sm" variant="outline-primary">
                          <IconDownload size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create Payment Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Trainer Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trainer</Form.Label>
                  <Form.Select
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                  >
                    <option value="">Select trainer...</option>
                    <option value="1">Ravi Kumar</option>
                    <option value="2">Priya Singh</option>
                    <option value="3">Amit Patel</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="RAZORPAY">Razorpay</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Period Start</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.paymentPeriodStart}
                    onChange={(e) => setFormData({ ...formData, paymentPeriodStart: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Period End</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.paymentPeriodEnd}
                    onChange={(e) => setFormData({ ...formData, paymentPeriodEnd: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Base Salary (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Commission (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.commissionAmount}
                    onChange={(e) => setFormData({ ...formData, commissionAmount: parseFloat(e.target.value) })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bonus (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.bonusAmount}
                    onChange={(e) => setFormData({ ...formData, bonusAmount: parseFloat(e.target.value) })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deduction (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.deductionAmount}
                    onChange={(e) => setFormData({ ...formData, deductionAmount: parseFloat(e.target.value) })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreatePayment}>
            Create Payment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
