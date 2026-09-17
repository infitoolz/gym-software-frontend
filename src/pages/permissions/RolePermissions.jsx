import React, { useEffect, useState, useCallback, useMemo } from "react";
import { IconDeviceFloppy, IconRefresh, IconShieldLock } from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";
import { APP_PAGES, ROLE_LABELS, ROLE_ORDER, normalizeRole } from "../../config/pagePermissions";
import { getPermissionMatrix, savePermissionMatrix } from "../../api/permissionsApi";

// Helper: convert backend permissions list to a map: pageKey -> { canView, canCreate, canEdit, canDelete }
function buildPermissionMapFromList(permissionsList = []) {
  const map = {};
  permissionsList.forEach(p => {
    map[p.pageKey] = {
      canView: p.canView || false,
      canCreate: p.canCreate || false,
      canEdit: p.canEdit || false,
      canDelete: p.canDelete || false,
    };
  });
  return map;
}

// Helper: convert permission map back to list for saving
function permissionMapToList(permissionMap) {
  return Object.entries(permissionMap).map(([pageKey, perms]) => ({
    pageKey,
    canView: perms.canView,
    canCreate: perms.canCreate,
    canEdit: perms.canEdit,
    canDelete: perms.canDelete,
  }));
}

function normalizePage(page) {
  return {
    ...page,
    key: page.key || page.pageKey,
    path: page.path || page.routePath || "",
    label: page.label || page.pageKey || page.key,
    category: page.category || "Other",
  };
}

// Initial empty draft per role (all false)
function getEmptyDraft() {
  const draft = {};
  ROLE_ORDER.forEach(role => {
    const emptyMap = {};
    APP_PAGES.forEach(page => {
      emptyMap[page.key] = { canView: false, canCreate: false, canEdit: false, canDelete: false };
    });
    draft[role] = emptyMap;
  });
  return draft;
}

