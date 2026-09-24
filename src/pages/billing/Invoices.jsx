import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, InputGroup } from "react-bootstrap";
import {
  IconFileInvoice, IconPlus, IconDownload, IconSearch, IconCalendar,
  IconMail, IconRefresh, IconCheck, IconX, IconPrinter, IconFileText
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getInvoices, createInvoice, getCustomers, sendInvoiceEmail } from "../../api/billingApi";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  };

  const initialForm = {
    memberId: "",
    invoiceDate: getTodayStr(),
    dueDate: getDefaultDueDate(),
    subtotal: "",
    discountAmount: 0,
    taxAmount: 0,
    paymentStatus: "PENDING",
    notes: ""
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesData, membersData] = await Promise.all([
        getInvoices().catch(() => []),
        getCustomers().catch(() => [])
      ]);

      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (err) {
      console.error("Error loading invoices:", err);
      Swal.fire("Error", "Could not load invoices from database", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = invoices.filter((inv) => {
    const memberName = (inv.memberName || "").toLowerCase();
    const invoiceNum = (inv.invoiceNumber || "").toLowerCase();
    const memberIdStr = String(inv.memberId || "");
    const q = search.toLowerCase();

    const matchesSearch =
      memberName.includes(q) ||
      invoiceNum.includes(q) ||
      memberIdStr.includes(q);

    const matchesStatus =
      statusFilter === "ALL" ||
      (inv.paymentStatus || "").toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "PAID":
        return <Badge bg="success" className="d-inline-flex align-items-center gap-1"><IconCheck size={13} /> Paid</Badge>;
      case "PENDING":
        return <Badge bg="warning" text="dark">⧗ Pending</Badge>;
      case "OVERDUE":
        return <Badge bg="danger" className="d-inline-flex align-items-center gap-1"><IconX size={13} /> Overdue</Badge>;
      case "PARTIALLY_PAID":
        return <Badge bg="info">◐ Partial</Badge>;
      default:
        return <Badge bg="secondary">{s || "PENDING"}</Badge>;
    }
  };

  const printInvoiceDocument = (invoice) => {
    if (!invoice) return;
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
        <title>Invoice_${invoice.invoiceNumber || "doc"}</title>
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
          .invoice-box {
            max-width: 600px;
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
          .invoice-badge {
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
            width: 40%;
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
            border: 2px solid #2563eb;
            color: #2563eb;
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
        <div class="invoice-box">
          <div class="header">
            <div class="brand">FITNEXA FITNESS</div>
            <div class="tagline">Official Member Tax Invoice / Bill</div>
            <div class="invoice-badge">${invoice.invoiceNumber || "INV-OFFICIAL"}</div>
          </div>

          <table class="details-table">
            <tbody>
              <tr>
                <td class="label">Invoice Date:</td>
                <td class="value">${invoice.invoiceDate || "—"}</td>
              </tr>
              <tr>
                <td class="label">Due Date:</td>
                <td class="value" style="color: #dc2626;">${invoice.dueDate || "—"}</td>
              </tr>
              <tr>
                <td class="label">Billed To (Member):</td>
                <td class="value">${invoice.memberName || "Member #" + invoice.memberId}</td>
              </tr>
              ${invoice.memberEmail ? `
              <tr>
                <td class="label">Member Email:</td>
                <td class="value" style="font-weight: 500;">${invoice.memberEmail}</td>
              </tr>` : ""}
              <tr>
                <td class="label">Payment Status:</td>
                <td class="value">${invoice.paymentStatus || "PENDING"}</td>
              </tr>
              ${invoice.notes ? `
              <tr>
                <td class="label">Description / Purpose:</td>
                <td class="value" style="font-weight: 600;">${invoice.notes}</td>
              </tr>` : ""}
              <tr>
                <td class="label">Subtotal:</td>
                <td class="value">₹${(Number(invoice.subtotal || invoice.amount) || 0).toLocaleString("en-IN")}</td>
              </tr>
              ${Number(invoice.discountAmount) > 0 ? `
              <tr>
                <td class="label">Discount Applied:</td>
                <td class="value" style="color: #16a34a;">-₹${(Number(invoice.discountAmount) || 0).toLocaleString("en-IN")}</td>
              </tr>` : ""}
              <tr class="total-row">
                <td class="label" style="font-size: 16px; font-weight: 800; color: #0f172a;">Total Amount Due:</td>
                <td class="value total-price">₹${(Number(invoice.totalAmount || invoice.amount) || 0).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div class="stamp-box">
            <span class="stamp">✓ ${invoice.paymentStatus === "PAID" ? "PAID IN FULL" : "PAYMENT DUE"}</span>
          </div>

          <div class="footer">
            <div>FitNexa Fitness Management • Official Invoice</div>
            <div>Thank you for choosing FitNexa Fitness!</div>
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

  const computedTotal = Math.max(
    0,
    (Number(formData.subtotal) || 0) -
      (Number(formData.discountAmount) || 0) +
      (Number(formData.taxAmount) || 0)
  );

  const handleCreateInvoice = async (e) => {
    if (e) e.preventDefault();
    if (!formData.memberId) {
      Swal.fire("Validation Error", "Please select a member", "warning");
      return;
    }
    if (!formData.subtotal || Number(formData.subtotal) <= 0) {
      Swal.fire("Validation Error", "Please enter a valid subtotal greater than 0", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        memberId: formData.memberId,
        subtotal: Number(formData.subtotal),
        discountAmount: Number(formData.discountAmount || 0),
        taxAmount: Number(formData.taxAmount || 0),
        totalAmount: computedTotal,
        invoiceDate: formData.invoiceDate || getTodayStr(),
        dueDate: formData.dueDate || getDefaultDueDate(),
        paymentStatus: formData.paymentStatus || "PENDING",
        notes: formData.notes || null
      };

      await createInvoice(payload);

      Swal.fire({
        icon: "success",
        title: "Invoice Created",
        text: "Member invoice generated and saved to database successfully!",
        timer: 2000,
        showConfirmButton: false
      });

      setShowModal(false);
      setFormData(initialForm);
      await fetchData();
    } catch (err) {
      console.error("Error creating invoice:", err);
      Swal.fire("Error", err?.response?.data?.message || err.message || "Failed to create invoice", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendEmail = async (invoice) => {
    const defaultEmail = invoice.memberEmail || "";
    const { value: email, isConfirmed } = await Swal.fire({
      icon: "question",
      title: "Send Invoice Email",
      html: `
        <div class="text-start">
          <p class="mb-2">Send official invoice <strong>${invoice.invoiceNumber}</strong> (₹${(Number(invoice.totalAmount || invoice.amount) || 0).toLocaleString("en-IN")}) to member:</p>
          <div class="mb-1 text-muted small">Recipient Email Address:</div>
        </div>
      `,
      input: "email",
      inputValue: defaultEmail,
      inputPlaceholder: "Enter member's email",
      inputValidator: (value) => {
        if (!value || !value.includes("@")) {
          return "Please enter a valid email address";
        }
      },
      showCancelButton: true,
      confirmButtonText: "Send Invoice Email",
      confirmButtonColor: "#2563eb",
      cancelButtonText: "Cancel"
    });

    if (isConfirmed && email) {
      Swal.fire({
        title: "Sending Invoice...",
        text: `Sending email to ${email} (BCC: sudharanib1806@gmail.com)...`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        await sendInvoiceEmail(invoice.id, email);
        Swal.fire({
          icon: "success",
          title: "Email Sent!",
          text: `Invoice ${invoice.invoiceNumber} was successfully dispatched to ${email} (with copy BCCed to sudharanib1806@gmail.com).`
        });
      } catch (err) {
        console.error("Failed to send invoice email:", err);
        Swal.fire({
          icon: "error",
          title: "Failed to Send",
          text: err?.response?.data?.message || err.message || "Failed to dispatch email."
        });
      }
    }
  };

  const paidCount = invoices.filter((i) => (i.paymentStatus || "").toUpperCase() === "PAID").length;
  const pendingCount = invoices.filter((i) => (i.paymentStatus || "").toUpperCase() === "PENDING").length;
  const overdueCount = invoices.filter((i) => (i.paymentStatus || "").toUpperCase() === "OVERDUE").length;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px 20px", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: "#1e293b" }}>
            <IconFileInvoice size={28} className="text-primary" /> Member Invoices
          </h2>
          <p className="text-muted small mb-0">
            Manage and track official member fee invoices, due dates, and billing statuses.
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
            <IconPlus size={16} /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Invoices", value: invoices.length, color: "#6366f1" },
          { label: "Paid", value: paidCount, color: "#10b981" },
          { label: "Pending", value: pendingCount, color: "#f59e0b" },
          { label: "Overdue", value: overdueCount, color: "#ef4444" }
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
                  placeholder="Search invoice number, member name or ID..."
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
                <option value="OVERDUE">Overdue</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <Button
                variant="primary"
                className="w-100 d-flex align-items-center justify-content-center gap-1"
                onClick={() => setShowModal(true)}
              >
                <IconPlus size={16} /> Create Invoice
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Invoices Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="text-muted small mt-2">Loading live invoices from database...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <IconFileInvoice size={48} className="text-muted opacity-50 mb-2" />
              <h5 className="fw-bold text-dark">No invoices found</h5>
              <p className="text-muted small mb-3">
                {search || statusFilter !== "ALL"
                  ? "No invoices match the search criteria."
                  : "No member invoices found in the database. Create the first invoice to start billing members."}
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                <IconPlus size={15} /> Create First Invoice
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light text-uppercase small text-muted">
                  <tr>
                    <th className="ps-4">Invoice #</th>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="ps-4">
                        <span className="fw-bold text-primary font-monospace">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {invoice.memberName || `Member #${invoice.memberId}`}
                        </div>
                        {invoice.memberEmail && (
                          <small className="text-muted">{invoice.memberEmail}</small>
                        )}
                      </td>
                      <td>
                        <span className="fw-bold fs-6" style={{ color: "#0f172a" }}>
                          ₹{(Number(invoice.totalAmount || invoice.amount) || 0).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="small text-muted">{invoice.invoiceDate || "—"}</td>
                      <td className="small text-muted">{invoice.dueDate || "—"}</td>
                      <td>{getStatusBadge(invoice.paymentStatus)}</td>
                      <td className="text-end pe-4">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="p-1 px-2 me-1"
                          title="View / Print Invoice Slip"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <IconFileText size={15} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          className="p-1 px-2 me-1"
                          title="Direct Print Invoice"
                          onClick={() => printInvoiceDocument(invoice)}
                        >
                          <IconPrinter size={15} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-info"
                          className="p-1 px-2"
                          title="Send Email"
                          onClick={() => handleSendEmail(invoice)}
                        >
                          <IconMail size={15} />
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

      {/* Create Invoice Modal */}
      <Modal show={showModal} onHide={() => !submitting && setShowModal(false)} centered size="lg">
        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <IconFileInvoice size={22} className="text-primary" /> Create Member Invoice
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateInvoice}>
          <Modal.Body className="p-4">
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Member <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Member --</option>
                    {members.map((m) => {
                      const name = [m.firstName, m.lastName].filter(Boolean).join(" ") ||
                        m.name ||
                        m.email ||
                        `Member #${m.id}`;
                      return (
                        <option key={m.id} value={m.id}>
                          {name} (ID: {m.id})
                        </option>
                      );
                    })}
                  </Form.Select>
                  {members.length === 0 && (
                    <small className="text-muted d-block mt-1">
                      No members found. Ensure members are registered in User Management.
                    </small>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Payment Status</Form.Label>
                  <Form.Select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  >
                    <option value="PENDING">Pending (Payment Due)</option>
                    <option value="PAID">Paid in Full</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Invoice Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Card className="bg-light border-0 p-3 mb-3">
              <h6 className="fw-bold small mb-2 text-dark">Price Calculation</h6>
              <Row className="g-2">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">Subtotal (₹) *</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="e.g. 2997"
                      value={formData.subtotal}
                      onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">Discount (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">Tax / GST (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={formData.taxAmount}
                      onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <span className="fw-semibold text-dark">Net Payable Invoice Total:</span>
                <span className="fs-5 fw-bold text-primary">
                  ₹{computedTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </Card>

            <Form.Group>
              <Form.Label className="fw-semibold small">Description / Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="e.g. 3 Months Premium Membership subscription fee, Locker renewal..."
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
                  <Spinner animation="border" size="sm" className="me-1" /> Generating Invoice...
                </>
              ) : (
                "Save & Issue Invoice"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View / Print Invoice Voucher Modal */}
      {selectedInvoice && (
        <Modal show={true} onHide={() => setSelectedInvoice(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-6 d-flex align-items-center gap-2">
              <IconFileInvoice size={20} className="text-primary" /> Invoice Voucher #{selectedInvoice.invoiceNumber}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <div className="text-center pb-3 border-bottom mb-3">
              <h5 className="fw-bold text-dark mb-1">FITNEXA FITNESS</h5>
              <p className="text-muted small mb-1">Official Member Tax Invoice</p>
              <span className="badge bg-light text-primary border font-monospace fs-6">
                {selectedInvoice.invoiceNumber}
              </span>
            </div>

            <Table size="sm" borderless className="mb-3">
              <tbody>
                <tr>
                  <td className="text-muted small">Invoice Date:</td>
                  <td className="text-end fw-semibold">{selectedInvoice.invoiceDate || "—"}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Due Date:</td>
                  <td className="text-end text-danger fw-semibold">{selectedInvoice.dueDate || "—"}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Billed To:</td>
                  <td className="text-end fw-bold text-dark">
                    {selectedInvoice.memberName || `Member #${selectedInvoice.memberId}`}
                  </td>
                </tr>
                {selectedInvoice.memberEmail && (
                  <tr>
                    <td className="text-muted small">Email:</td>
                    <td className="text-end text-muted small">{selectedInvoice.memberEmail}</td>
                  </tr>
                )}
                <tr>
                  <td className="text-muted small">Payment Status:</td>
                  <td className="text-end">{getStatusBadge(selectedInvoice.paymentStatus)}</td>
                </tr>
                {selectedInvoice.notes && (
                  <tr>
                    <td className="text-muted small">Description:</td>
                    <td className="text-end text-muted small">{selectedInvoice.notes}</td>
                  </tr>
                )}
                <tr>
                  <td className="text-muted small">Subtotal:</td>
                  <td className="text-end">₹{(Number(selectedInvoice.subtotal || selectedInvoice.amount) || 0).toLocaleString("en-IN")}</td>
                </tr>
                {Number(selectedInvoice.discountAmount) > 0 && (
                  <tr>
                    <td className="text-muted small">Discount:</td>
                    <td className="text-end text-success">-₹{(Number(selectedInvoice.discountAmount) || 0).toLocaleString("en-IN")}</td>
                  </tr>
                )}
                <tr className="border-top pt-2">
                  <td className="fs-6 fw-bold text-dark pt-2">Total Payable:</td>
                  <td className="text-end fs-5 fw-bold text-primary pt-2">
                    ₹{(Number(selectedInvoice.totalAmount || selectedInvoice.amount) || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </Table>

            <div className="d-flex gap-2 mt-3">
              <Button
                variant="primary"
                className="flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                onClick={() => printInvoiceDocument(selectedInvoice)}
              >
                <IconPrinter size={16} /> Print / Save PDF
              </Button>
              <Button
                variant="outline-primary"
                className="d-flex align-items-center justify-content-center gap-1"
                onClick={() => handleSendEmail(selectedInvoice)}
              >
                <IconMail size={16} /> Send Email
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
