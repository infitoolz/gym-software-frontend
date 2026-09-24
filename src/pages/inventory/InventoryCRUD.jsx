import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Button, Modal, Form, Spinner } from "react-bootstrap";
import {
  IconHome,
  IconBox,
  IconPlus,
  IconEdit,
  IconTrash,
  IconAlertTriangle,
  IconRefresh,
  IconBarbell,
  IconBottle,
  IconHeartHandshake,
  IconTool,
  IconQrcode,
  IconPrinter,
  IconCheck,
  IconClock,
  IconTools,
  IconActivity,
  IconSearch,
} from "@tabler/icons-react";
import Swal from "sweetalert2";
import CommonTable from "../../components/CommonTable";
import { getInventory, createInventory, updateInventory, deleteInventory } from "../../api/inventoryApi";
import "./inventory.css";

const STATUS_LABELS = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
  MAINTENANCE: "Under Maintenance",
};

const CATEGORIES = ["Equipment", "Supplements", "Accessories", "Other"];

function getCategoryIcon(cat, size = 16) {
  switch (cat?.toLowerCase()) {
    case "equipment":
      return <IconBarbell size={size} />;
    case "supplements":
      return <IconBottle size={size} />;
    case "accessories":
      return <IconHeartHandshake size={size} />;
    default:
      return <IconTool size={size} />;
  }
}

function getCategoryClass(cat) {
  switch (cat?.toLowerCase()) {
    case "equipment":
      return "inv-cat-tag-equipment";
    case "supplements":
      return "inv-cat-tag-supplements";
    case "accessories":
      return "inv-cat-tag-accessories";
    default:
      return "inv-cat-tag-other";
  }
}

function getStatusPill(status) {
  const norm = String(status || "IN_STOCK").toUpperCase();
  switch (norm) {
    case "IN_STOCK":
      return (
        <span className="inv-status-pill inv-status-instock">
          <span className="inv-pulse-dot" /> In Stock
        </span>
      );
    case "LOW_STOCK":
      return (
        <span className="inv-status-pill inv-status-lowstock">
          <span className="inv-pulse-dot" /> Low Stock
        </span>
      );
    case "OUT_OF_STOCK":
      return (
        <span className="inv-status-pill inv-status-outstock">
          <span className="inv-pulse-dot" /> Out of Stock
        </span>
      );
    case "MAINTENANCE":
      return (
        <span className="inv-status-pill inv-status-maintenance">
          <span className="inv-pulse-dot" /> Under Maintenance
        </span>
      );
    default:
      return <span className="badge bg-secondary">{status}</span>;
  }
}

