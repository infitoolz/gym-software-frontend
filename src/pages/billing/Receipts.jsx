import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, InputGroup } from "react-bootstrap";
import { IconReceipt, IconPlus, IconDownload, IconSearch, IconMail, IconPrinter } from "@tabler/icons-react";
import Swal from "sweetalert2";

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    memberId: "",
    amount: 0,
    paymentMethod: "CASH",
    receiptDate: new Date().toISOString().split("T")[0],
    paymentReference: "",
    notes: ""
  });

  const mockReceipts = [
    {
      id: 1,
      receiptNumber: "RCP-2024-001",
      memberName: "Ravi Kumar",
      amount: 9999,
      paymentMethod: "RAZORPAY",
      receiptDate: "2024-06-01",
      paymentReference: "razorpay_pay_1234567890"
    },
    {
      id: 2,
      receiptNumber: "RCP-2024-002",
      memberName: "Priya Singh",
      amount: 5000,
      paymentMethod: "CASH",
      receiptDate: "2024-06-05",
      paymentReference: ""
    },
    {
      id: 3,
      receiptNumber: "RCP-2024-003",
      memberName: "Amit Patel",
      amount: 4999,
      paymentMethod: "UPI",
      receiptDate: "2024-06-10",
      paymentReference: "UPI123456"
    }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setReceipts(mockReceipts);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = receipts.filter(r => {
    const matchesSearch = r.memberName.toLowerCase().includes(search.toLowerCase()) || 
                         r.receiptNumber.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === "ALL" || r.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const getMethodBadge = (method) => {
    const colors = {
      "RAZORPAY": "primary",
      "PHONEPE": "info",
      "UPI": "success",
      "CASH": "warning",
      "CARD": "secondary",
      "BANK_TRANSFER": "dark"
    };
    return <Badge bg={colors[method] || "secondary"}>{method}</Badge>;
  };

  const handleCreateReceipt = () => {
    if (!formData.memberId || !formData.amount) {
      Swal.fire("Validation Error", "Please fill all required fields", "error");
      return;
    }
    Swal.fire("Success", "Receipt created successfully!", "success");
    setShowModal(false);
    setFormData({
      memberId: "",
      amount: 0,
      paymentMethod: "CASH",
      receiptDate: new Date().toISOString().split("T")[0],
      paymentReference: "",
      notes: ""
    });
  };

  const handleDownloadReceipt = (receiptNumber) => {
    Swal.fire("Success", `Receipt ${receiptNumber} downloaded!`, "success");
  };

  const handlePrintReceipt = (receiptNumber) => {
    window.print();
    Swal.fire("Info", "Print preview opened", "info");
  };

  return (
    <div style={{ background: "#f0f2f8", minHeight: "100vh", padding: "32px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <IconReceipt size={32} /> Payment Receipts
        </h1>
        <p style={{ color: "#6c757d", marginTop: 6, fontSize: 15 }}>
          All payment receipts and records
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 36 }}>
        {[
          { label: "Total Receipts", value: receipts.length, color: "#667eea" },
          { label: "Total Amount", value: `₹${receipts.reduce((s, r) => s + r.amount, 0).toLocaleString("en-IN")}`, color: "#28a745" },
          { label: "Cash", value: receipts.filter(r => r.paymentMethod === "CASH").length, color: "#ffc107" },
          { label: "Online", value: receipts.filter(r => ["RAZORPAY", "PHONEPE", "UPI"].includes(r.paymentMethod)).length, color: "#17a2b8" }
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
                  placeholder="Search receipt number or member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: "1px solid #e0e0e0" }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                style={{ border: "1px solid #e0e0e0" }}
              >
                <option value="ALL">All Methods</option>
                <option value="RAZORPAY">Razorpay</option>
                <option value="PHONEPE">PhonePe</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button
                variant="primary"
                style={{ width: "100%", background: "#667eea", border: "none" }}
                onClick={() => setShowModal(true)}
              >
                <IconPlus size={18} /> Create Receipt
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Receipts Table */}
      <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5" style={{ color: "#6c757d" }}>
              <p>No receipts found</p>
            </div>
          ) : (
            <Table hover>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Receipt #</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Member</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Amount</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Method</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Date</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((receipt) => (
                  <tr key={receipt.id}>
                    <td style={{ fontWeight: 700, color: "#667eea" }}>{receipt.receiptNumber}</td>
                    <td>{receipt.memberName}</td>
                    <td style={{ fontWeight: 700, color: "#28a745" }}>₹{receipt.amount.toLocaleString("en-IN")}</td>
                    <td>{getMethodBadge(receipt.paymentMethod)}</td>
                    <td>{receipt.receiptDate}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        style={{ marginRight: 6 }}
                        onClick={() => handleDownloadReceipt(receipt.receiptNumber)}
                      >
                        <IconDownload size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-info"
                        style={{ marginRight: 6 }}
                        onClick={() => handlePrintReceipt(receipt.receiptNumber)}
                      >
                        <IconPrinter size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Receipt Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Member</Form.Label>
              <Form.Select
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              >
                <option value="">Select member...</option>
                <option value="1">Ravi Kumar</option>
                <option value="2">Priya Singh</option>
                <option value="3">Amit Patel</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount (₹)</Form.Label>
              <Form.Control
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Method</Form.Label>
              <Form.Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="RAZORPAY">Razorpay</option>
                <option value="PHONEPE">PhonePe</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Receipt Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.receiptDate}
                onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Reference (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Razorpay ID, PhonePe ID, etc."
                value={formData.paymentReference}
                onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
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
          <Button variant="primary" onClick={handleCreateReceipt}>
            Create Receipt
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
