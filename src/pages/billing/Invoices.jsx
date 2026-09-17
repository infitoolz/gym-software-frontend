import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, InputGroup } from "react-bootstrap";
import { IconFileInvoice, IconPlus, IconDownload, IconSearch, IconCalendar, IconMail } from "@tabler/icons-react";
import Swal from "sweetalert2";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    memberId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    subtotal: 0,
    discountAmount: 0,
    notes: ""
  });

  // Mock data - replace with API calls
  const mockInvoices = [
    {
      id: 1,
      invoiceNumber: "INV-2024-001",
      memberName: "Ravi Kumar",
      amount: 9999,
      paymentStatus: "PAID",
      invoiceDate: "2024-06-01",
      dueDate: "2024-06-15"
    },
    {
      id: 2,
      invoiceNumber: "INV-2024-002",
      memberName: "Priya Singh",
      amount: 19999,
      paymentStatus: "PENDING",
      invoiceDate: "2024-06-05",
      dueDate: "2024-06-20"
    },
    {
      id: 3,
      invoiceNumber: "INV-2024-003",
      memberName: "Amit Patel",
      amount: 4999,
      paymentStatus: "OVERDUE",
      invoiceDate: "2024-05-20",
      dueDate: "2024-06-05"
    }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setInvoices(mockInvoices);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = invoices.filter(inv => {
    const matchesSearch = inv.memberName.toLowerCase().includes(search.toLowerCase()) || 
                         inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || inv.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAID":
        return <Badge bg="success">✓ Paid</Badge>;
      case "PENDING":
        return <Badge bg="warning">⧗ Pending</Badge>;
      case "OVERDUE":
        return <Badge bg="danger">✕ Overdue</Badge>;
      case "PARTIALLY_PAID":
        return <Badge bg="info">◐ Partial</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handleDownloadInvoice = (invoiceNumber) => {
    Swal.fire("Success", `Invoice ${invoiceNumber} downloaded!`, "success");
  };

  const handleSendEmail = (memberName) => {
    Swal.fire("Success", `Invoice sent to ${memberName}'s email!`, "success");
  };

  const handleCreateInvoice = () => {
    if (!formData.memberId || !formData.subtotal) {
      Swal.fire("Validation Error", "Please fill all required fields", "error");
      return;
    }
    Swal.fire("Success", "Invoice created successfully!", "success");
    setShowModal(false);
    setFormData({
      memberId: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      subtotal: 0,
      discountAmount: 0,
      notes: ""
    });
  };

  return (
    <div style={{ background: "#f0f2f8", minHeight: "100vh", padding: "32px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <IconFileInvoice size={32} /> Invoices
        </h1>
        <p style={{ color: "#6c757d", marginTop: 6, fontSize: 15 }}>
          Manage and track all member invoices
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 36 }}>
        {[
          { label: "Total Invoices", value: invoices.length, color: "#667eea" },
          { label: "Paid", value: invoices.filter(i => i.paymentStatus === "PAID").length, color: "#28a745" },
          { label: "Pending", value: invoices.filter(i => i.paymentStatus === "PENDING").length, color: "#ffc107" },
          { label: "Overdue", value: invoices.filter(i => i.paymentStatus === "OVERDUE").length, color: "#dc3545" }
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
                  placeholder="Search invoice number or member..."
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
                <option value="OVERDUE">Overdue</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button
                variant="primary"
                style={{ width: "100%", background: "#667eea", border: "none" }}
                onClick={() => setShowModal(true)}
              >
                <IconPlus size={18} /> Create Invoice
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Invoices Table */}
      <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5" style={{ color: "#6c757d" }}>
              <p>No invoices found</p>
            </div>
          ) : (
            <Table hover>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Invoice #</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Member</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Amount</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Invoice Date</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Due Date</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Status</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => (
                  <tr key={invoice.id}>
                    <td style={{ fontWeight: 700, color: "#667eea" }}>{invoice.invoiceNumber}</td>
                    <td>{invoice.memberName}</td>
                    <td style={{ fontWeight: 700 }}>₹{invoice.amount.toLocaleString("en-IN")}</td>
                    <td>{invoice.invoiceDate}</td>
                    <td>{invoice.dueDate}</td>
                    <td>{getStatusBadge(invoice.paymentStatus)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        style={{ marginRight: 8 }}
                        onClick={() => handleDownloadInvoice(invoice.invoiceNumber)}
                        title="Download PDF"
                      >
                        <IconDownload size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-info"
                        onClick={() => handleSendEmail(invoice.memberName)}
                        title="Send Email"
                      >
                        <IconMail size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Invoice Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Invoice</Modal.Title>
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
              <Form.Label>Invoice Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subtotal (₹)</Form.Label>
              <Form.Control
                type="number"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Discount (₹)</Form.Label>
              <Form.Control
                type="number"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) })}
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
          <Button variant="primary" onClick={handleCreateInvoice}>
            Create Invoice
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
