import React, { useState } from "react";
import { apiClient } from "../services/apiClient";

export default function VersionControlPage() {
  const [deviceId, setDeviceId] = useState("");
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const loadHistory = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await apiClient.getVersionHistory({ deviceId });
      setHistory(res.history || []);
    } catch (e) {
      setMsg(e.message || "Failed to load history");
    } finally {
      setBusy(false);
    }
  };

  const revert = async (version) => {
    setBusy(true);
    setMsg("");
    try {
      await apiClient.versionControlAction({
        deviceId,
        action: "revert",
        targetVersion: version,
      });
      setMsg(`Reverted to version ${version}`);
      await loadHistory();
    } catch (e) {
      setMsg(e.message || "Failed to revert");
      setBusy(false);
    }
  };

  const manage = async () => {
    setBusy(true);
    setMsg("");
    try {
      await apiClient.versionControlAction({
        deviceId,
        action: "manage",
      });
      setMsg("Manage action executed");
      await loadHistory();
    } catch (e) {
      setMsg(e.message || "Failed to manage");
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Version Control</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label>
          Device ID
          <input
            style={{ marginLeft: 6 }}
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="device-123"
          />
        </label>
        <button onClick={loadHistory} disabled={!deviceId || busy}>
          {busy ? "Loading..." : "Load History"}
        </button>
        <button onClick={manage} disabled={!deviceId || busy}>
          Manage
        </button>
      </div>

      {msg && (
        <div role="status" aria-live="polite" aria-atomic="true" style={{ marginTop: 12 }}>
          {msg}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {history.length === 0 ? (
          <p>No history</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid var(--border-color)",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color)", padding: 8 }}>
                  Version
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color)", padding: 8 }}>
                  Timestamp
                </th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color)", padding: 8 }}>
                  User
                </th>
                <th style={{ borderBottom: "1px solid var(--border-color)", padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.version}>
                  <td style={{ padding: 8 }}>{h.version}</td>
                  <td style={{ padding: 8 }}>{h.timestamp}</td>
                  <td style={{ padding: 8 }}>{h.user}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => revert(h.version)} disabled={busy}>
                      Revert
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
