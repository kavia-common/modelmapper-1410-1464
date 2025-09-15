import React, { useState } from "react";
import VendorSelector from "../components/VendorSelector";
import { apiClient } from "../services/apiClient";

export default function DeviceConnectPage() {
  const [form, setForm] = useState({
    deviceIp: "",
    vendor: "",
    username: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const connect = async (e) => {
    e.preventDefault();
    setErr("");
    setResult(null);
    setBusy(true);
    try {
      const res = await apiClient.connectDevice({
        deviceIp: form.deviceIp,
        vendor: form.vendor,
        credentials: { username: form.username, password: form.password },
      });
      setResult(res);
    } catch (e) {
      setErr(e.message || "Connection failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Connect Device</h2>
      <form
        onSubmit={connect}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          maxWidth: 900,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Device IP</span>
          <input
            required
            placeholder="10.0.0.1"
            value={form.deviceIp}
            onChange={(e) => setForm((f) => ({ ...f, deviceIp: e.target.value }))}
          />
        </label>
        <VendorSelector
          value={form.vendor}
          onChange={(v) => setForm((f) => ({ ...f, vendor: v }))}
        />
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Username</span>
          <input
            required
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Password</span>
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </label>
        <div />
        <div style={{ display: "flex", alignItems: "end", gap: 12 }}>
          <button type="submit" disabled={busy}>
            {busy ? "Connecting..." : "Connect"}
          </button>
          {err && (
            <div role="alert" style={{ color: "#a94442" }}>
              {err}
            </div>
          )}
        </div>
      </form>

      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Device Status</h3>
          <p>
            Connected: <strong>{result.connected ? "Yes" : "No"}</strong>
          </p>
          {result.message && <p>Message: {result.message}</p>}
          <h4>Retrieved YANG Models</h4>
          <ul>
            {result.yangModels?.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
