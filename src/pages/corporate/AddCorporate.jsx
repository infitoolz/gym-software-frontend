import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Table, Badge, Spinner, Modal } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { IconBuildingCommunity, IconEye, IconEyeOff, IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";

export default function AddCorporate() {
  const [corporateList, setCorporateList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({ companyName: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { user } = useAuth();

  const fetchCorporateList = async () => {
    try {
      const requesterId = user?.userId || user?.id;
      if (!requesterId) return;
      const response = await api.get(`/users/corporate-hr?requesterId=${requesterId}`);
      setCorporateList(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch corporate HR list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorporateList();
  }, [user]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setIsViewing(false);
    setCurrentId(null);
    setFormData({ companyName: "", email: "", password: "" });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (hr) => {
    setIsEditing(true);
    setIsViewing(false);
    setCurrentId(hr.id);
    setFormData({ companyName: hr.companyName, email: hr.email, password: "" });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleOpenViewModal = (hr) => {
    setIsEditing(false);
    setIsViewing(true);
    setCurrentId(hr.id);
    setFormData({ companyName: hr.companyName, email: hr.email, password: "••••••••" });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete this Corporate account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel"
    });

    if (confirm.isConfirmed) {
      try {
        const deleterId = user?.userId || user?.id;
        await api.delete(`/users/corporate-hr/${id}?deleterId=${deleterId}`);
        Swal.fire("Deleted!", "Corporate HR Account has been deleted.", "success");
        fetchCorporateList();
      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || "Failed to delete account", "error");
      }
    }
  };

  const handleSaveCorporate = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.email) {
      Swal.fire("Error", "Company Name and Email are required", "error");
      return;
    }
    if (!isEditing && !formData.password) {
      Swal.fire("Error", "Password is required for new accounts", "error");
      return;
    }

    setSaving(true);
    try {
      const creatorId = user?.userId || user?.id;
      if (!creatorId) {
        throw new Error("Could not identify your admin user ID. Please log in again.");
      }

      if (isEditing) {
        const payload = {
            ...formData,
            keepPassword: !formData.password
        };
        // If keepPassword is true, send a dummy password to bypass validation on backend
        if (payload.keepPassword) {
            payload.password = "Dummy@123"; 
        }
        await api.put(`/users/corporate-hr/${currentId}?updaterId=${creatorId}`, payload);
        Swal.fire("Success", "Corporate HR Account updated!", "success");
      } else {
        await api.post(`/users/corporate-hr?creatorId=${creatorId}`, formData);
        Swal.fire("Success", "Corporate HR Account created! They can now log in at /corporate-login", "success");
      }
      
      setShowModal(false);
      fetchCorporateList();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Failed to save account", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Corporate Partners</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to="/corporate">Corporate Wellness</Link></li>
                  <li className="breadcrumb-item active">Manage Partners</li>
                </ol>
              </nav>
            </div>
            <Button variant="primary" onClick={handleOpenAddModal} className="d-flex align-items-center gap-2 shadow-sm">
              <IconPlus size={18} /> Add Corporate
            </Button>
          </div>

          {/* Corporate HR List Table */}
          <Row>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                  ) : corporateList.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3"><IconBuildingCommunity size={48} opacity={0.5} /></div>
                      <h5>No corporate partners yet</h5>
                      <p className="text-muted">Click the button above to add your first partner.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="align-middle mb-0">
                        <thead className="table-light text-muted small text-uppercase">
                          <tr>
                            <th className="ps-4 py-3">Company Name</th>
                            <th className="py-3">HR Email</th>
                            <th className="py-3">Status</th>
                            <th className="py-3">Created On</th>
                            <th className="pe-4 py-3 text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {corporateList.map((hr) => (
                            <tr key={hr.id}>
                              <td className="ps-4 fw-medium text-dark">
                                <div className="d-flex align-items-center gap-2">
                                  <div className="d-flex align-items-center justify-content-center rounded-circle bg-light text-primary" style={{ width: 36, height: 36 }}>
                                    <IconBuildingCommunity size={18} />
                                  </div>
                                  {hr.companyName}
                                </div>
                              </td>
                              <td>{hr.email}</td>
                              <td>
                                <Badge bg={hr.active ? "success-subtle" : "danger-subtle"} text={hr.active ? "success" : "danger"} className="rounded-pill px-3 py-2 border border-opacity-25 border-bottom-0">
                                  {hr.active ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="text-muted small">
                                {new Date(hr.createdAt).toLocaleDateString()}
                              </td>
                              <td className="pe-4 text-end">
                                <div className="d-flex justify-content-end gap-2">
                                  <Button variant="light" size="sm" onClick={() => handleOpenViewModal(hr)} className="text-secondary rounded-circle p-2" title="View Details">
                                    <IconEye size={16} />
                                  </Button>
                                  <Button variant="light" size="sm" onClick={() => handleOpenEditModal(hr)} className="text-primary rounded-circle p-2" title="Edit">
                                    <IconEdit size={16} />
                                  </Button>
                                  <Button variant="light" size="sm" onClick={() => handleDelete(hr.id)} className="text-danger rounded-circle p-2" title="Delete">
                                    <IconTrash size={16} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Add / Edit Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold">
                {isViewing ? "Corporate Partner Details" : isEditing ? "Edit Corporate Partner" : "Add Corporate Partner"}
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSaveCorporate}>
              <Modal.Body className="pt-2">
                <p className="text-muted small mb-4">
                  {isViewing ? "Details for this HR Manager." : isEditing ? "Update details for the HR Manager." : "Create login credentials for the HR Manager."}
                </p>
                
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Company Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. Google India" 
                    value={formData.companyName} 
                    readOnly={isViewing}
                    disabled={isViewing}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })} 
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">HR Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="hr@google.com" 
                    value={formData.email} 
                    readOnly={isViewing}
                    disabled={isViewing}
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">
                    {isViewing ? "Password" : isEditing ? "New Password (leave blank to keep current)" : "Password"}
                  </Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type={showPassword && !isViewing ? "text" : "password"} 
                      placeholder={isEditing ? "Enter new password" : "Enter password"} 
                      value={formData.password} 
                      readOnly={isViewing}
                      disabled={isViewing}
                      onChange={e => setFormData({ ...formData, password: e.target.value })} 
                    />
                    {!isViewing && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ borderLeft: 0, borderColor: '#dee2e6' }}
                      >
                        {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </Button>
                    )}
                  </InputGroup>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer className="border-0">
                <Button variant="light" onClick={() => setShowModal(false)}>{isViewing ? "Close" : "Cancel"}</Button>
                {!isViewing && (
                  <Button variant="primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Account"}
                  </Button>
                )}
              </Modal.Footer>
            </Form>
          </Modal>

        </Container>
      </div>
    </main>
  );
}
