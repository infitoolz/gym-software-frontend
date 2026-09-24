import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  IconSearch,
  IconColumns,
  IconFilter,
  IconDownload,
  IconList,
  IconLayoutGrid,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconRefresh,
} from "@tabler/icons-react";
import Swal from "sweetalert2";

export default function CommonTable({
  columns = [],
  data = [],
  entityName = "record",
  searchPlaceholder = "",
  searchKeys = [],
  onEdit,
  onDelete,
  onBulkDelete,
  onExport,
  canEdit = true,
  canDelete = true,
  loading = false,
  customActions,
  filterOptions = [
    { label: "All Status", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ],
  idKey = "id",
  defaultPageSize = 25,
}) {
  // ── States ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("search") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const urlSearch = sp.get("search");
      if (urlSearch !== null && urlSearch !== undefined && urlSearch !== search) {
        setSearch(urlSearch);
      }
    } catch {
      // ignore
    }
  }, []);
  const [viewMode, setViewMode] = useState("list"); // "list" | "cards"
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  // Visibility states
  const [visibleColKeys, setVisibleColKeys] = useState(() => {
    return new Set(columns.filter((c) => c.visibleByDefault !== false).map((c) => c.key));
  });
  const [showColMenu, setShowColMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const colMenuRef = useRef(null);
  const filterMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) {
        setShowColMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Filtering & Searching ───────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let list = [...data];

    // Status filter
    if (selectedFilter !== "ALL") {
      list = list.filter((row) => {
        const rowStatus = String(row?.status || "").toUpperCase();
        return rowStatus === selectedFilter;
      });
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      const keysToScan = searchKeys.length > 0 ? searchKeys : columns.map((c) => c.key);
      list = list.filter((row) => {
        return keysToScan.some((k) => {
          const val = row[k];
          if (val == null) return false;
          if (typeof val === "object") return JSON.stringify(val).toLowerCase().includes(q);
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sorting
    if (sortKey) {
      list.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [data, search, selectedFilter, searchKeys, columns, sortKey, sortDir]);

  // ── Pagination Calculation ──────────────────────────────────────────────────
  const totalEntries = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, validCurrentPage, pageSize]);

  const startIndex = totalEntries === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalEntries);

  // ── Selection Logic ─────────────────────────────────────────────────────────
  const allCurrentPageSelected =
    paginatedData.length > 0 && paginatedData.every((r) => selectedIds.has(r[idKey]));

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      paginatedData.forEach((r) => next.delete(r[idKey]));
    } else {
      paginatedData.forEach((r) => next.add(r[idKey]));
    }
    setSelectedIds(next);
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Column Visibility Toggle ────────────────────────────────────────────────
  const toggleColumnVisibility = (colKey) => {
    const next = new Set(visibleColKeys);
    if (next.has(colKey)) {
      if (next.size > 1) next.delete(colKey); // keep at least 1 column
    } else {
      next.add(colKey);
    }
    setVisibleColKeys(next);
  };

  const activeColumns = useMemo(() => {
    return columns.filter((c) => visibleColKeys.has(c.key));
  }, [columns, visibleColKeys]);

  // ── Sorting Handler ─────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ── Export CSV Handler ──────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const exportRows =
      selectedIds.size > 0
        ? filteredData.filter((r) => selectedIds.has(r[idKey]))
        : filteredData;

    if (onExport) {
      onExport(exportRows);
      return;
    }

    if (exportRows.length === 0) {
      Swal.fire("Export", "No records to export", "info");
      return;
    }

    // Build CSV header and rows
    const headers = activeColumns.map((c) => `"${c.label}"`).join(",");
    const rows = exportRows.map((r) =>
      activeColumns
        .map((c) => {
          let val = r[c.key];
          if (val == null) return '""';
          if (typeof val === "object") val = JSON.stringify(val);
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${entityName.replace(/\s+/g, "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Bulk Delete Handler ─────────────────────────────────────────────────────
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    Swal.fire({
      title: "Delete Selected?",
      text: `Are you sure you want to delete ${count} selected ${entityName}${count > 1 ? "s" : ""}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: `Yes, delete ${count}`,
    }).then((result) => {
      if (result.isConfirmed) {
        const idsArray = Array.from(selectedIds);
        if (onBulkDelete) {
          onBulkDelete(idsArray);
        } else if (onDelete) {
          idsArray.forEach((id) => onDelete({ [idKey]: id }));
        }
        clearSelection();
      }
    });
  };

  return (
    <div className="common-table-card">
      {/* ── Top Control Bar ──────────────────────────────────────────────────── */}
      <div className="ct-topbar">
        {/* Left: Search OR Bulk Selection Bar */}
        <div className="ct-topbar-left">
          {selectedIds.size > 0 ? (
            <div className="ct-bulk-bar">
              <button type="button" className="ct-btn" onClick={handleExportCSV}>
                <IconDownload size={14} /> {selectedIds.size} Export
              </button>
              {canDelete && (onDelete || onBulkDelete) && (
                <button type="button" className="ct-btn ct-btn-delete" onClick={handleBulkDelete}>
                  <IconTrash size={14} /> {selectedIds.size} Delete
                </button>
              )}
              <button type="button" className="ct-btn ct-btn-clear" onClick={clearSelection}>
                <IconX size={14} /> Clear
              </button>
            </div>
          ) : (
            <div className="ct-search-box">
              <IconSearch size={15} className="ct-search-icon" />
              <input
                type="text"
                className="ct-search-input"
                placeholder={searchPlaceholder || `Search ${entityName}...`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>

        {/* Right Tools: Columns, Filter, Export, List/Cards View */}
        <div className="ct-topbar-right">
          {/* Columns Visibility Dropdown */}
          <div style={{ position: "relative" }} ref={colMenuRef}>
            <button
              type="button"
              className="ct-btn"
              onClick={() => setShowColMenu(!showColMenu)}
            >
              <IconColumns size={15} /> Columns ▾
            </button>
            {showColMenu && (
              <div className="ct-dropdown-menu">
                {columns.map((c) => (
                  <label key={c.key} className="ct-dropdown-item">
                    <input
                      type="checkbox"
                      className="ct-checkbox"
                      checked={visibleColKeys.has(c.key)}
                      onChange={() => toggleColumnVisibility(c.key)}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
                <div className="ct-dropdown-divider" />
                <button
                  type="button"
                  className="ct-dropdown-reset-btn"
                  onClick={() => setVisibleColKeys(new Set(columns.map((c) => c.key)))}
                >
                  <IconRefresh size={14} />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div style={{ position: "relative" }} ref={filterMenuRef}>
            <button
              type="button"
              className="ct-btn"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <IconFilter size={15} /> Filter
            </button>
            {showFilterMenu && (
              <div className="ct-dropdown-menu">
                <div className="ct-dropdown-header">Filter by Status</div>
                {filterOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className="ct-dropdown-item"
                    onClick={() => {
                      setSelectedFilter(opt.value);
                      setShowFilterMenu(false);
                      setCurrentPage(1);
                    }}
                  >
                    <span>{opt.label}</span>
                    {selectedFilter === opt.value && <IconCheck size={14} className="ms-auto text-primary" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button type="button" className="ct-btn" onClick={handleExportCSV}>
            <IconDownload size={15} /> Export
          </button>

          {/* View Toggle (List vs Cards) */}
          <div className="ct-view-switch">
            <button
              type="button"
              className={`ct-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="Table List View"
            >
              <IconList size={14} /> List
            </button>
            <button
              type="button"
              className={`ct-view-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Card Grid View"
            >
              <IconLayoutGrid size={14} /> Cards
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content Area: List Table OR Cards View ──────────────────────── */}
      {loading ? (
        <div className="ct-loading-state">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted small">Loading {entityName} data...</p>
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="ct-empty-state">
          <p className="mb-0">No {entityName}s found.</p>
        </div>
      ) : viewMode === "list" ? (
        /* ── List View Table ── */
        <div className="ct-table-responsive">
          <table className="ct-table">
            <thead>
              <tr>
                <th className="ct-col-checkbox">
                  <input
                    type="checkbox"
                    className="ct-checkbox"
                    checked={allCurrentPageSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="ct-col-index">#</th>
                {activeColumns.map((c) => (
                  <th
                    key={c.key}
                    className={c.sortable !== false ? "sortable" : ""}
                    onClick={() => c.sortable !== false && handleSort(c.key)}
                  >
                    {c.label}
                    {c.sortable !== false && (
                      <span className="ct-sort-icon">
                        {sortKey === c.key ? (
                          sortDir === "asc" ? <IconSortAscending size={13} /> : <IconSortDescending size={13} />
                        ) : (
                          <IconArrowsSort size={12} />
                        )}
                      </span>
                    )}
                  </th>
                ))}
                {(canEdit || canDelete || customActions) && (
                  <th className="ct-col-actions">ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => {
                const rowId = row[idKey];
                const isSelected = selectedIds.has(rowId);
                const absoluteIndex = (validCurrentPage - 1) * pageSize + idx + 1;

                return (
                  <tr key={rowId || idx} className={isSelected ? "ct-row-selected" : ""}>
                    <td className="ct-col-checkbox">
                      <input
                        type="checkbox"
                        className="ct-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(rowId)}
                      />
                    </td>
                    <td className="ct-col-index">{absoluteIndex}</td>
                    {activeColumns.map((c) => {
                      const val = row[c.key];
                      return (
                        <td key={c.key}>
                          {c.render ? (
                            c.render(val, row, absoluteIndex)
                          ) : c.key === "status" ? (
                            <span
                              className={`ct-status-badge ${
                                String(val).toUpperCase() === "ACTIVE"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {val || "ACTIVE"}
                            </span>
                          ) : (
                            val != null ? String(val) : "—"
                          )}
                        </td>
                      );
                    })}
                    {(canEdit || canDelete || customActions) && (
                      <td className="ct-col-actions">
                        {customActions && customActions(row)}
                        {canEdit && onEdit && (
                          <button
                            type="button"
                            className="ct-action-btn ct-btn-edit"
                            onClick={() => onEdit(row)}
                            title="Edit"
                          >
                            <IconEdit size={14} />
                          </button>
                        )}
                        {canDelete && onDelete && (
                          <button
                            type="button"
                            className="ct-action-btn ct-btn-delete"
                            onClick={() => onDelete(row)}
                            title="Delete"
                          >
                            <IconTrash size={14} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Cards View Grid ── */
        <div className="ct-cards-grid">
          {paginatedData.map((row, idx) => {
            const rowId = row[idKey];
            const isSelected = selectedIds.has(rowId);
            const absoluteIndex = (validCurrentPage - 1) * pageSize + idx + 1;

            return (
              <div
                key={rowId || idx}
                className={`ct-card-item ${isSelected ? "ct-card-selected" : ""}`}
              >
                <div className="ct-card-header">
                  <div className="ct-card-header-left">
                    <input
                      type="checkbox"
                      className="ct-checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(rowId)}
                    />
                    <span className="ct-card-badge-index">#{absoluteIndex}</span>
                  </div>
                  {row.status && (
                    <span
                      className={`ct-status-badge ${
                        String(row.status).toUpperCase() === "ACTIVE"
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {row.status}
                    </span>
                  )}
                </div>

                <div className="ct-card-body">
                  {activeColumns
                    .filter((c) => c.key !== "status")
                    .map((c) => {
                      const val = row[c.key];
                      const rendered = c.cardRender
                        ? c.cardRender(val, row)
                        : c.render
                        ? c.render(val, row, absoluteIndex)
                        : val != null
                        ? String(val)
                        : "—";

                      return (
                        <div key={c.key} className="ct-card-field">
                          <span className="ct-card-label">{c.label}:</span>
                          <div className="ct-card-value">{rendered}</div>
                        </div>
                      );
                    })}
                </div>

                {(canEdit || canDelete || customActions) && (
                  <div className="ct-card-actions">
                    {customActions && customActions(row)}
                    {canEdit && onEdit && (
                      <button
                        type="button"
                        className="ct-action-btn ct-btn-edit"
                        onClick={() => onEdit(row)}
                        title="Edit"
                      >
                        <IconEdit size={14} />
                      </button>
                    )}
                    {canDelete && onDelete && (
                      <button
                        type="button"
                        className="ct-action-btn ct-btn-delete"
                        onClick={() => onDelete(row)}
                        title="Delete"
                      >
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bottom Pagination Footer ────────────────────────────────────────── */}
      <div className="ct-footer">
        <div className="ct-footer-info">
          Showing {startIndex} to {endIndex} of {totalEntries} entries
        </div>

        <div className="ct-pagination">
          <button
            type="button"
            className="ct-page-btn"
            disabled={validCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <IconChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 5) return true;
              return Math.abs(p - validCurrentPage) <= 2 || p === 1 || p === totalPages;
            })
            .map((p) => (
              <button
                key={p}
                type="button"
                className={`ct-page-btn ${validCurrentPage === p ? "active" : ""}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}

          <button
            type="button"
            className="ct-page-btn"
            disabled={validCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <IconChevronRight size={16} />
          </button>
        </div>

        <div className="ct-page-size">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>
      </div>
    </div>
  );
}
