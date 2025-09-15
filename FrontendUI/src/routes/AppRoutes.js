import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../views/LoginPage";
import MappingStudio from "../views/MappingStudio";
import DeviceConnectPage from "../views/DeviceConnectPage";
import VersionControlPage from "../views/VersionControlPage";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, hasRole } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0 && !roles.some((r) => hasRole(r))) {
    return <Navigate to="/unauthorized" replace />;
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
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
