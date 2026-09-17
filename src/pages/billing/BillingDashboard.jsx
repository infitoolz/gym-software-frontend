import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Spinner, Nav } from "react-bootstrap";
import {
  IconHome, IconReceipt, IconChecks, IconCreditCard, IconCheck,
  IconTrash, IconRefresh, IconDashboard, IconFileInvoice, IconWallet,
  IconCurrencyRupee, IconBrandCashapp, IconPlug, IconCreditCard as IconRazorpay
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getTransactions } from "../../api/billingApi";
import { getPlanChangeRequests, dismissPlanChangeRequest, assignMembership } from "../../api/membershipApi";

// Import billing sub-components for tab rendering
import InvoicesTab from "./Invoices";
import ReceiptsTab from "./Receipts";
import TrainerPaymentsTab from "./TrainerPayments";
import ExpensesTab from "./Expenses";

export default function BillingDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // ── Dashboard tab state ──────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Timings Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignData, setAssignData] = useState({
    months: 1,
    accessStartTime: "06:00",
    accessEndTime: "10:00"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const txs = await getTransactions();
      setTransactions(Array.isArray(txs) ? txs : []);

      const reqList = await getPlanChangeRequests();
      setRequests(Array.isArray(reqList) ? reqList : []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to retrieve transactions/requests list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard" || activeTab === "payments") loadData();
  }, [activeTab]);

  const handleOpenAssign = (req) => {
    setSelectedRequest(req);
    setAssignData({
      months: 1,
      accessStartTime: "06:00",
      accessEndTime: "10:00"
    });
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await assignMembership(selectedRequest.memberId, {
        planId: selectedRequest.requestedPlanId,
        months: assignData.months,
        accessStartTime: assignData.accessStartTime,
        accessEndTime: assignData.accessEndTime
      });
      Swal.fire("Success", "Plan assigned successfully", "success");
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Failed to assign membership", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = async (reqId) => {
    const result = await Swal.fire({
      title: "Decline Request?",
      text: "Do you want to dismiss this plan change request?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, dismiss"
    });

    if (result.isConfirmed) {
      try {
        await dismissPlanChangeRequest(reqId);
        Swal.fire("Dismissed", "Request has been declined", "success");
        loadData();
      } catch (err) {
        Swal.fire("Error", "Failed to dismiss request", "error");
      }
    }
  };

  // Stats summaries
  const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const totalCount = transactions.length;
  const cashPayments = transactions.filter(t => t.paymentMethod === "CASH").length;
  const onlinePayments = transactions.filter(t => t.paymentMethod === "RAZORPAY").length;

  // ── Tab navigation config ────────────────────────────────────────
  const tabs = [
    { key: "dashboard",    label: "Dashboard",         icon: IconDashboard },
    { key: "invoices",     label: "Invoices",          icon: IconFileInvoice },
    { key: "receipts",     label: "Receipts",          icon: IconReceipt },
    { key: "payments",     label: "Membership Payments", icon: IconCurrencyRupee },
    { key: "trainers",     label: "Trainer Payments",  icon: IconWallet },
    { key: "expenses",     label: "Expenses",          icon: IconBrandCashapp },
    { key: "integrations", label: "Integrations",      icon: IconPlug },
  ];

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="mb-1">Billing Dashboard</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                  <li className="breadcrumb-item active">Billing</li>
                </ol>
              </nav>
            </div>
            {activeTab === "dashboard" && (
              <Button variant="outline-primary" onClick={loadData} className="d-flex align-items-center gap-1">
                <IconRefresh size={16} /> Refresh
              </Button>
            )}
          </div>

          {/* Tab Navigation */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-0">
              <Nav variant="tabs" className="border-bottom-0 px-3 pt-2" activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Nav.Item key={tab.key}>
                      <Nav.Link eventKey={tab.key}
                        className="d-flex align-items-center gap-2 py-3 px-3"
                        style={{
                          fontWeight: activeTab === tab.key ? 700 : 500,
                          color: activeTab === tab.key ? "#667eea" : "#6c757d",
                          borderBottom: activeTab === tab.key ? "2px solid #667eea" : "2px solid transparent",
                          transition: "all 0.2s ease"
                        }}>
                        <Icon size={18} />
                        <span style={{ fontSize: 14 }}>{tab.label}</span>
                      </Nav.Link>
                    </Nav.Item>
                  );
                })}
              </Nav>
            </Card.Body>
          </Card>

          {/* ── Tab Content ──────────────────────────────────────────── */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats Summaries */}
              <Row className="mb-4 g-3">
                <Col sm={6} lg={3}>
                  <Card className="bg-light-success border-0 shadow-sm h-100">
                    <Card.Body className="d-flex align-items-center justify-content-between p-4">
                      <div>
                        <h6 className="text-success mb-1">Total Sales</h6>
                        <h3 className="fw-bold mb-0">₹{totalRevenue.toLocaleString()}</h3>
                      </div>
                      <IconReceipt size={36} className="text-success opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6} lg={3}>
                  <Card className="bg-light-primary border-0 shadow-sm h-100">
                    <Card.Body className="d-flex align-items-center justify-content-between p-4">
                      <div>
                        <h6 className="text-primary mb-1">Total Orders</h6>
                        <h3 className="fw-bold mb-0">{totalCount}</h3>
                      </div>
                      <IconCreditCard size={36} className="text-primary opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6} lg={3}>
                  <Card className="bg-light-warning border-0 shadow-sm h-100">
                    <Card.Body className="d-flex align-items-center justify-content-between p-4">
                      <div>
                        <h6 className="text-warning mb-1">Cash Receipts</h6>
                        <h3 className="fw-bold mb-0">{cashPayments}</h3>
                      </div>
                      <IconChecks size={36} className="text-warning opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm={6} lg={3}>
                  <Card className="bg-light-info border-0 shadow-sm h-100">
                    <Card.Body className="d-flex align-items-center justify-content-between p-4">
                      <div>
                        <h6 className="text-info mb-1">Online Payments</h6>
                        <h3 className="fw-bold mb-0">{onlinePayments}</h3>
                      </div>
                      <IconCreditCard size={36} className="text-info opacity-50" />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Main content grid */}
              <Row className="g-4">
                {/* Upgrade requests */}
                <Col xl={5}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                      <h5 className="fw-bold mb-0">Plan Upgrade Requests</h5>
                      <p className="text-muted small mb-0">Review pending member-submitted upgrade approvals.</p>
                    </Card.Header>
                    <Card.Body>
                      {loading ? (
                        <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
                      ) : requests.length === 0 ? (
                        <div className="text-center py-5 text-muted small">No pending upgrade requests.</div>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {requests.map((req) => (
                            <Card key={req.id} className="border-0 bg-light p-3">
                              <div className="d-flex justify-content-between align-items-start gap-2">
                                <div>
                                  <div className="fw-bold">{req.memberName}</div>
                                  <small className="text-muted">{req.memberEmail}</small>
                                  <div className="mt-2 text-dark small">
                                    Requesting: <Badge bg="primary">{req.requestedPlanName}</Badge> (Currently: {req.currentPlan})
                                  </div>
                                  {req.note && (
                                    <div className="mt-2 bg-white rounded p-2 text-muted small">"{req.note}"</div>
                                  )}
                                  <div className="text-muted small mt-2">{req.requestedAt}</div>
                                </div>
                                <div className="d-flex flex-column gap-2">
                                  <Button
                                    variant="success" size="sm"
                                    className="d-flex align-items-center gap-1 justify-content-center"
                                    onClick={() => handleOpenAssign(req)}>
                                    <IconCheck size={14} /> Assign
                                  </Button>
                                  <Button
                                    variant="outline-danger" size="sm"
                                    className="d-flex align-items-center gap-1 justify-content-center"
                                    onClick={() => handleDismiss(req.id)}>
                                    <IconTrash size={14} /> Dismiss
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Audit log trail */}
                <Col xl={7}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                      <h5 className="fw-bold mb-0">Invoice / Transaction Audit Log</h5>
                      <p className="text-muted small mb-0">Complete logs of sales, cash registers, and Razorpay logs.</p>
                    </Card.Header>
                    <Card.Body>
                      {loading ? (
                        <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
                      ) : transactions.length === 0 ? (
                        <div className="text-center py-5 text-muted small">No transactions recorded yet.</div>
                      ) : (
                        <Table responsive hover className="align-middle small">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Member</th>
                              <th>Plan</th>
                              <th>Amount</th>
                              <th>Method</th>
                              <th>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((tx) => (
                              <tr key={tx.id}>
                                <td>{tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : "—"}</td>
                                <td className="fw-semibold">{tx.member?.name || "Member"}</td>
                                <td>{tx.plan?.name || "Plan"} ({tx.months} mo)</td>
                                <td className="fw-bold text-success">₹{tx.amount}</td>
                                <td>
                                  <Badge bg={tx.paymentMethod === "CASH" ? "warning" : "info"} className="text-uppercase">
                                    {tx.paymentMethod}
                                  </Badge>
                                </td>
                                <td>
                                  {tx.paymentMethod === "RAZORPAY" ? (
                                    <div className="text-muted" style={{ fontSize: "10px" }}>
                                      P_ID: {tx.razorpayPaymentId || "N/A"}<br />
                                      O_ID: {tx.razorpayOrderId || "N/A"}
                                    </div>
                                  ) : (
                                    <span className="text-muted">Cash Register</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {activeTab === "invoices" && <InvoicesTab />}
          {activeTab === "receipts" && <ReceiptsTab />}
          {activeTab === "trainers" && <TrainerPaymentsTab />}
          {activeTab === "expenses" && <ExpensesTab />}

          {activeTab === "payments" && (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-5 text-muted small">No membership payments recorded yet.</div>
                ) : (
                  <>
                    <div className="d-flex flex-wrap gap-3 mb-4">
                      <div className="bg-light-success rounded-3 p-3 flex-fill text-center">
                        <div className="text-success fw-bold fs-4">₹{totalRevenue.toLocaleString()}</div>
                        <div className="text-muted small">Total Membership Revenue</div>
                      </div>
                      <div className="bg-light-primary rounded-3 p-3 flex-fill text-center">
                        <div className="text-primary fw-bold fs-4">{totalCount}</div>
                        <div className="text-muted small">Total Transactions</div>
                      </div>
                      <div className="bg-light-warning rounded-3 p-3 flex-fill text-center">
                        <div className="text-warning fw-bold fs-4">{cashPayments}</div>
                        <div className="text-muted small">Cash Payments</div>
                      </div>
                      <div className="bg-light-info rounded-3 p-3 flex-fill text-center">
                        <div className="text-info fw-bold fs-4">{onlinePayments}</div>
                        <div className="text-muted small">Online Payments</div>
                      </div>
                    </div>
                    <Table responsive hover className="align-middle small">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Member</th>
                          <th>Plan</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id}>
                            <td>{tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : "—"}</td>
                            <td className="fw-semibold">{tx.member?.name || "Member"}</td>
                            <td>{tx.plan?.name || "Plan"} ({tx.months} mo)</td>
                            <td className="fw-bold text-success">₹{tx.amount}</td>
                            <td>
                              <Badge bg={tx.paymentMethod === "CASH" ? "warning" : "info"} className="text-uppercase">
                                {tx.paymentMethod}
                              </Badge>
                            </td>
                            <td><Badge bg="success">Completed</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}
              </Card.Body>
            </Card>
          )}

          {activeTab === "integrations" && (
            <Row className="g-4">
              <Col xs={12}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-0 pt-4">
                    <h5 className="fw-bold mb-0">Payment Gateway Integrations</h5>
                    <p className="text-muted small mb-0">Configure and monitor your payment gateways.</p>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-4">
                      {/* Razorpay */}
                      <Col md={6} lg={3}>
                        <Card className="border-0 shadow-sm h-100 text-center p-4"
                          style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}>
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                            <IconRazorpay size={48} className="text-white mb-3" />
                            <h5 className="text-white fw-bold mb-1">Razorpay</h5>
                            <Badge bg="success" className="mb-2 mt-1 px-3 py-1">● Connected</Badge>
                            <p className="text-white-50 small mb-3">Online payments, UPI, Cards, NetBanking</p>
                            <div className="d-flex gap-2 mt-auto">
                              <Button size="sm" variant="light" className="px-3">Configure</Button>
                              <Button size="sm" variant="outline-light" className="px-3">View Logs</Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* PhonePe */}
                      <Col md={6} lg={3}>
                        <Card className="border-0 shadow-sm h-100 text-center p-4"
                          style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}>
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                            <IconBrandCashapp size={48} className="text-white mb-3" />
                            <h5 className="text-white fw-bold mb-1">PhonePe</h5>
                            <Badge bg="success" className="mb-2 mt-1 px-3 py-1">● Connected</Badge>
                            <p className="text-white-50 small mb-3">UPI-based quick payments via PhonePe</p>
                            <div className="d-flex gap-2 mt-auto">
                              <Button size="sm" variant="light" className="px-3">Configure</Button>
                              <Button size="sm" variant="outline-light" className="px-3">View Logs</Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* UPI */}
                      <Col md={6} lg={3}>
                        <Card className="border-0 shadow-sm h-100 text-center p-4"
                          style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}>
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                            <IconCurrencyRupee size={48} className="text-white mb-3" />
                            <h5 className="text-white fw-bold mb-1">UPI (Direct)</h5>
                            <Badge bg="success" className="mb-2 mt-1 px-3 py-1">● Connected</Badge>
                            <p className="text-white-50 small mb-3">Direct UPI ID payments (G Pay, PhonePe, Paytm)</p>
                            <div className="d-flex gap-2 mt-auto">
                              <Button size="sm" variant="light" className="px-3">Configure</Button>
                              <Button size="sm" variant="outline-light" className="px-3">View Logs</Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Cash */}
                      <Col md={6} lg={3}>
                        <Card className="border-0 shadow-sm h-100 text-center p-4"
                          style={{ background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)" }}>
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                            <IconBrandCashapp size={48} className="text-white mb-3" />
                            <h5 className="text-white fw-bold mb-1">Cash Register</h5>
                            <Badge bg="success" className="mb-2 mt-1 px-3 py-1">● Active</Badge>
                            <p className="text-white-50 small mb-3">Counter cash & cheque payments</p>
                            <div className="d-flex gap-2 mt-auto">
                              <Button size="sm" variant="light" className="px-3">Configure</Button>
                              <Button size="sm" variant="outline-light" className="px-3">View Logs</Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              {/* Integration Summary */}
              <Col xs={12}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-0 pt-4">
                    <h5 className="fw-bold mb-0">Integration Summary</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive className="align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Gateway</th>
                          <th>Status</th>
                          <th>Last Transaction</th>
                          <th>Total Volume</th>
                          <th>Success Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-bold"><IconRazorpay size={18} className="me-2" />Razorpay</td>
                          <td><Badge bg="success">Active</Badge></td>
                          <td className="text-muted small">{new Date().toLocaleDateString()}</td>
                          <td className="fw-bold">₹{(totalRevenue * 0.6).toLocaleString()}</td>
                          <td><span className="text-success fw-bold">98.5%</span></td>
                        </tr>
                        <tr>
                          <td className="fw-bold"><IconBrandCashapp size={18} className="me-2" />PhonePe</td>
                          <td><Badge bg="success">Active</Badge></td>
                          <td className="text-muted small">{new Date().toLocaleDateString()}</td>
                          <td className="fw-bold">₹{(totalRevenue * 0.15).toLocaleString()}</td>
                          <td><span className="text-success fw-bold">97.2%</span></td>
                        </tr>
                        <tr>
                          <td className="fw-bold"><IconCurrencyRupee size={18} className="me-2" />UPI</td>
                          <td><Badge bg="success">Active</Badge></td>
                          <td className="text-muted small">{new Date().toLocaleDateString()}</td>
                          <td className="fw-bold">₹{(totalRevenue * 0.15).toLocaleString()}</td>
                          <td><span className="text-success fw-bold">99.1%</span></td>
                        </tr>
                        <tr>
                          <td className="fw-bold"><IconBrandCashapp size={18} className="me-2" />Cash</td>
                          <td><Badge bg="warning">Manual</Badge></td>
                          <td className="text-muted small">{new Date().toLocaleDateString()}</td>
                          <td className="fw-bold">₹{(totalRevenue * 0.1).toLocaleString()}</td>
                          <td><span className="text-success fw-bold">100%</span></td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>

      {/* Access Timings & Month Assignment Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Form onSubmit={handleAssignSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Assign "{selectedRequest?.requestedPlanName}" to {selectedRequest?.memberName}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Billing Period (Months)</Form.Label>
              <Form.Select
                value={assignData.months}
                onChange={(e) => setAssignData({ ...assignData, months: parseInt(e.target.value) })}
              >
                <option value={1}>1 Month (Monthly)</option>
                <option value={3}>3 Months (Quarterly)</option>
                <option value={12}>12 Months (Yearly)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Daily Check-in Window Start Time</Form.Label>
              <Form.Control
                type="time"
                value={assignData.accessStartTime}
                onChange={(e) => setAssignData({ ...assignData, accessStartTime: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Daily Check-in Window End Time</Form.Label>
              <Form.Control
                type="time"
                value={assignData.accessEndTime}
                onChange={(e) => setAssignData({ ...assignData, accessEndTime: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowAssignModal(false)}>Close</Button>
            <Button variant="success" type="submit" disabled={busy}>
              {busy ? "Assigning..." : "Approve & Activate"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </main>
  );
}
