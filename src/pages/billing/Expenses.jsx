import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, InputGroup } from "react-bootstrap";
import { IconCreditCard, IconPlus, IconSearch, IconTrash, IconEdit } from "@tabler/icons-react";
import Swal from "sweetalert2";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    category: "OTHER",
    amount: 0,
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    vendorName: "",
    referenceNumber: "",
    notes: ""
  });

  const mockExpenses = [
    {
      id: 1,
      description: "Equipment - Dumbbells",
      category: "EQUIPMENT",
      amount: 15000,
      expenseDate: "2024-06-05",
      vendor: "Fitness Gear Ltd.",
      status: "APPROVED"
    },
    {
      id: 2,
      description: "Monthly Electricity Bill",
      category: "UTILITIES",
      amount: 8000,
      expenseDate: "2024-06-10",
      vendor: "Electric Supply Board",
      status: "APPROVED"
    },
    {
      id: 3,
      description: "Monthly Rent",
      category: "RENT",
      amount: 50000,
      expenseDate: "2024-06-01",
      vendor: "Property Owner",
      status: "APPROVED"
    },
    {
      id: 4,
      description: "A/C Maintenance",
      category: "MAINTENANCE",
      amount: 3000,
      expenseDate: "2024-06-15",
      vendor: "Cool Tech Services",
      status: "PENDING"
    },
    {
      id: 5,
      description: "Facebook Ads",
      category: "MARKETING",
      amount: 2000,
      expenseDate: "2024-06-20",
      vendor: "Facebook",
      status: "APPROVED"
    }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setExpenses(mockExpenses);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
                         e.vendor.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = {
      "EQUIPMENT": "#667eea",
      "UTILITIES": "#17a2b8",
      "MAINTENANCE": "#ffc107",
      "RENT": "#fd7e14",
      "SALARY": "#28a745",
      "MARKETING": "#e83e8c",
      "OTHER": "#6c757d"
    };
    return colors[category] || "#6c757d";
  };

  const getStatusBadge = (status) => {
    return status === "APPROVED" ? 
      <Badge bg="success">✓ Approved</Badge> : 
      <Badge bg="warning">⧗ Pending</Badge>;
  };

  const handleCreateExpense = () => {
    if (!formData.description || !formData.amount) {
      Swal.fire("Validation Error", "Please fill all required fields", "error");
      return;
    }
    Swal.fire("Success", "Expense recorded!", "success");
    setShowModal(false);
    setFormData({
      description: "",
      category: "OTHER",
      amount: 0,
      expenseDate: new Date().toISOString().split("T")[0],
      paymentMethod: "CASH",
      vendorName: "",
      referenceNumber: "",
      notes: ""
    });
  };

  const categoryTotals = {};
  expenses.forEach(e => {
    if (!categoryTotals[e.category]) categoryTotals[e.category] = 0;
    categoryTotals[e.category] += e.amount;
  });

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ background: "#f0f2f8", minHeight: "100vh", padding: "32px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <IconCreditCard size={32} /> Expenses
        </h1>
        <p style={{ color: "#6c757d", marginTop: 6, fontSize: 15 }}>
          Track and manage gym expenses
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 36 }}>
        {[
          { label: "Total Expenses", value: `₹${totalExpenses.toLocaleString("en-IN")}`, color: "#dc3545" },
          { label: "Equipment", value: `₹${(categoryTotals["EQUIPMENT"] || 0).toLocaleString("en-IN")}`, color: "#667eea" },
          { label: "Rent", value: `₹${(categoryTotals["RENT"] || 0).toLocaleString("en-IN")}`, color: "#fd7e14" },
          { label: "Utilities", value: `₹${(categoryTotals["UTILITIES"] || 0).toLocaleString("en-IN")}`, color: "#17a2b8" }
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
                  placeholder="Search description or vendor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: "1px solid #e0e0e0" }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ border: "1px solid #e0e0e0" }}
              >
                <option value="ALL">All Categories</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="UTILITIES">Utilities</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RENT">Rent</option>
                <option value="SALARY">Salary</option>
                <option value="MARKETING">Marketing</option>
                <option value="OTHER">Other</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button
                variant="primary"
                style={{ width: "100%", background: "#667eea", border: "none" }}
                onClick={() => setShowModal(true)}
              >
                <IconPlus size={18} /> Record Expense
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Expenses Table */}
      <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5" style={{ color: "#6c757d" }}>
              <p>No expenses found</p>
            </div>
          ) : (
            <Table hover>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Description</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Category</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Vendor</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Amount</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Date</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Status</th>
                  <th style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => (
                  <tr key={expense.id}>
                    <td style={{ fontWeight: 700 }}>{expense.description}</td>
                    <td>
                      <span style={{
                        background: getCategoryColor(expense.category) + "20",
                        color: getCategoryColor(expense.category),
                        padding: "4px 12px",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 12
                      }}>
                        {expense.category}
                      </span>
                    </td>
                    <td>{expense.vendor}</td>
                    <td style={{ fontWeight: 800, color: "#dc3545" }}>₹{expense.amount.toLocaleString("en-IN")}</td>
                    <td style={{ fontSize: 13 }}>{expense.expenseDate}</td>
                    <td>{getStatusBadge(expense.status)}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" style={{ marginRight: 6 }}>
                        <IconEdit size={16} />
                      </Button>
                      <Button size="sm" variant="outline-danger">
                        <IconTrash size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Record Expense Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Record New Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Monthly Rent, Equipment Purchase"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="EQUIPMENT">Equipment</option>
                <option value="UTILITIES">Utilities</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RENT">Rent</option>
                <option value="SALARY">Salary</option>
                <option value="MARKETING">Marketing</option>
                <option value="OTHER">Other</option>
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
              <Form.Label>Expense Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Method</Form.Label>
              <Form.Select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Vendor Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., ABC Suppliers"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reference Number (Invoice/Receipt)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., INV-12345"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              />
            </Form.Group>
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
          <Button variant="primary" onClick={handleCreateExpense}>
            Record Expense
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
