import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import useTheme from "../hooks/useTheme";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location]);

  return (
    <nav
      aria-label="Main Navigation"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-secondary)",
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-color)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          aria-label="Toggle Menu"
          onClick={() => setOpen((o) => !o)}
          style={{ display: "inline-flex" }}
        >
          ☰
        </button>
        <strong>ModelMapper</strong>
        {isAuthenticated && (
          <div
            style={{
              display: open ? "flex" : "none",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Link to="/">Mapping Studio</Link>
            <Link to="/connect">Connect Device</Link>
            <Link to="/versions">Version Control</Link>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        {!isAuthenticated ? (
          <button onClick={() => navigate("/login")}>Login</button>
        ) : (
          <>
            <span aria-label="Current User">
              {user?.username} ({(user?.roles || []).join(", ")})
            </span>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
