import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/apiClient";

// PUBLIC_INTERFACE
export const AuthContext = createContext({
  /** Auth context */
  isAuthenticated: false,
  user: null,
  roles: [],
  token: null,
  login: async (_u, _p) => {},
  logout: async () => {},
  hasRole: (_r) => false,
});

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides auth state and helpers to the app */
  const [token, setToken] = useState(() => localStorage.getItem("mm_token"));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("mm_user");
    return u ? JSON.parse(u) : null;
  });

  const roles = useMemo(() => (user && user.roles) || [], [user]);

  const isAuthenticated = !!token;

  const login = useCallback(async (username, password) => {
    const data = await apiClient.login({ username, password });
    const fakeUser = {
      username,
      roles: username === "admin" ? ["admin", "user"] : ["user"], // For frontend-only demo RBAC
      expiresIn: data.expiresIn,
    };
    localStorage.setItem("mm_token", data.token);
    localStorage.setItem("mm_user", JSON.stringify(fakeUser));
    setToken(data.token);
    setUser(fakeUser);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (e) {
      // ignore network errors for logout
    }
    localStorage.removeItem("mm_token");
    localStorage.removeItem("mm_user");
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback((role) => roles.includes(role), [roles]);

  // Handle unauthorized events dispatched by apiClient
  useEffect(() => {
    const handler = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("mm:unauthorized", handler);
    return () => window.removeEventListener("mm:unauthorized", handler);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      roles,
      token,
      login,
      logout,
      hasRole,
    }),
    [isAuthenticated, user, roles, token, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
