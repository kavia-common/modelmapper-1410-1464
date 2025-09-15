import React, { useMemo, useState } from "react";
import VendorSelector from "../components/VendorSelector";
import DragDropMapping from "../components/DragDropMapping";
import { apiClient } from "../services/apiClient";

const DEMO_MODELS = {
  Cisco: ["cisco-ietf-interfaces", "cisco-ios-xr", "cisco-qos", "cisco-routing.submodule"],
  Huawei: ["huawei-ethernet", "huawei-bgp", "huawei-mpls.submodule", "huawei-acl"],
  Nokia: ["nokia-sros", "nokia-policy", "nokia-isis.submodule", "nokia-qos"],
};

export default function MappingStudio() {
  const [vendor, setVendor] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const availableModels = useMemo(() => (vendor ? DEMO_MODELS[vendor] || [] : []), [vendor]);

  const handleMap = async (selectedList) => {
    if (!serviceId) {
      setStatus({ type: "error", message: "Provide a Service ID." });
      return;
    }
    const yangModel = selectedList.join(",");
    setBusy(true);
    setStatus(null);
    try {
      const res = await apiClient.mapService({ serviceId, vendor, yangModel });
      setStatus({
        type: "success",
        message: `Mapping created (simulated). ID: ${res.mappingId}, status: ${res.status}`,
      });
    } catch (e) {
      setStatus({ type: "error", message: e.message || "Mapping failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Mapping Studio</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <VendorSelector value={vendor} onChange={setVendor} />
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Service ID</span>
          <input
            aria-label="Service ID"
            placeholder="Enter Service ID"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          />
        </label>
      </div>

      <DragDropMapping
        vendor={vendor}
        availableModels={availableModels}
        onMap={handleMap}
        disabled={busy}
      />

      {status && (
        <div
          role="status"
          style={{
            marginTop: 16,
            color:
              status.type === "error"
                ? "#a94442"
                : status.type === "success"
                ? "#3c763d"
                : "#333",
          }}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
