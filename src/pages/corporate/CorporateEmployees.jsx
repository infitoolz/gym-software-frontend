import React, { useState, useEffect, useMemo } from "react";
import { Container, Card, Table, Badge, Button, InputGroup, Form, Spinner, Modal } from "react-bootstrap";
import { IconUpload, IconPlus, IconSearch, IconUser } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { getCorporateEmployees, addCorporateEmployee } from "../../api/corporateWellnessApi";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";

export default function CorporateEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "Engineering",
    password: "",
  });

  const { user, auth } = useAuth();
  const currentUser = user || auth;
  const basePath = currentUser?.role === "CORPORATE_HR" ? "/hr-portal" : "/corporate";

  const fetchEmployees = async () => {
    try {
      const hrUserId = currentUser?.userId || currentUser?.id || localStorage.getItem("userId");
      const data = await getCorporateEmployees(hrUserId);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load employees", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentUser]);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter(
      (e) =>
        (e.name && e.name.toLowerCase().includes(term)) ||
        (e.email && e.email.toLowerCase().includes(term)) ||
        (e.department && e.department.toLowerCase().includes(term)) ||
        (e.dept && e.dept.toLowerCase().includes(term))
    );
  }, [employees, searchTerm]);

  const handleOpenAddModal = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "Engineering",
      password: "",
    });
    setShowAddModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email) {
      Swal.fire("Error", "First Name and Email are required", "error");
      return;
    }

    setSaving(true);
    try {
      const hrUserId = currentUser?.userId || currentUser?.id || localStorage.getItem("userId");
      await addCorporateEmployee(formData, hrUserId);
      Swal.fire("Success", "Employee added to corporate wellness program!", "success");
      setShowAddModal(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Failed to add employee", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h3 className="fw-bold mb-1">Manage Employees</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={basePath}>Corporate Wellness</Link></li>
                  <li className="breadcrumb-item active">Employees</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex gap-2">
              <Button variant="primary" className="d-flex align-items-center gap-2 shadow-sm" onClick={handleOpenAddModal}>
                <IconPlus size={18} /> Add Employee
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <InputGroup style={{ maxWidth: "300px" }}>
                  <InputGroup.Text className="bg-light border-end-0">
                    <IconSearch size={18} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="search"
                    placeholder="Search employees or department..."
                    className="bg-light border-start-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                <div className="text-muted small">Showing {filteredEmployees.length} employees</div>
              </div>

              <Table hover responsive className="align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th className="py-3">Employee</th>
                    <th className="py-3">Department</th>
                    <th className="py-3">Membership Status</th>
                    <th className="py-3">Last Gym Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5">
                        <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                        Loading employees...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5 text-muted">
                        No employees found. Click "Add Employee" to register members under this corporate account.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 40, height: 40 }}
                            >
                              <IconUser size={20} />
                            </div>
                            <div>
                              <div className="fw-medium text-dark">{emp.name}</div>
                              <div className="small text-muted">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="border px-2 py-1">
                            {emp.department || emp.dept || "General"}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            bg={emp.status === "Active" ? "success" : "secondary"}
                            className="rounded-pill px-3 py-2"
                          >
                            {emp.status}
                          </Badge>
                        </td>
                        <td className="text-muted">{emp.lastVisit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Add Employee Modal */}
          <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title className="h5 fw-bold">Add Corporate Employee</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSaveEmployee}>
              <Modal.Body className="p-4">
                <div className="row g-3">
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">First Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-12">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Work Email *</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="john.doe@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Department</Form.Label>
                      <Form.Select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Support">Support</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-12">
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Account Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Leave blank for Member@123"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                      <Form.Text className="text-muted small">Default password will be Member@123</Form.Text>
                    </Form.Group>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="border-0 pt-0">
                <Button variant="light" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? <Spinner size="sm" animation="border" /> : "Save Employee"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </Container>
      </div>
    </main>
  );
}
