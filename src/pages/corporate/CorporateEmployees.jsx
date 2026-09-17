import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Badge, Button, InputGroup, Form, Spinner } from "react-bootstrap";
import { IconUpload, IconPlus, IconSearch, IconUser, IconDotsVertical } from "@tabler/icons-react";
import { getCorporateEmployees } from "../../api/corporateWellnessApi";
import { useAuth } from "../../context/AuthContext";

export default function CorporateEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();

  useEffect(() => {
    const hrUserId = auth?.userId || auth?.id;
    getCorporateEmployees(hrUserId).then(data => {
      setEmployees(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Manage Employees</h3>
          <p className="text-muted mb-0">View and manage your corporate employees enrolled in the wellness program.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" className="d-flex align-items-center gap-2">
            <IconUpload size={18} /> Bulk Upload CSV
          </Button>
          <Button variant="primary" className="d-flex align-items-center gap-2">
            <IconPlus size={18} /> Add Employee
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <InputGroup style={{ maxWidth: "300px" }}>
              <InputGroup.Text className="bg-light border-end-0"><IconSearch size={18} className="text-muted" /></InputGroup.Text>
              <Form.Control type="search" placeholder="Search employees..." className="bg-light border-start-0" />
            </InputGroup>
            <div className="text-muted small">Showing {employees.length} employees</div>
          </div>

          <Table hover responsive className="align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="py-3">Employee</th>
                <th className="py-3">Department</th>
                <th className="py-3">Membership Status</th>
                <th className="py-3">Last Gym Visit</th>
                <th className="py-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    <Spinner animation="border" size="sm" /> Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No employees found. Invite them to join!
                  </td>
                </tr>
              ) : employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                        <IconUser size={20} />
                      </div>
                      <div>
                        <div className="fw-medium text-dark">{emp.name}</div>
                        <div className="small text-muted">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.dept}</td>
                  <td>
                    <Badge bg={emp.status === "Active" ? "success-subtle" : "secondary-subtle"} text={emp.status === "Active" ? "success" : "secondary"} className="rounded-pill px-3 py-2 border border-opacity-25 border-bottom-0">
                      {emp.status}
                    </Badge>
                  </td>
                  <td className="text-muted">{emp.lastVisit}</td>
                  <td className="text-end">
                    <Button variant="light" size="sm" className="text-muted rounded-circle p-2">
                      <IconDotsVertical size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      </Container>
      </div>
    </main>
  );
}
