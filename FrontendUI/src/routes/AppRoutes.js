import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../views/LoginPage";
import MappingStudio from "../views/MappingStudio";
import DeviceConnectPage from "../views/DeviceConnectPage";
import VersionControlPage from "../views/VersionControlPage";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";

// TEST-ONLY: Authentication is disabled below. ProtectedRoute bypasses all checks.
// Do NOT ship this in production.
function ProtectedRoute({ children /*, roles*/ }) {
  // const { isAuthenticated, hasRole } = useContext(AuthContext);
  // Bypass all authentication/role checks for testing:
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