export default function InventoryCRUD() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category filter tab state
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // QR Modal state
  const [qrItem, setQrItem] = useState(null);

  // Quick Service / Maintenance Modal state
  const [serviceModalItem, setServiceModalItem] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    status: "IN_STOCK",
    lastMaintained: new Date().toISOString().split("T")[0],
    serviceNotes: "",
  });

  // Main Add / Edit Form state
  const [formData, setFormData] = useState({
    itemName: "",
    category: "Equipment",
    quantity: 1,
    status: "IN_STOCK",
    lastMaintained: new Date().toISOString().split("T")[0],
    notes: "",
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

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setSelectedItem(null);
    setFormData({
      itemName: "",
      category: "Equipment",
      quantity: 1,
      status: "IN_STOCK",
      lastMaintained: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName || "",
      category: item.category || "Equipment",
      quantity: item.quantity !== undefined ? item.quantity : 0,
      status: item.status || "IN_STOCK",
      lastMaintained: item.lastMaintained
        ? new Date(item.lastMaintained).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: item.notes || "",
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemName?.trim()) {
      Swal.fire("Warning", "Item Name is required", "warning");
      return;
    }

    try {
      if (selectedItem) {
        await updateInventory(selectedItem.id, formData);
        Swal.fire({
          title: "Updated!",
          text: `"${formData.itemName}" updated successfully`,
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        await createInventory(formData);
        Swal.fire({
          title: "Created!",
          text: `"${formData.itemName}" added to inventory`,
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
        });
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
      title: "Delete Item?",
      text: `Are you sure you want to remove "${item.itemName}" from inventory?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
    });

    if (result.isConfirmed) {
      try {
        await deleteInventory(item.id);
        Swal.fire({
          title: "Deleted!",
          text: `Item removed from inventory`,
          icon: "success",
          timer: 1600,
          showConfirmButton: false,
        });
        loadData();
      } catch (err) {
        Swal.fire("Error", "Failed to delete item", "error");
      }
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => deleteInventory(id)));
      Swal.fire({
        title: "Deleted!",
        text: `${ids.length} inventory items removed`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
      loadData();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete selected items", "error");
    }
  };

  // ── Compute Mobile Floor Scan URL ──────────────────────────────────────
  const getAssetScanUrl = (item) => {
    if (!item) return "";
    const hostIp =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "192.168.10.132"
        : window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    return `${window.location.protocol}//${hostIp}${port}/asset/${item.id}`;
  };

  // ── Dedicated Clean Print for Asset QR Tag Sticker ─────────────────────
  const handlePrintQr = () => {
    if (!qrItem) return;
    const scanUrl = getAssetScanUrl(qrItem);
    const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(scanUrl)}`;

    const printWindow = window.open("", "_blank", "width=480,height=650");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Tag - ${qrItem.itemName}</title>
          <style>
            @page { size: auto; margin: 8mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 24px 12px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
              background: #ffffff;
            }
            .tag-card {
              width: 320px;
              border: 2px dashed #0f172a;
              border-radius: 14px;
              padding: 20px;
              text-align: center;
              background: #ffffff;
            }
            .brand-title {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 1.5px;
              color: #0f172a;
              margin: 0;
              text-transform: uppercase;
            }
            .brand-sub {
              font-size: 10px;
              font-weight: 600;
              color: #64748b;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin-top: 2px;
              padding-bottom: 10px;
              border-bottom: 2px solid #0f172a;
            }
            .sku-pill {
              display: inline-block;
              font-family: monospace;
              font-size: 13px;
              font-weight: 700;
              color: #2563eb;
              background: #eff6ff;
              padding: 3px 10px;
              border-radius: 6px;
              margin: 12px 0 6px;
              border: 1px solid #bfdbfe;
            }
            .item-name {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              margin: 0 0 10px;
              line-height: 1.3;
            }
            .qr-frame {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 12px;
              display: inline-block;
              margin: 6px 0;
            }
            .qr-frame img {
              width: 170px;
              height: 170px;
              display: block;
            }
            .scan-text {
              font-size: 11px;
              color: #64748b;
              margin: 8px 0 12px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              font-size: 11px;
              color: #475569;
            }
          </style>
        </head>
        <body>
          <div class="tag-card">
            <div class="brand-title">FITNEXA GYM</div>
            <div class="brand-sub">Asset Identification Tag</div>
            <div class="sku-pill">AST-${String(qrItem.id).padStart(4, "0")}</div>
            <div class="item-name">${qrItem.itemName}</div>
            <div class="qr-frame">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="scan-text">Scan on gym floor to report issues or inspect</div>
            <div class="meta-row">
              <span>Category: <strong>${qrItem.category}</strong></span>
              <span>Status: <strong>${STATUS_LABELS[qrItem.status] || qrItem.status}</strong></span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Quick Service / Maintenance Logger ─────────────────────────────────
  const handleOpenServiceModal = (item) => {
    setServiceModalItem(item);
    setServiceFormData({
      status: item.status === "MAINTENANCE" ? "IN_STOCK" : "MAINTENANCE",
      lastMaintained: new Date().toISOString().split("T")[0],
      serviceNotes: "",
    });
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceModalItem) return;

    try {
      const updatedNotes = serviceFormData.serviceNotes
        ? `${serviceModalItem.notes ? serviceModalItem.notes + "\n" : ""}[Service Log ${serviceFormData.lastMaintained}]: ${serviceFormData.serviceNotes}`
        : serviceModalItem.notes;

      await updateInventory(serviceModalItem.id, {
        ...serviceModalItem,
        status: serviceFormData.status,
        lastMaintained: serviceFormData.lastMaintained,
        notes: updatedNotes,
      });

      Swal.fire({
        title: "Service Logged!",
        text: `Maintenance record updated for ${serviceModalItem.itemName}`,
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
      });

      setServiceModalItem(null);
      loadData();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update service record", "error");
    }
  };

  // ── Analytics / KPIs ───────────────────────────────────────────────────
  const totalItemsCount = items.length;
  const inStockCount = items.filter((i) => i.status === "IN_STOCK").length;
  const lowStockCount = items.filter((i) => i.status === "LOW_STOCK" || i.quantity <= 2).length;
  const maintenanceCount = items.filter((i) => i.status === "MAINTENANCE").length;

  const operationalHealthPct =
    totalItemsCount > 0 ? Math.round((inStockCount / totalItemsCount) * 100) : 100;

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { ALL: items.length, Equipment: 0, Supplements: 0, Accessories: 0, Other: 0 };
    items.forEach((i) => {
      if (counts[i.category] !== undefined) {
        counts[i.category] += 1;
      } else {
        counts.Other += 1;
      }
    });
    return counts;
  }, [items]);

  // Data passed to CommonTable based on active category pill
  const tableData = useMemo(() => {
    if (selectedCategory === "ALL") return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  // ── CommonTable Column Definitions ─────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        key: "itemName",
        label: "ASSET / ITEM",
        sortable: true,
        render: (val, row) => {
          const skuCode = `AST-${String(row.id || "0").padStart(4, "0")}`;
          return (
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center p-2"
                style={{
                  background: "rgba(15, 23, 42, 0.05)",
                  color: "#0f172a",
                  minWidth: 38,
                  height: 38,
                }}
              >
                {getCategoryIcon(row.category, 20)}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-dark">{val}</span>
                  <span className="inv-asset-tag">{skuCode}</span>
                </div>
                {row.notes && (
                  <div
                    className="text-muted small mt-1 text-truncate"
                    style={{ maxWidth: 280, fontSize: "11px" }}
                    title={row.notes}
                  >
                    {row.notes}
                  </div>
                )}
              </div>
            </div>
          );
        },
        cardRender: (val, row) => (
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold">{val}</span>
            <span className="inv-asset-tag">AST-{String(row.id || "0").padStart(4, "0")}</span>
          </div>
        ),
      },
      {
        key: "category",
        label: "CATEGORY",
        sortable: true,
        render: (val) => (
          <span className={`inv-cat-tag ${getCategoryClass(val)}`}>
            {getCategoryIcon(val, 13)}
            <span>{val || "Other"}</span>
          </span>
        ),
      },
      {
        key: "quantity",
        label: "STOCK QUANTITY",
        sortable: true,
        render: (val, row) => {
          const isDepleted = Number(val) === 0;
          const isLow = Number(val) > 0 && Number(val) <= 2;
          return (
            <div>
              <div className="d-flex align-items-baseline gap-1">
                <span className="fw-bold fs-6">{val}</span>
                <span className="text-muted small">units</span>
              </div>
              {isDepleted ? (
                <span className="text-danger small fw-semibold" style={{ fontSize: "10.5px" }}>
                  Depleted
                </span>
              ) : isLow ? (
                <span className="text-warning small fw-semibold" style={{ fontSize: "10.5px" }}>
                  Restock Soon
                </span>
              ) : (
                <span className="text-success small fw-semibold" style={{ fontSize: "10.5px" }}>
                  Adequate
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "status",
        label: "STATUS",
        sortable: true,
        render: (val) => getStatusPill(val),
      },
      {
        key: "lastMaintained",
        label: "LAST INSPECTION",
        sortable: true,
        render: (val, row) => {
          if (!val) {
            return <span className="text-muted small">Not recorded</span>;
          }
          const dateStr = new Date(val).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const isMaintenance = row.status === "MAINTENANCE";
          return (
            <div>
              <div className="small fw-semibold text-dark d-flex align-items-center gap-1">
                <IconClock size={13} className="text-muted" />
                {dateStr}
              </div>
              {isMaintenance ? (
                <span className="text-danger small" style={{ fontSize: "10px" }}>
                  Needs Service
                </span>
              ) : (
                <span className="text-muted small" style={{ fontSize: "10px" }}>
                  Verified
                </span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <main className="themebody-wrap">
      <div className="theme-body">
        <Container fluid>
          {/* ── Page Header ────────────────────────────────────────────── */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h2 className="mb-1 fw-bold text-dark">Inventory & Asset Management</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/" className="text-decoration-none text-muted">
                      <IconHome size={15} />
                    </Link>
                  </li>
                  <li className="breadcrumb-item active text-primary">Gym Inventory</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                onClick={loadData}
                className="d-flex align-items-center gap-1"
                title="Reload Inventory"
              >
                <IconRefresh size={16} />
              </Button>
              <Button
                variant="primary"
                onClick={handleOpenAdd}
                className="d-flex align-items-center gap-2 shadow-sm"
              >
                <IconPlus size={18} />
                <span>Add Stock Item</span>
              </Button>
            </div>
          </div>

          {/* ── KPI Stats Summary Cards ─────────────────────────────────── */}
          <Row className="mb-4 g-3">
            <Col sm={6} lg={3}>
              <div
                className="inv-stat-card card-primary"
                onClick={() => setSelectedCategory("ALL")}
                title="View All Assets"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="inv-stat-label">Total Assets Listed</div>
                    <div className="inv-stat-value">{totalItemsCount}</div>
                    <div className="inv-stat-sub">
                      <span>Physical gym items</span>
                    </div>
                  </div>
                  <div className="inv-stat-icon-wrap inv-stat-icon-primary">
                    <IconBox size={26} />
                  </div>
                </div>
              </div>
            </Col>

            <Col sm={6} lg={3}>
              <div
                className="inv-stat-card card-success"
                title="Operational Health Score"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="inv-stat-label">Operational Health</div>
                    <div className="inv-stat-value">{operationalHealthPct}%</div>
                    <div className="inv-stat-sub text-success">
                      <IconCheck size={14} />
                      <span>{inStockCount} active items</span>
                    </div>
                  </div>
                  <div className="inv-stat-icon-wrap inv-stat-icon-success">
                    <IconActivity size={26} />
                  </div>
                </div>
              </div>
            </Col>

            <Col sm={6} lg={3}>
              <div
                className="inv-stat-card card-warning"
                onClick={() => setSelectedCategory("ALL")}
                title="Items needing restock"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="inv-stat-label">Low Stock Alerts</div>
                    <div className="inv-stat-value">{lowStockCount}</div>
                    <div className="inv-stat-sub text-warning">
                      <IconAlertTriangle size={14} />
                      <span>Reorder required</span>
                    </div>
                  </div>
                  <div className="inv-stat-icon-wrap inv-stat-icon-warning">
                    <IconAlertTriangle size={26} />
                  </div>
                </div>
              </div>
            </Col>

            <Col sm={6} lg={3}>
              <div
                className="inv-stat-card card-danger"
                onClick={() => setSelectedCategory("ALL")}
                title="Equipment undergoing maintenance"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="inv-stat-label">Under Maintenance</div>
                    <div className="inv-stat-value">{maintenanceCount}</div>
                    <div className="inv-stat-sub text-danger">
                      <IconTools size={14} />
                      <span>Safety repair required</span>
                    </div>
                  </div>
                  <div className="inv-stat-icon-wrap inv-stat-icon-danger">
                    <IconTools size={26} />
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* ── Category Quick Filter Tabs ──────────────────────────────── */}
          <div className="inv-category-bar mb-3">
            <button
              type="button"
              className={`inv-cat-pill ${selectedCategory === "ALL" ? "active" : ""}`}
              onClick={() => setSelectedCategory("ALL")}
            >
              <span>All Categories</span>
              <span className="inv-cat-badge">{categoryCounts.ALL}</span>
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`inv-cat-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {getCategoryIcon(cat, 15)}
                <span>{cat}</span>
                <span className="inv-cat-badge">{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>

          {/* ── CommonTable Integration ─────────────────────────────────── */}
          <CommonTable
            columns={columns}
            data={tableData}
            entityName="inventory item"
            searchPlaceholder="Search asset name, category, notes, or SKU..."
            searchKeys={["itemName", "category", "status", "notes"]}
            loading={loading}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            canEdit={true}
            canDelete={true}
            filterOptions={[
              { label: "All Status", value: "ALL" },
              { label: "In Stock", value: "IN_STOCK" },
              { label: "Low Stock", value: "LOW_STOCK" },
              { label: "Under Maintenance", value: "MAINTENANCE" },
              { label: "Out of Stock", value: "OUT_OF_STOCK" },
            ]}
            customActions={(row) => (
              <div className="d-inline-flex align-items-center gap-1 me-1">
                {/* QR Code Tag Modal Button */}
                <button
                  type="button"
                  className="inv-action-btn inv-action-btn-qr"
                  onClick={() => setQrItem(row)}
                  title="Print Asset QR Tag"
                >
                  <IconQrcode size={15} />
                </button>
                {/* Quick Maintenance / Service Button */}
                <button
                  type="button"
                  className="inv-action-btn inv-action-btn-service"
                  onClick={() => handleOpenServiceModal(row)}
                  title="Log Service / Toggle Maintenance"
                >
                  <IconTools size={15} />
                </button>
              </div>
            )}
          />
        </Container>
      </div>

      {/* ── Modal: Add / Edit Inventory Asset ────────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Form onSubmit={handleFormSubmit}>
          <Modal.Header closeButton className="border-bottom pb-3">
            <Modal.Title className="fw-bold text-dark">
              {selectedItem ? "Edit Inventory Asset" : "Add New Stock Asset"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={7}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark">Item Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="e.g. Olympic Barbell 20kg, Whey Gold 2kg, Cable Machine"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={5}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark">Category *</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark">Stock Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark">Operational Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="IN_STOCK">In Stock (Operational)</option>
                    <option value="LOW_STOCK">Low Stock (Reorder)</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="MAINTENANCE">Under Maintenance (Broken)</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark">Last Inspected / Maintained</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.lastMaintained}
                    onChange={(e) => setFormData({ ...formData, lastMaintained: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark">Notes, Logs & Placement</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter serial numbers, warranty expiry, gym zone (e.g. Cardio Deck Zone 2), technician contacts..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-top pt-3">
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="px-4">
              {selectedItem ? "Save Changes" : "Create Asset"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal: Printable Asset QR Tag ────────────────────────────── */}
      <Modal show={Boolean(qrItem)} onHide={() => setQrItem(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Gym Asset QR Tag</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {qrItem && (() => {
            const scanUrl = getAssetScanUrl(qrItem);
            return (
              <div className="inv-qr-card-preview">
                <div className="inv-qr-tag-header">
                  <div className="inv-qr-gym-brand">FITNEXA GYM</div>
                  <div className="inv-qr-gym-sub">Asset Identification Tag</div>
                </div>

                <div className="inv-qr-item-sku">AST-{String(qrItem.id).padStart(4, "0")}</div>
                <div className="inv-qr-item-title">{qrItem.itemName}</div>

                <div className="inv-qr-image-wrapper">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      scanUrl
                    )}`}
                    alt={`QR Code for ${qrItem.itemName}`}
                  />
                </div>

                <div className="small text-muted mb-2">Scan on gym floor to view status or report issues</div>

                <div
                  className="mt-2 mb-2 p-2 rounded text-center"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div className="text-muted small" style={{ fontSize: "11px" }}>
                    📱 Mobile Scan Web Link:
                  </div>
                  <a
                    href={scanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fw-bold text-primary small text-decoration-none"
                    style={{ fontSize: "11.5px", wordBreak: "break-all" }}
                  >
                    {scanUrl}
                  </a>
                </div>

                <div className="inv-qr-meta-row">
                  <span>Category: <strong>{qrItem.category}</strong></span>
                  <span>Status: <strong>{STATUS_LABELS[qrItem.status] || qrItem.status}</strong></span>
                </div>
              </div>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setQrItem(null)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handlePrintQr}
            className="d-flex align-items-center gap-2"
          >
            <IconPrinter size={16} /> Print Tag Sticker
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal: Quick Maintenance & Service Logger ────────────────── */}
      <Modal
        show={Boolean(serviceModalItem)}
        onHide={() => setServiceModalItem(null)}
        centered
      >
        <Form onSubmit={handleServiceSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold d-flex align-items-center gap-2">
              <IconTools size={20} className="text-primary" />
              <span>Log Maintenance / Service</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {serviceModalItem && (
              <>
                <div className="alert alert-light border d-flex align-items-center justify-content-between mb-3 py-2">
                  <div>
                    <span className="text-muted small">Asset:</span>{" "}
                    <strong>{serviceModalItem.itemName}</strong>
                  </div>
                  <span className="inv-asset-tag">AST-{String(serviceModalItem.id).padStart(4, "0")}</span>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Update Status</Form.Label>
                  <Form.Select
                    value={serviceFormData.status}
                    onChange={(e) =>
                      setServiceFormData({ ...serviceFormData, status: e.target.value })
                    }
                  >
                    <option value="IN_STOCK">In Stock (Fixed / Operational)</option>
                    <option value="MAINTENANCE">Under Maintenance (Out of order)</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Inspection / Service Date</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={serviceFormData.lastMaintained}
                    onChange={(e) =>
                      setServiceFormData({
                        ...serviceFormData,
                        lastMaintained: e.target.value,
                      })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold">Service Log Details</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="e.g. Replaced frayed pulley cable, tightened frame bolts, lubricated treadmill belt..."
                    value={serviceFormData.serviceNotes}
                    onChange={(e) =>
                      setServiceFormData({
                        ...serviceFormData,
                        serviceNotes: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setServiceModalItem(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Service Log
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </main>
  );
}
