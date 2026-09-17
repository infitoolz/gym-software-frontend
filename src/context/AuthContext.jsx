import React, { createContext, useContext, useState, useEffect } from "react";
import { setAccessToken, clearTokens } from "../utils/api";
import { buildPermissionMap, getDefaultRolePermissions, normalizeRole } from "../config/pagePermissions";
import { getMyPermissions } from "../api/permissionsApi";

const AuthContext = createContext();
function clearStoredAuth() {
  clearTokens();
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("email");
  localStorage.removeItem("name");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
}

function decodeJwtPayload(token) {
  const encodedPayload = token.split(".")[1];
  if (!encodedPayload) return null;

  const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return JSON.parse(atob(padded));
}

function isJwtUsable(token) {
  if (!token) return false;

  try {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionMap, setPermissionMap] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const email = localStorage.getItem("email");
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");

    if (isJwtUsable(token)) {
      setAccessToken(token);
      setIsAuthenticated(true);
      setUser({ email, name, role, userId });
      setPermissionsLoading(true);
    } else {
      clearStoredAuth();
      setIsAuthenticated(false);
      setUser(null);
      setPermissionMap({});
      setPermissionsLoading(false);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPermissions = async () => {
      // When signed out, the bootstrap effect (on mount) and logout() are the
      // ones that reset permission state. We must NOT flip permissionsLoading
      // here during that window: on a page refresh this effect first runs with
      // a stale isAuthenticated=false, and setting permissionsLoading=false with
      // an empty map would let ProtectedRoute evaluate an authenticated user
      // against zero permissions and wrongly redirect them to /error-page.
      if (!isAuthenticated) {
        return;
      }

      setPermissionsLoading(true);

      try {
        const response = await getMyPermissions();
        if (cancelled) return;

        const permissions = Array.isArray(response?.permissions) ? response.permissions : [];
        setPermissionMap(buildPermissionMap(permissions, user?.role));
      } catch (error) {
        if (cancelled) return;
        setPermissionMap(getDefaultRolePermissions(normalizeRole(user?.role)));
        if (import.meta.env.DEV) {
          console.warn("Falling back to default permissions for role", user?.role, error);
        }
      } finally {
        if (!cancelled) {
          setPermissionsLoading(false);
        }
      }
    };

    loadPermissions();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.email, user?.role]);

  const login = (userData) => {
    const token = userData.token || userData.accessToken || "";

    setUser(userData);
    setIsAuthenticated(true);
    setPermissionsLoading(true);

    setAccessToken(token);

    localStorage.setItem("token", token);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("email", userData.email || "");
    localStorage.setItem("name", userData.name || "");
    localStorage.setItem("role", userData.role || "");
    localStorage.setItem("userId", userData.userId || "");
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);

    clearStoredAuth();
    setPermissionMap({});
    setPermissionsLoading(false);
  };

  const hasPermission = (pageKey, action = "view") => {
    const permission = permissionMap?.[pageKey];
    if (!permission) return false;

    switch (String(action || "view").toLowerCase()) {
      case "create":
        return Boolean(permission.canCreate);
      case "edit":
        return Boolean(permission.canEdit);
      case "delete":
        return Boolean(permission.canDelete);
      default:
        return Boolean(permission.canView);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        permissionsLoading,
        permissionMap,
        hasPermission,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}


