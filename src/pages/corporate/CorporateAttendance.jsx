import React, { useState } from "react";
import { Container, Card, Table, Badge, InputGroup, Form, Button } from "react-bootstrap";
import { IconSearch, IconDownload, IconCalendarEvent } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export default function CorporateAttendance() {
  const [logs] = useState([
    { id: 1, name: "Alice Johnson", date: "2026-06-22", checkIn: "07:30 AM", checkOut: "08:45 AM", duration: "1h 15m", status: "Present" },
    { id: 2, name: "Bob Smith", date: "2026-06-22", checkIn: "08:00 AM", checkOut: "09:30 AM", duration: "1h 30m", status: "Present" },
    { id: 3, name: "Charlie Davis", date: "2026-06-21", checkIn: "18:15 PM", checkOut: "19:45 PM", duration: "1h 30m", status: "Present" },
    { id: 4, name: "Diana Prince", date: "2026-06-21", checkIn: "06:00 AM", checkOut: "07:00 AM", duration: "1h 00m", status: "Present" },
    { id: 5, name: "Evan Wright", date: "2026-06-20", checkIn: "-", checkOut: "-", duration: "-", status: "Absent" },
  ]);

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Attendance Logs</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/hr-portal">Corporate Wellness</Link></li>
              <li className="breadcrumb-item active">Attendance</li>
            </ol>
          </nav>
        </div>
        <Button variant="outline-primary" className="d-flex align-items-center gap-2">
          <IconDownload size={18} /> Export CSV
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <InputGroup style={{ maxWidth: "300px" }}>
              <InputGroup.Text className="bg-light border-end-0"><IconSearch size={18} className="text-muted" /></InputGroup.Text>
              <Form.Control type="search" placeholder="Search employee..." className="bg-light border-start-0" />
            </InputGroup>
            <div className="d-flex align-items-center gap-2">
              <IconCalendarEvent size={20} className="text-muted" />
              <span className="text-muted fw-medium">June 2026</span>
            </div>
          </div>

          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="py-3">Employee Name</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Check In</th>
                  <th className="py-3">Check Out</th>
                  <th className="py-3">Duration</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="fw-medium text-dark">{log.name}</td>
                    <td>{log.date}</td>
                    <td>{log.checkIn}</td>
                    <td>{log.checkOut}</td>
                    <td>{log.duration}</td>
                    <td>
                      <Badge bg={log.status === "Present" ? "success-subtle" : "danger-subtle"} 
                             text={log.status === "Present" ? "success" : "danger"} 
                             className="rounded-pill px-3 py-2 border border-opacity-25 border-bottom-0">
                        {log.status}
                      </Badge>
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
