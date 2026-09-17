import React, { useState } from "react";
import { Container, Card, Table, Badge, Button, Row, Col } from "react-bootstrap";
import { IconDownload, IconReceipt2, IconCreditCard, IconCalendarEvent } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

export default function CorporateBilling() {
  const [invoices] = useState([
    { id: "INV-2026-005", date: "2026-06-01", description: "Corporate Wellness Subscription - June 2026", amount: "$2,500.00", status: "Paid" },
    { id: "INV-2026-004", date: "2026-05-01", description: "Corporate Wellness Subscription - May 2026", amount: "$2,500.00", status: "Paid" },
    { id: "INV-2026-003", date: "2026-04-01", description: "Corporate Wellness Subscription - Apr 2026", amount: "$2,350.00", status: "Paid" },
    { id: "INV-2026-002", date: "2026-03-01", description: "Corporate Wellness Subscription - Mar 2026", amount: "$2,350.00", status: "Paid" },
    { id: "INV-2026-001", date: "2026-02-01", description: "Corporate Wellness Subscription - Feb 2026 (Pro-rated)", amount: "$1,850.00", status: "Paid" },
  ]);

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
              <li className="breadcrumb-item"><Link to="/hr-portal">Corporate Wellness</Link></li>
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
                <span className="text-white-50 fw-medium">Next Billing Date</span>
                <IconCalendarEvent size={24} opacity={0.8} />
              </div>
              <h3 className="fw-bold mb-0">July 1, 2026</h3>
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
              <h3 className="fw-bold text-dark mb-0">Enterprise Wellness</h3>
              <div className="small text-muted mt-1">Billed monthly</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted fw-medium">Amount Due</span>
                <IconCreditCard size={24} className="text-success" />
              </div>
              <h3 className="fw-bold text-dark mb-0">$0.00</h3>
              <div className="small text-success mt-1">All invoices paid</div>
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
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="ps-4 fw-bold text-dark">{inv.id}</td>
                    <td>{inv.date}</td>
                    <td className="text-muted">{inv.description}</td>
                    <td className="fw-medium text-end">{inv.amount}</td>
                    <td className="text-center">
                      <Badge bg={inv.status === "Paid" ? "success-subtle" : "warning-subtle"} 
                             text={inv.status === "Paid" ? "success" : "warning"} 
                             className="rounded-pill px-3 py-2 border border-opacity-25 border-bottom-0">
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="pe-4 text-end">
                      <Button variant="light" size="sm" className="text-primary rounded-circle p-2" onClick={() => handleDownloadInvoice(inv.id)}>
                        <IconDownload size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
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
