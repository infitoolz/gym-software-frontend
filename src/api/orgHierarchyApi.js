  import api from "../utils/api";

// ============ Helpers ============

function unwrapList(response) {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
}

function unwrapOne(response) {
  return response?.data?.data ?? null;
}

// ============ HEAD OFFICE API ============

export async function getAllHeadOffices() {
  try {
    const response = await api.get("/org/head-offices");
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching head offices:", error);
    throw error;
  }
}

export async function createHeadOffice(payload) {
  try {
    const response = await api.post("/org/head-offices", payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error creating head office:", error);
    throw error;
  }
}

export async function updateHeadOffice(id, payload) {
  try {
    const response = await api.put(`/org/head-offices/${id}`, payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error updating head office:", error);
    throw error;
  }
}

export async function deleteHeadOffice(id) {
  try {
    await api.delete(`/org/head-offices/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting head office:", error);
    throw error;
  }
}

// ============ BRANCH API ============

export async function getAllBranches(headOfficeId = null) {
  try {
    const params = headOfficeId ? { headOfficeId } : {};
    const response = await api.get("/org/branches", { params });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching branches:", error);
    throw error;
  }
}

export async function getBranchesByHeadOffice(headOfficeId) {
  try {
    const response = await api.get("/org/branches", { params: { headOfficeId } });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching branches by head office:", error);
    throw error;
  }
}

export async function createBranch(payload) {
  try {
    const response = await api.post("/org/branches", payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error creating branch:", error);
    throw error;
  }
}

export async function updateBranch(id, payload) {
  try {
    const response = await api.put(`/org/branches/${id}`, payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error updating branch:", error);
    throw error;
  }
}

export async function deleteBranch(id) {
  try {
    await api.delete(`/org/branches/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting branch:", error);
    throw error;
  }
}

// ============ DEPARTMENT API ============

export async function getAllDepartments(branchId = null) {
  try {
    const params = branchId ? { branchId } : {};
    const response = await api.get("/org/departments", { params });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
}

export async function getDepartmentsByBranch(branchId) {
  try {
    const response = await api.get("/org/departments", { params: { branchId } });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching departments by branch:", error);
    throw error;
  }
}

export async function createDepartment(payload) {
  try {
    const response = await api.post("/org/departments", payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error creating department:", error);
    throw error;
  }
}

export async function updateDepartment(id, payload) {
  try {
    const response = await api.put(`/org/departments/${id}`, payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error updating department:", error);
    throw error;
  }
}

export async function deleteDepartment(id) {
  try {
    await api.delete(`/org/departments/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting department:", error);
    throw error;
  }
}

// ============ TEAM API ============

export async function getAllTeams(departmentId = null) {
  try {
    const params = departmentId ? { departmentId } : {};
    const response = await api.get("/org/teams", { params });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw error;
  }
}

export async function getTeamsByDepartment(departmentId) {
  try {
    const response = await api.get("/org/teams", { params: { departmentId } });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching teams by department:", error);
    throw error;
  }
}

// Removed invalid endpoint usage: backend does not support branchId param on /org/teams
export async function getTeamsByBranch() {
  throw new Error("getTeamsByBranch is not supported by backend. Use getTeamsByDepartment(departmentId).");
}

export async function createTeam(payload) {
  try {
    const response = await api.post("/org/teams", payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
}

export async function updateTeam(id, payload) {
  try {
    const response = await api.put(`/org/teams/${id}`, payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error updating team:", error);
    throw error;
  }
}

export async function deleteTeam(id) {
  try {
    await api.delete(`/org/teams/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting team:", error);
    throw error;
  }
}

// ============ DESIGNATION API ============

export async function getAllDesignations(departmentId = null) {
  try {
    const params = departmentId ? { departmentId } : {};
    const response = await api.get("/org/designations", { params });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching designations:", error);
    throw error;
  }
}

export async function getDesignationsByDepartment(departmentId) {
  try {
    const response = await api.get("/org/designations", { params: { departmentId } });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching designations by department:", error);
    throw error;
  }
}

export async function createDesignation(payload) {
  try {
    const response = await api.post("/org/designations", payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error creating designation:", error);
    throw error;
  }
}

export async function updateDesignation(id, payload) {
  try {
    const response = await api.put(`/org/designations/${id}`, payload);
    return unwrapOne(response);
  } catch (error) {
    console.error("Error updating designation:", error);
    throw error;
  }
}

export async function deleteDesignation(id) {
  try {
    await api.delete(`/org/designations/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting designation:", error);
    throw error;
  }
}

// ============ CASCADE ENDPOINTS (For Employee Form Dropdowns) ============

export async function getBranchesForEmployee() {
  try {
    const response = await api.get("/org/cascade/branches-for-employee");
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching branches for employee:", error);
    throw error;
  }
}

export async function getDepartmentsForEmployee(branchId) {
  try {
    const response = await api.get("/org/cascade/departments-for-employee", {
      params: { branchId },
    });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching departments for employee:", error);
    throw error;
  }
}

export async function getTeamsForEmployee(departmentId) {
  try {
    const response = await api.get("/org/cascade/teams-for-employee", {
      params: { departmentId },
    });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching teams for employee:", error);
    throw error;
  }
}

export async function getDesignationsForEmployee(departmentId) {
  try {
    const response = await api.get("/org/cascade/designations-for-employee", {
      params: { departmentId },
    });
    return unwrapList(response);
  } catch (error) {
    console.error("Error fetching designations for employee:", error);
    throw error;
  }
}
