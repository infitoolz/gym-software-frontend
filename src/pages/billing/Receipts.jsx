import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, InputGroup } from "react-bootstrap";
import {
  IconReceipt, IconPlus, IconDownload, IconSearch, IconPrinter,
  IconRefresh, IconCheck, IconFileText, IconCash, IconCreditCard, IconMail
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getReceipts, createReceipt, getCustomers, sendReceiptEmail } from "../../api/billingApi";

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const initialForm = {
    memberId: "",
    amount: "",
    paymentMethod: "CASH",
    receiptDate: new Date().toISOString().split("T")[0],
    paymentReference: "",
    notes: ""
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [receiptsData, membersData] = await Promise.all([
        getReceipts().catch(() => []),
        getCustomers().catch(() => [])
      ]);

      setReceipts(Array.isArray(receiptsData) ? receiptsData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (err) {
      console.error("Error loading receipts:", err);
      Swal.fire("Error", "Could not load receipts from database", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = receipts.filter((r) => {
    const memberName = (r.memberName || "").toLowerCase();
    const receiptNum = (r.receiptNumber || "").toLowerCase();
    const memberIdStr = String(r.memberId || "");
    const q = search.toLowerCase();

    const matchesSearch =
      memberName.includes(q) ||
      receiptNum.includes(q) ||
      memberIdStr.includes(q);

    const matchesMethod =
      methodFilter === "ALL" || (r.paymentMethod || "").toUpperCase() === methodFilter.toUpperCase();

    return matchesSearch && matchesMethod;
  });

  const printReceiptDocument = (receipt) => {
    if (!receipt) return;
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
        <title>Receipt_${receipt.receiptNumber || "voucher"}</title>
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
          .receipt-container {
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
          .receipt-badge {
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
            width: 38%;
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
            color: #16a34a;
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
        <div class="receipt-container">
          <div class="header">
            <div class="brand">FITNEXA FITNESS</div>
            <div class="tagline">Official Payment Receipt Voucher</div>
            <div class="receipt-badge">${receipt.receiptNumber || "RCP-OFFICIAL"}</div>
          </div>

          <table class="details-table">
            <tbody>
              <tr>
                <td class="label">Date:</td>
                <td class="value">${receipt.receiptDate || new Date().toISOString().split("T")[0]}</td>
              </tr>
              <tr>
                <td class="label">Received From:</td>
                <td class="value">${receipt.memberName || "Member #" + receipt.memberId}</td>
              </tr>
              ${receipt.memberEmail ? `
              <tr>
                <td class="label">Member Email:</td>
                <td class="value" style="font-weight: 500;">${receipt.memberEmail}</td>
              </tr>` : ""}
              <tr>
                <td class="label">Payment Method:</td>
                <td class="value">${receipt.paymentMethod || "CASH"}</td>
              </tr>
              ${receipt.paymentReference ? `
              <tr>
                <td class="label">Reference / UTR:</td>
                <td class="value" style="font-family: monospace;">${receipt.paymentReference}</td>
              </tr>` : ""}
              ${receipt.notes ? `
              <tr>
                <td class="label">Purpose / Notes:</td>
                <td class="value" style="font-weight: 600;">${receipt.notes}</td>
              </tr>` : ""}
              <tr class="total-row">
                <td class="label" style="font-size: 16px; font-weight: 800; color: #0f172a;">Amount Paid:</td>
                <td class="value total-price">₹${(Number(receipt.amount) || 0).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div class="stamp-box">
            <span class="stamp">✓ PAYMENT CONFIRMED</span>
          </div>

          <div class="footer">
            <div>Thank you for choosing FitNexa Fitness!</div>
            <div>This is a verified computer-generated receipt. No signature required.</div>
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

  const getMethodBadge = (method) => {
    const m = (method || "").toUpperCase();
    const colors = {
      RAZORPAY: "primary",
      PHONEPE: "info",
      UPI: "success",
      CASH: "warning",
      CARD: "secondary",
      BANK_TRANSFER: "dark"
    };
    return (
      <Badge bg={colors[m] || "secondary"} text={m === "CASH" ? "dark" : "white"}>
        {m || "UNKNOWN"}
      </Badge>
    );
  };

  const handleCreateReceipt = async (e) => {
    if (e) e.preventDefault();
    if (!formData.memberId) {
      Swal.fire("Validation Error", "Please select a member", "warning");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      Swal.fire("Validation Error", "Please enter a valid amount greater than 0", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        memberId: formData.memberId,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod || "CASH",
        receiptDate: formData.receiptDate || new Date().toISOString().split("T")[0],
        paymentReference: formData.paymentReference || null,
        notes: formData.notes || null
      };

      await createReceipt(payload);

      Swal.fire({
        icon: "success",
        title: "Receipt Created",
        text: "Payment receipt saved to database successfully!",
        timer: 2000,
        showConfirmButton: false
      });

      setShowModal(false);
      setFormData(initialForm);
      await fetchData();
    } catch (err) {
      console.error("Error creating receipt:", err);
      Swal.fire("Error", err?.response?.data?.message || err.message || "Failed to create receipt", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendEmail = async (receipt) => {
    const defaultEmail = receipt.memberEmail || "";
    const { value: email, isConfirmed } = await Swal.fire({
      icon: "question",
      title: "Send Receipt Email",
      html: `
        <div class="text-start">
          <p class="mb-2">Send official payment receipt <strong>${receipt.receiptNumber}</strong> (₹${(Number(receipt.amount) || 0).toLocaleString("en-IN")}) to member:</p>
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
      confirmButtonText: "Send Receipt Email",
      confirmButtonColor: "#16a34a",
      cancelButtonText: "Cancel"
    });

    if (isConfirmed && email) {
      Swal.fire({
        title: "Sending Receipt...",
        text: `Sending email to ${email} (BCC: sudharanib1806@gmail.com)...`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        await sendReceiptEmail(receipt.id, email);
        Swal.fire({
          icon: "success",
          title: "Receipt Sent!",
          text: `Receipt ${receipt.receiptNumber} was successfully dispatched to ${email} (with copy BCCed to sudharanib1806@gmail.com).`
        });
      } catch (err) {
        console.error("Failed to send receipt email:", err);
        Swal.fire({
          icon: "error",
          title: "Failed to Send",
          text: err?.response?.data?.message || err.message || "Failed to dispatch email."
        });
      }
    }
  };

  const totalAmount = receipts.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const cashCount = receipts.filter((r) => (r.paymentMethod || "").toUpperCase() === "CASH").length;
  const onlineCount = receipts.filter((r) =>
    ["RAZORPAY", "PHONEPE", "UPI", "CARD", "BANK_TRANSFER"].includes((r.paymentMethod || "").toUpperCase())
  ).length;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px 20px", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: "#1e293b" }}>
            <IconReceipt size={28} className="text-primary" /> Payment Receipts
          </h2>
          <p className="text-muted small mb-0">
            Real-time transaction vouchers, member fee payments, and verified receipts.
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
            <IconPlus size={16} /> Create Receipt
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Receipts", value: receipts.length, color: "#6366f1" },
          { label: "Total Amount", value: `₹${totalAmount.toLocaleString("en-IN")}`, color: "#10b981" },
          { label: "Cash Receipts", value: cashCount, color: "#f59e0b" },
          { label: "Online / Bank", value: onlineCount, color: "#0ea5e9" }
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
                  placeholder="Search receipt number, member name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="RAZORPAY">Razorpay</option>
                <option value="PHONEPE">PhonePe</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <Button
                variant="primary"
                className="w-100 d-flex align-items-center justify-content-center gap-1"
                onClick={() => setShowModal(true)}
              >
                <IconPlus size={16} /> Create Receipt
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Receipts Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="text-muted small mt-2">Loading live receipts from database...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <IconReceipt size={48} className="text-muted opacity-50 mb-2" />
              <h5 className="fw-bold text-dark">No receipts found</h5>
              <p className="text-muted small mb-3">
                {search || methodFilter !== "ALL"
                  ? "No receipts match the search criteria."
                  : "No payment receipts found in the database. Create the first receipt to begin tracking payments."}
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                <IconPlus size={15} /> Create First Receipt
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light text-uppercase small text-muted">
                  <tr>
                    <th className="ps-4">Receipt #</th>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="ps-4">
                        <span className="fw-bold text-primary font-monospace">
                          {receipt.receiptNumber}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">
                          {receipt.memberName || `Member #${receipt.memberId}`}
                        </div>
                        {receipt.memberEmail && (
                          <small className="text-muted">{receipt.memberEmail}</small>
                        )}
                      </td>
                      <td>
                        <span className="fw-bold text-success fs-6">
                          ₹{(Number(receipt.amount) || 0).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>{getMethodBadge(receipt.paymentMethod)}</td>
                      <td className="small text-muted">{receipt.receiptDate || "—"}</td>
                      <td className="text-end pe-4">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="p-1 px-2 me-1"
                          title="View Receipt Slip"
                          onClick={() => setSelectedReceipt(receipt)}
                        >
                          <IconFileText size={15} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          className="p-1 px-2 me-1"
                          title="Print Receipt"
                          onClick={() => printReceiptDocument(receipt)}
                        >
                          <IconPrinter size={15} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-info"
                          className="p-1 px-2"
                          title="Send Email"
                          onClick={() => handleSendEmail(receipt)}
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

      {/* Create Receipt Modal */}
      <Modal show={showModal} onHide={() => !submitting && setShowModal(false)} centered size="lg">
        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <IconReceipt size={22} className="text-primary" /> Create New Receipt
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateReceipt}>
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
                  <Form.Label className="fw-semibold small">Payment Method</Form.Label>
                  <Form.Select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="CASH">Cash</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="PHONEPE">PhonePe</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card (POS / Machine)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Amount Paid (₹) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Receipt Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.receiptDate}
                    onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Payment Reference / Transaction ID (Optional)</Form.Label>
                  <Form.Control
                    placeholder="e.g. UPI Ref / Razorpay ID / Cash Voucher #"
                    value={formData.paymentReference}
                    onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="fw-semibold small">Notes / Purpose (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="e.g. Membership renewal, Personal Training fee, locker charge..."
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
                  <Spinner animation="border" size="sm" className="me-1" /> Generating Receipt...
                </>
              ) : (
                "Save & Generate Receipt"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View / Print Receipt Slip Modal */}
      {selectedReceipt && (
        <Modal show={true} onHide={() => setSelectedReceipt(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-6 d-flex align-items-center gap-2">
              <IconReceipt size={20} className="text-success" /> Payment Receipt Voucher
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4" id="printable-receipt">
            <div className="text-center pb-3 border-bottom mb-3">
              <h5 className="fw-bold text-dark mb-1">FITNEXA FITNESS</h5>
              <p className="text-muted small mb-1">Official Member Payment Receipt</p>
              <span className="badge bg-light text-primary border font-monospace fs-6">
                {selectedReceipt.receiptNumber}
              </span>
            </div>

            <Table size="sm" borderless className="mb-3">
              <tbody>
                <tr>
                  <td className="text-muted small">Date:</td>
                  <td className="text-end fw-semibold">{selectedReceipt.receiptDate || "—"}</td>
                </tr>
                <tr>
                  <td className="text-muted small">Received From:</td>
                  <td className="text-end fw-bold text-dark">
                    {selectedReceipt.memberName || `Member #${selectedReceipt.memberId}`}
                  </td>
                </tr>
                {selectedReceipt.memberEmail && (
                  <tr>
                    <td className="text-muted small">Email:</td>
                    <td className="text-end text-muted small">{selectedReceipt.memberEmail}</td>
                  </tr>
                )}
                <tr>
                  <td className="text-muted small">Payment Mode:</td>
                  <td className="text-end">{getMethodBadge(selectedReceipt.paymentMethod)}</td>
                </tr>
                {selectedReceipt.paymentReference && (
                  <tr>
                    <td className="text-muted small">Reference UTR:</td>
                    <td className="text-end font-monospace small">{selectedReceipt.paymentReference}</td>
                  </tr>
                )}
                {selectedReceipt.notes && (
                  <tr>
                    <td className="text-muted small">Remarks:</td>
                    <td className="text-end text-muted small">{selectedReceipt.notes}</td>
                  </tr>
                )}
                <tr className="border-top pt-2">
                  <td className="fs-6 fw-bold text-dark pt-2">Amount Paid:</td>
                  <td className="text-end fs-5 fw-bold text-success pt-2">
                    ₹{(Number(selectedReceipt.amount) || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </Table>

            <div className="text-center pt-2 border-top">
              <small className="text-muted d-block">Thank you for your payment!</small>
              <small className="text-muted opacity-75" style={{ fontSize: "11px" }}>This is a computer generated receipt.</small>
            </div>

            <div className="d-flex gap-2 mt-4">
              <Button
                variant="primary"
                className="flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                onClick={() => printReceiptDocument(selectedReceipt)}
              >
                <IconPrinter size={16} /> Print / Save PDF
              </Button>
              <Button
                variant="outline-success"
                className="d-flex align-items-center justify-content-center gap-1"
                onClick={() => handleSendEmail(selectedReceipt)}
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