export default function RolePermissions() {
  const { hasPermission } = useAuth();
  const [pages, setPages] = useState(APP_PAGES);
  const [draft, setDraft] = useState(getEmptyDraft);
  const [selectedRole, setSelectedRole] = useState(ROLE_ORDER[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getPermissionMatrix();
      const matrixPages = (response?.pages?.length ? response.pages : APP_PAGES).map(normalizePage);
      setPages(matrixPages);
      
      // Build draft from response roles
      const newDraft = getEmptyDraft();
      if (response?.roles && Array.isArray(response.roles)) {
        response.roles.forEach(roleEntry => {
          const role = normalizeRole(roleEntry.role);
          const permMap = buildPermissionMapFromList(roleEntry.permissions);
          if (newDraft[role]) {
            // merge with existing pages (in case a new page was added)
            matrixPages.forEach(page => {
              if (permMap[page.key]) {
                newDraft[role][page.key] = { ...permMap[page.key] };
              }
            });
          }
        });
      }
      setDraft(newDraft);
    } catch (err) {
      setError(err?.message || "Failed to load permission matrix");
      setPages(APP_PAGES);
      setDraft(getEmptyDraft());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  useEffect(() => {
    if (notice || error) {
      const timer = setTimeout(() => {
        setNotice("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notice, error]);

  const togglePermission = (pageKey, field) => {
    setDraft(prev => {
      const roleDraft = prev[selectedRole] || {};
      const current = roleDraft[pageKey];
      if (!current) return prev;

      let nextPermission;
      if (field === "canView") {
        const newCanView = !current.canView;
        nextPermission = {
          canView: newCanView,
          canCreate: newCanView ? current.canCreate : false,
          canEdit: newCanView ? current.canEdit : false,
          canDelete: newCanView ? current.canDelete : false,
        };
      } else {
        const newValue = !current[field];
        nextPermission = {
          ...current,
          canView: newValue ? true : current.canView,
          [field]: newValue,
        };
      }

      return {
        ...prev,
        [selectedRole]: {
          ...roleDraft,
          [pageKey]: nextPermission,
        },
      };
    });
  };

  const setAllForPage = (pageKey, enabled) => {
    setDraft(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [pageKey]: {
          canView: enabled,
          canCreate: enabled,
          canEdit: enabled,
          canDelete: enabled,
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const rolesPayload = ROLE_ORDER.map(role => ({
        role,
        permissions: permissionMapToList(draft[role]),
      }));
      await savePermissionMatrix({ roles: rolesPayload });
      setNotice("Permission matrix saved successfully.");
      await loadMatrix(); // reload to get fresh data
    } catch (err) {
      setError(err?.message || "Failed to save permission matrix");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadMatrix();
  };

  // Authorization check
  if (!hasPermission("role-permissions")) {
    return (
      <div className="content">
        <div className="alert alert-danger">You do not have permission to manage role permissions.</div>
      </div>
    );
  }

  // Group pages by category (assuming page.category exists)
  const groupedPages = useMemo(() => {
    return pages.reduce((acc, page) => {
      const cat = page.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(page);
      return acc;
    }, {});
  }, [pages]);

  const currentPermissions = draft[selectedRole] || {};

  return (
    <div className="page-wrapper role-permissions-page-wrapper">
      <div className="content">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <IconShieldLock size={24} />
              <h4 className="mb-0">Role Permissions</h4>
            </div>
            <p className="text-muted mb-0">Select a role and control which pages it can access.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-outline-secondary" onClick={handleReset} disabled={loading || saving}>
              <IconRefresh size={16} className="me-1" />
              Reset
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading || saving}>
              <IconDeviceFloppy size={16} className="me-1" />
              {saving ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </div>

        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="card p-5 text-center">
            <div className="spinner-border mx-auto mb-3" role="status" />
            <div>Loading permission matrix...</div>
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-header role-permissions-toolbar">
              <div className="role-switcher" aria-label="Select role">
                {ROLE_ORDER.map(role => (
                  <button
                    key={role}
                    type="button"
                    className={`role-switcher-btn ${selectedRole === role ? "active" : ""}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <span>{ROLE_LABELS[role] || role}</span>
                    <small>{Object.values(draft[role] || {}).filter(p => p.canView).length}</small>
                  </button>
                ))}
              </div>
              <div className="role-visible-count">
                {Object.values(currentPermissions).filter(p => p.canView).length} visible pages
              </div>
            </div>
            <div className="card-body">
              {Object.entries(groupedPages).map(([category, categoryPages]) => (
                <div key={`${selectedRole}-${category}`} className="mb-4">
                  <h6 className="mb-2 text-uppercase text-muted">{category}</h6>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th style={{ minWidth: 220 }}>Page</th>
                          <th className="text-center" style={{ width: 90 }}>View</th>
                          <th className="text-center" style={{ width: 90 }}>Create</th>
                          <th className="text-center" style={{ width: 90 }}>Edit</th>
                          <th className="text-center" style={{ width: 90 }}>Delete</th>
                          <th className="text-center" style={{ width: 110 }}>All</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryPages.map(page => {
                          const perm = currentPermissions[page.key] || {
                            canView: false,
                            canCreate: false,
                            canEdit: false,
                            canDelete: false,
                          };
                          const allEnabled = perm.canView && perm.canCreate && perm.canEdit && perm.canDelete;
                          return (
                            <tr key={page.key}>
                              <td>
                                <div className="fw-semibold">{page.label}</div>
                                <small className="text-muted">{page.path}</small>
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={perm.canView}
                                  onChange={() => togglePermission(page.key, "canView")}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={perm.canCreate}
                                  disabled={!perm.canView}
                                  onChange={() => togglePermission(page.key, "canCreate")}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={perm.canEdit}
                                  disabled={!perm.canView}
                                  onChange={() => togglePermission(page.key, "canEdit")}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={perm.canDelete}
                                  disabled={!perm.canView}
                                  onChange={() => togglePermission(page.key, "canDelete")}
                                />
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className={`btn btn-sm ${allEnabled ? "btn-success" : "btn-outline-secondary"}`}
                                  onClick={() => setAllForPage(page.key, !allEnabled)}
                                >
                                  {allEnabled ? "Clear" : "Grant all"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
