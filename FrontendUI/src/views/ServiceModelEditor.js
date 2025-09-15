import React, { useEffect, useMemo, useState } from "react";

/**
 * ServiceModelEditor
 * - Allows user to author or import a vendor-agnostic service model in JSON
 * - Validates and pretty-prints JSON
 * - Lists JSON properties and enables mapping each to one or more XML parameter names
 * - Persists to localStorage for demo/testing (no backend required)
 *
 * Backend integration notes:
 * - Replace localStorage reads/writes with API calls to your backend (e.g., GET/POST /api/service-models).
 * - Add endpoints to save service model JSON and mappings.
 * - For schema-level validation, backend can return validation results; see "validateAndFormat" usage.
 */

// Helpers
function safeParseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function getAllJsonPaths(obj, prefix = "") {
  const paths = [];
  if (Array.isArray(obj)) {
    // For arrays, we record the property as the array itself (no index expansion for mapping keys)
    paths.push(prefix);
    // Optionally traverse first item if it's an object; keep it simple here
    if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
      const nested = getAllJsonPaths(obj[0], prefix ? `${prefix}[]` : "[]");
      paths.push(...nested);
    }
  } else if (typeof obj === "object" && obj !== null) {
    if (prefix) paths.push(prefix);
    Object.keys(obj).forEach((key) => {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        paths.push(...getAllJsonPaths(obj[key], newPrefix));
      } else {
        paths.push(newPrefix);
      }
    });
  } else {
    if (prefix) paths.push(prefix);
  }
  // Deduplicate
  return Array.from(new Set(paths.filter(Boolean)));
}

const STORAGE_KEYS = {
  jsonText: "mm_serviceModel_json",
  mappings: "mm_serviceModel_mappings",
};

