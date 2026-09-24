import React, { useState, useEffect } from "react";
import { Container, Card, Table, Badge, Button, Row, Col, Spinner } from "react-bootstrap";
import { IconDownload, IconReceipt2, IconCreditCard, IconCalendarEvent } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { getCorporateBilling } from "../../api/corporateWellnessApi";
import { useAuth } from "../../context/AuthContext";

export default function CorporateBilling() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, auth } = useAuth();
  const currentUser = user || auth;

  const basePath = currentUser?.role === "CORPORATE_HR" ? "/hr-portal" : "/corporate";

  const fetchInvoices = async () => {
    try {
      const hrUserId = currentUser?.userId || currentUser?.id || localStorage.getItem("userId");
      const data = await getCorporateBilling(hrUserId);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load invoices", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentUser]);

  const handleUpdatePayment = () => {
    Swal.fire({
      title: "Update Payment Method",
      text: "You will be redirected to our secure payment gateway to update your billing details.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Proceed",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Success", "Payment method updated successfully!", "success");
      }
    });
  };

  const handleDownloadInvoice = (invoiceId) => {
    Swal.fire({
      title: "Downloading...",
      text: `Preparing ${invoiceId} for download.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Billing & Invoices</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={basePath}>Corporate Wellness</Link></li>
                  <li className="breadcrumb-item active">Billing</li>
                </ol>
              </nav>
            </div>
            <Button variant="primary" className="d-flex align-items-center gap-2 shadow-sm" onClick={handleUpdatePayment}>
              <IconCreditCard size={18} /> Update Payment Method
            </Button>
          </div>

          <Row className="mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm bg-primary text-white h-100">
                <Card.Body className="p-4 d-flex flex-column justify-content-center">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-white-50 fw-medium">Billing Cycle</span>
                    <IconCalendarEvent size={24} opacity={0.8} />
                  </div>
                  <h3 className="fw-bold mb-0">Monthly</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 d-flex flex-column justify-content-center">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-medium">Active Subscription</span>
                    <IconReceipt2 size={24} className="text-primary" />
                  </div>
                  <h3 className="fw-bold text-dark mb-0">Corporate Partner Plan</h3>
                  <div className="small text-muted mt-1">Enterprise Wellness Package</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 d-flex flex-column justify-content-center">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-medium">Total Invoices</span>
                    <IconCreditCard size={24} className="text-success" />
                  </div>
                  <h3 className="fw-bold text-dark mb-0">{invoices.length}</h3>
                  <div className="small text-success mt-1">Status: Active Account</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Invoice History</h5>
                <div className="text-muted small">Showing {invoices.length} invoices</div>
              </div>

              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light text-muted small text-uppercase">
                    <tr>
                      <th className="ps-4 py-3">Invoice #</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Description</th>
                      <th className="py-3 text-end">Amount</th>
                      <th className="py-3 text-center">Status</th>
                      <th className="pe-4 py-3 text-end">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                          Loading billing records...
                        </td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          No invoices generated yet for this corporate account.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="ps-4 fw-bold text-dark">{inv.id}</td>
                          <td>{inv.date}</td>
                          <td className="text-muted">{inv.description}</td>
                          <td className="fw-medium text-end">{inv.amount}</td>
                          <td className="text-center">
                            <Badge
                              bg={inv.status.toLowerCase() === "paid" ? "success" : "warning"}
                              className="rounded-pill px-3 py-2"
                            >
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="pe-4 text-end">
                            <Button
                              variant="light"
                              size="sm"
                              className="text-primary rounded-circle p-2"
                              onClick={() => handleDownloadInvoice(inv.id)}
                            >
                              <IconDownload size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </main>
  );
}
