import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Spinner } from "react-bootstrap";
import { IconHome, IconBox, IconPlus, IconEdit, IconTrash, IconAlertTriangle, IconSearch, IconRefresh } from "@tabler/icons-react";
import Swal from "sweetalert2";
import { getInventory, createInventory, updateInventory, deleteInventory } from "../../api/inventoryApi";

const STATUS_BADGES = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "danger",
  MAINTENANCE: "secondary"
};

const STATUS_LABELS = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
  MAINTENANCE: "Under Maintenance"
};

export default function InventoryCRUD() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form state
  const [formData, setFormData] = useState({
    itemName: "",
    category: "Equipment",
    quantity: 0,
    status: "IN_STOCK",
    notes: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getInventory();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to retrieve inventory items list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setFormData({
      itemName: "",
      category: "Equipment",
      quantity: 1,
      status: "IN_STOCK",
      notes: ""
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName || "",
      category: item.category || "Equipment",
      quantity: item.quantity || 0,
      status: item.status || "IN_STOCK",
      notes: item.notes || ""
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemName || formData.quantity === "") {
      Swal.fire("Warning", "Item Name and Quantity are required", "warning");
      return;
    }

    try {
      if (selectedItem) {
        await updateInventory(selectedItem.id, formData);
        Swal.fire("Success", "Inventory item updated successfully", "success");
      } else {
        await createInventory(formData);
        Swal.fire("Success", "Inventory item created successfully", "success");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save inventory item", "error");
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Remove Item?",
      text: `Do you want to delete ${item.itemName} from inventory?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete"
    });

    if (result.isConfirmed) {
      try {
        await deleteInventory(item.id);
        Swal.fire("Deleted", "Item has been removed", "success");
        loadData();
      } catch (err) {
        Swal.fire("Error", "Failed to delete item", "error");
      }
    }
  };

  // Filter computations
  const filteredItems = items.filter((i) => {
    const matchesCategory = categoryFilter === "ALL" || i.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || i.status === statusFilter;
    const matchesSearch = i.itemName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const categories = ["Equipment", "Supplements", "Accessories", "Other"];

  // Analytics stats
  const totalItemsCount = items.length;
  const lowStockCount = items.filter(i => i.status === "LOW_STOCK").length;
  const maintenanceCount = items.filter(i => i.status === "MAINTENANCE").length;

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="mb-1">Inventory Management</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                  <li className="breadcrumb-item active">Inventory</li>
                </ol>
              </nav>
            </div>
            <Button variant="primary" onClick={handleOpenAdd} className="d-flex align-items-center gap-1">
              <IconPlus size={18} /> Add Stock Item
            </Button>
          </div>

          {/* Stats Summaries */}
          <Row className="mb-4 g-3">
            <Col sm={6} lg={4}>
              <Card className="bg-light-primary border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between p-4">
                  <div>
                    <h6 className="text-primary mb-1">Total Assets Listed</h6>
                    <h2 className="fw-bold mb-0">{totalItemsCount}</h2>
                  </div>
                  <IconBox size={36} className="text-primary opacity-50" />
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={4}>
              <Card className="bg-light-warning border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between p-4">
                  <div>
                    <h6 className="text-warning mb-1">Low Stock Warning</h6>
                    <h2 className="fw-bold mb-0">{lowStockCount}</h2>
                  </div>
                  <IconAlertTriangle size={36} className="text-warning opacity-50" />
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={4}>
              <Card className="bg-light-secondary border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between p-4">
                  <div>
                    <h6 className="text-secondary mb-1">Under Maintenance</h6>
                    <h2 className="fw-bold mb-0">{maintenanceCount}</h2>
                  </div>
                  <IconAlertTriangle size={36} className="text-secondary opacity-50" />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Table list */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <h5 className="fw-bold mb-0">Assets Directory</h5>
                <div className="d-flex flex-wrap gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Search asset name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: "250px" }}
                  />
                  <Form.Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ width: "150px" }}
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </Form.Select>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: "150px" }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                  </Form.Select>
                  <Button variant="outline-primary" onClick={loadData} title="Refresh Table">
                    <IconRefresh size={16} />
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-5 text-muted small">No inventory matches found.</div>
              ) : (
                <Table responsive hover className="align-middle">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Last Checked</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-semibold">
                          {item.itemName}
                          {item.notes && <div className="text-muted small mt-1" style={{ fontSize: "11px" }}>{item.notes}</div>}
                        </td>
                        <td>{item.category}</td>
                        <td className="fw-bold">{item.quantity} units</td>
                        <td>
                          <Badge bg={STATUS_BADGES[item.status] || "secondary"}>
                            {STATUS_LABELS[item.status] || item.status}
                          </Badge>
                        </td>
                        <td className="small text-muted">
                          {item.lastMaintained ? new Date(item.lastMaintained).toLocaleDateString() : "—"}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              onClick={() => handleOpenEdit(item)}
                              title="Edit item"
                            >
                              <IconEdit size={14} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete(item)}
                              title="Delete item"
                            >
                              <IconTrash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Add / Edit Inventory Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedItem ? "Edit Inventory Asset" : "Add Inventory Asset"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Item Name *</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity *</Form.Label>
              <Form.Control
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="MAINTENANCE">Under Maintenance</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes & Logs</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter maintenance records, supply batch tags..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Close</Button>
            <Button variant="primary" type="submit">Save Stock</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </main>
  );
}