export default function ServiceModelEditor() {
  const [jsonText, setJsonText] = useState(() => {
    // Load prior JSON from localStorage or start with a sample
    const stored = localStorage.getItem(STORAGE_KEYS.jsonText);
    if (stored) return stored;
    const sample = {
      serviceId: "svc-001",
      description: "L2VPN Service",
      endpoints: [
        {
          id: "ep1",
          device: "router-a",
          interface: "GigabitEthernet0/0/0",
        },
        {
          id: "ep2",
          device: "router-b",
          interface: "GigabitEthernet0/0/1",
        },
      ],
      qos: {
        policy: "gold",
        bandwidthMbps: 1000,
      },
    };
    return JSON.stringify(sample, null, 2);
  });
  const [parseError, setParseError] = useState("");
  const [mappings, setMappings] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.mappings);
    return stored ? JSON.parse(stored) : {};
  });
  const [xmlParamInput, setXmlParamInput] = useState({}); // temp inputs per key

  const parsed = useMemo(() => safeParseJson(jsonText), [jsonText]);
  const jsonPaths = useMemo(() => {
    if (!parsed.ok) return [];
    return getAllJsonPaths(parsed.value);
  }, [parsed]);

  useEffect(() => {
    // Persist JSON
    localStorage.setItem(STORAGE_KEYS.jsonText, jsonText);
  }, [jsonText]);

  useEffect(() => {
    // Persist mappings
    localStorage.setItem(STORAGE_KEYS.mappings, JSON.stringify(mappings));
  }, [mappings]);

  const validateAndFormat = () => {
    const res = safeParseJson(jsonText);
    if (!res.ok) {
      setParseError(res.error || "Invalid JSON");
      return;
    }
    setParseError("");
    setJsonText(JSON.stringify(res.value, null, 2));
  };

  const clearAll = () => {
    if (!window.confirm("Clear JSON and mappings?")) return;
    setJsonText("{}");
    setMappings({});
    setXmlParamInput({});
    setParseError("");
  };

  const handleAddMapping = (path) => {
    const entry = (xmlParamInput[path] || "").trim();
    if (!entry) return;
    const existing = mappings[path] || [];
    const parts = entry.split(",").map((s) => s.trim()).filter(Boolean);
    const newList = Array.from(new Set([...existing, ...parts]));
    setMappings((prev) => ({ ...prev, [path]: newList }));
    setXmlParamInput((prev) => ({ ...prev, [path]: "" }));
  };

  const handleRemoveMapping = (path, value) => {
    const list = mappings[path] || [];
    const newList = list.filter((v) => v !== value);
    setMappings((prev) => {
      const next = { ...prev, [path]: newList };
      if (next[path].length === 0) delete next[path];
      return next;
    });
  };

  const handleImportFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    setJsonText(text);
    // Note: We do not auto-clear mappings on import, but we could:
    // setMappings({});
  };

  const saveToBackend = async () => {
    // BACKEND INTEGRATION PLACEHOLDER:
    // Replace this with a POST to your backend with:
    // { modelJson: parsed.value, mappings }
    // e.g., await apiClient.saveServiceModel({ modelJson: parsed.value, mappings })
    alert("Simulated save: In production, this will POST JSON + mappings to backend.");
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Service Model Editor</h2>

      <section aria-labelledby="json-editor-title" style={{ marginTop: 12 }}>
        <h3 id="json-editor-title">JSON Definition</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <button onClick={validateAndFormat}>Validate & Format</button>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span>Import JSON</span>
            <input
              type="file"
              accept="application/json"
              onChange={(e) => handleImportFile(e.target.files?.[0])}
            />
          </label>
          <button onClick={clearAll} aria-label="Clear JSON and mappings">
            Clear
          </button>
          {!parsed.ok && (
            <span role="alert" style={{ color: "#a94442" }}>
              {parseError || "Invalid JSON"}
            </span>
          )}
        </div>
        <textarea
          aria-label="Service model JSON"
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            // live check (non-blocking)
            const res = safeParseJson(e.target.value);
            setParseError(res.ok ? "" : res.error || "Invalid JSON");
          }}
          style={{
            width: "100%",
            minHeight: 240,
            fontFamily: "monospace",
            fontSize: 13,
            borderColor: parseError ? "#a94442" : "var(--border-color)",
          }}
        />
      </section>

      <section aria-labelledby="mapping-ui-title" style={{ marginTop: 24 }}>
        <h3 id="mapping-ui-title">Map JSON Properties to XML Parameters</h3>
        {!parsed.ok ? (
          <p role="alert" style={{ color: "#a94442" }}>
            Fix JSON errors before mapping.
          </p>
        ) : jsonPaths.length === 0 ? (
          <p>No properties found in JSON.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 12 }}>
              <strong>JSON Properties</strong>
              <ul style={{ listStyle: "none", padding: 0, marginTop: 8, maxHeight: 360, overflow: "auto" }}>
                {jsonPaths.map((p) => (
                  <li
                    key={p}
                    style={{
                      border: "1px solid var(--border-color)",
                      borderRadius: 6,
                      padding: "6px 8px",
                      marginBottom: 6,
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <code style={{ fontSize: 12 }}>{p}</code>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <input
                        placeholder="Add XML param(s), comma-separated"
                        value={xmlParamInput[p] || ""}
                        onChange={(e) =>
                          setXmlParamInput((prev) => ({
                            ...prev,
                            [p]: e.target.value,
                          }))
                        }
                        style={{ flex: 1 }}
                      />
                      <button onClick={() => handleAddMapping(p)}>Add</button>
                    </div>
                    {Array.isArray(mappings[p]) && mappings[p].length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Mapped XML params:</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {mappings[p].map((m) => (
                            <span
                              key={m}
                              style={{
                                border: "1px solid var(--border-color)",
                                borderRadius: 999,
                                padding: "2px 8px",
                                fontSize: 12,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              {m}
                              <button
                                onClick={() => handleRemoveMapping(p, m)}
                                aria-label={`Remove mapping ${m} from ${p}`}
                                title="Remove"
                                style={{
                                  background: "transparent",
                                  color: "inherit",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 12 }}>
              <strong>Summary</strong>
              <p style={{ marginTop: 8 }}>
                Total properties: <b>{jsonPaths.length}</b>
              </p>
              <p>
                Mapped properties: <b>{Object.keys(mappings).length}</b>
              </p>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={saveToBackend}>Save Model + Mappings</button>
                <button
                  onClick={() => {
                    // Export mappings as JSON file
                    const payload = {
                      model: parsed.ok ? parsed.value : {},
                      mappings,
                    };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "service-model-mappings.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export JSON
                </button>
                <button
                  onClick={() => {
                    // Reset mappings only
                    if (!window.confirm("Clear all mappings?")) return;
                    setMappings({});
                    setXmlParamInput({});
                  }}
                >
                  Clear Mappings
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <details>
                  <summary>Preview Payload (for backend)</summary>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      background: "var(--bg-secondary)",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid var(--border-color)",
                      fontSize: 12,
                    }}
                  >
{`{
  "model": ${parsed.ok ? JSON.stringify(parsed.value, null, 2) : "{}"},
  "mappings": ${JSON.stringify(mappings, null, 2)}
}`}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
