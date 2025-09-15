import React, { useMemo, useRef, useState } from "react";

/**
 * A minimal dependency-free drag-and-drop board for mapping a service to YANG models/submodules
 * - Left list: Available YANG models/submodules
 * - Right area: Service mapping target
 * - Real-time validation and feedback
 */

// PUBLIC_INTERFACE
export default function DragDropMapping({
  availableModels = [],
  onMap,
  vendor,
  disabled = false,
}) {
  /** Drag-drop mapping widget */
  const [serviceTarget, setServiceTarget] = useState([]);
  const [filter, setFilter] = useState("");
  const [feedback, setFeedback] = useState(null);
  const dragItemRef = useRef(null);

  const filteredModels = useMemo(() => {
    const f = filter.toLowerCase();
    return availableModels.filter((m) => m.toLowerCase().includes(f));
  }, [availableModels, filter]);

  const validate = (list) => {
    // Simple validation: at least one item, vendor string must exist
    if (!vendor) return { ok: false, message: "Select a vendor first." };
    if (!list || list.length === 0) return { ok: false, message: "Add at least one YANG module or submodule." };
    return { ok: true };
  };

  const onDragStart = (e, item) => {
    if (disabled) return;
    dragItemRef.current = item;
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", item);
  };

  const onDrop = (e) => {
    if (disabled) return;
    e.preventDefault();
    let item = e.dataTransfer.getData("text/plain");
    if (!item && dragItemRef.current) item = dragItemRef.current;
    if (!item) return;
    if (serviceTarget.includes(item)) {
      setFeedback({ type: "warn", message: "Already added." });
      return;
    }
    const newList = [...serviceTarget, item];
    const v = validate(newList);
    setServiceTarget(newList);
    setFeedback(v.ok ? { type: "success", message: "Item added." } : { type: "error", message: v.message });
  };

  const onDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const removeItem = (item) => {
    const newList = serviceTarget.filter((i) => i !== item);
    setServiceTarget(newList);
    const v = validate(newList);
    if (!v.ok) setFeedback({ type: "error", message: v.message });
  };

  const commitMapping = () => {
    const v = validate(serviceTarget);
    if (!v.ok) {
      setFeedback({ type: "error", message: v.message });
      return;
    }
    onMap && onMap(serviceTarget);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: 8,
          padding: 12,
          minHeight: 240,
        }}
        aria-label="Available YANG modules and submodules"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            aria-label="Filter models"
            placeholder="Filter models..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ flex: 1 }}
            disabled={disabled}
          />
        </div>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, maxHeight: 300, overflow: "auto" }}>
          {filteredModels.map((m) => (
            <li
              key={m}
              draggable={!disabled}
              onDragStart={(e) => onDragStart(e, m)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (serviceTarget.includes(m)) return;
                  const newList = [...serviceTarget, m];
                  setServiceTarget(newList);
                }
              }}
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: 6,
                padding: "6px 8px",
                marginBottom: 6,
                cursor: disabled ? "not-allowed" : "grab",
                background: "var(--bg-secondary)",
              }}
              aria-grabbed="false"
            >
              {m}
            </li>
          ))}
          {filteredModels.length === 0 && <li>No models</li>}
        </ul>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="region"
        aria-label="Service mapping target"
        style={{
          border: "2px dashed var(--border-color)",
          borderRadius: 8,
          padding: 12,
          minHeight: 240,
          background: "rgba(0,0,0,0.02)",
        }}
      >
        <strong>Mapping Target</strong>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, minHeight: 120 }}>
          {serviceTarget.map((m) => (
            <li
              key={m}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid var(--border-color)",
                borderRadius: 6,
                padding: "6px 8px",
                marginBottom: 6,
                background: "var(--bg-secondary)",
              }}
            >
              <span>{m}</span>
              <button onClick={() => removeItem(m)} aria-label={`Remove ${m}`}>
                ✕
              </button>
            </li>
          ))}
          {serviceTarget.length === 0 && <li>Drag items here</li>}
        </ul>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => setServiceTarget([])} disabled={disabled}>
            Clear
          </button>
          <button onClick={commitMapping} disabled={disabled}>
            Map Service
          </button>
        </div>

        {feedback && (
          <div
            role="status"
            style={{
              marginTop: 8,
              color:
                feedback.type === "error"
                  ? "#a94442"
                  : feedback.type === "warn"
                  ? "#8a6d3b"
                  : "#3c763d",
            }}
          >
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}
