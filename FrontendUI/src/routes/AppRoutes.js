import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../views/LoginPage";
import MappingStudio from "../views/MappingStudio";
import DeviceConnectPage from "../views/DeviceConnectPage";
import VersionControlPage from "../views/VersionControlPage";
import ServiceModelEditor from "../views/ServiceModelEditor";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";

// Compute env flags once
const AUTH_ENABLED =
  typeof process !== "undefined" &&
  process.env &&
  String(process.env.REACT_APP_ENABLE_AUTH || "").toLowerCase() === "true";

/**
 * ProtectedRoute enforces authentication and optional role checks only if
 * REACT_APP_ENABLE_AUTH=true. When disabled, it simply renders children.
 */
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, hasRole } = useContext(AuthContext);

  if (!AUTH_ENABLED) {
    // Auth enforcement disabled by environment; allow access
    return children;
  }

  // Enforce authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Enforce role checks when provided
  if (roles && Array.isArray(roles) && roles.length > 0) {
    const ok = roles.some((r) => hasRole && hasRole(r));
    if (!ok) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

function Unauthorized() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Unauthorized</h2>
      <p>You do not have permission to view this page.</p>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function AppRoutes() {
  /** Defines all routes with auth guards */
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MappingStudio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connect"
          element={
            <ProtectedRoute>
              <DeviceConnectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/versions"
          element={
            <ProtectedRoute roles={["admin", "user"]}>
              <VersionControlPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/service-model"
          element={
            <ProtectedRoute>
              <ServiceModelEditor />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
