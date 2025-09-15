import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/apiClient";
import { renderXmlPreview } from "../utils/xmlPreview";

/**
 * ServiceModelEditor
 * - Allows user to author or import a vendor-agnostic service model in JSON
 * - Validates and pretty-prints JSON
 * - Lists JSON properties and enables mapping each to one or more XML parameter names
 * - NEW: Per-path Jinja/Nunjucks template textarea with docs/tooltips
 *   Allowed syntax: {{ ... }}, {% if ... %}...{% endif %}, {% for ... %}...{% endfor %}
 *   Context per template: { value, model }
 *   - value is resolved by dotted path; tokens ending with [] yield arrays, which you should loop over.
 *   - The XML Preview concatenates outputs from all paths that provide a non-empty template.
 *   - Legacy array-only mappings (xmlParams) are preserved but not rendered in the preview.
 * - Persists to backend via REST API (mocks available in test/demo)
 *
 * Backend integration details:
 * - GET /api/service-models/:id -> fetch service model by ID
 * - POST /api/service-models -> create new model { model, mappings }
 * - PUT /api/service-models/:id -> update model { model, mappings }
 * - DELETE /api/service-models/:id -> delete model by ID
 * Environment:
 * - Base URL is REACT_APP_API_BASE_URL; in demo mode, fetch is mocked.
 */

// Helpers
function safeParseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Enumerate all JSON property paths.
 * Object: a.b.c
 * Array:  a[].b   (we fold arrays using [] to indicate repetition)
 */
function getAllJsonPaths(obj, prefix = "") {
  const paths = [];
  if (Array.isArray(obj)) {
    if (prefix) paths.push(prefix);
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
  return Array.from(new Set(paths.filter(Boolean)));
}

const SAMPLE_MODEL = {
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

export default function ServiceModelEditor() {
  const [modelId, setModelId] = useState("svc-001");
  const [jsonText, setJsonText] = useState(JSON.stringify(SAMPLE_MODEL, null, 2));
  const [parseError, setParseError] = useState("");
  // mappings supports legacy arrays and advanced objects with { xmlParams?:[], template?:string }
  const [mappings, setMappings] = useState({});
  const [xmlParamInput, setXmlParamInput] = useState({}); // temp inputs per key
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  // Derive a normalized view to show both xml params and template seamlessly
  const getXmlParamsFor = (path) => {
    const m = mappings[path];
    if (!m) return [];
    if (Array.isArray(m)) return m;
    if (m && Array.isArray(m.xmlParams)) return m.xmlParams;
    return [];
  };
  const getTemplateFor = (path) => {
    const m = mappings[path];
    if (!m || Array.isArray(m)) return "";
    return m.template || "";
  };

  const setXmlParamsFor = (path, newParams) => {
    setMappings((prev) => {
      const current = prev[path];
      if (Array.isArray(current)) {
        // upgrade to object form
        return { ...prev, [path]: { xmlParams: newParams } };
      }
      const nextValue = { ...(current || {}), xmlParams: newParams };
      // cleanup if both empty
      if ((!nextValue.xmlParams || nextValue.xmlParams.length === 0) && !nextValue.template) {
        const cp = { ...prev };
        delete cp[path];
        return cp;
      }
      return { ...prev, [path]: nextValue };
    });
  };

  const setTemplateFor = (path, tmpl) => {
    setMappings((prev) => {
      const current = prev[path];
      if (Array.isArray(current)) {
        // upgrade to object form, keep array as xmlParams alongside template
        return { ...prev, [path]: { xmlParams: current, template: tmpl } };
      }
      const nextValue = { ...(current || {}), template: tmpl };
      // cleanup if both empty
      if ((!nextValue.xmlParams || nextValue.xmlParams.length === 0) && !nextValue.template) {
        const cp = { ...prev };
        delete cp[path];
        return cp;
      }
      return { ...prev, [path]: nextValue };
    });
  };

  const parsed = useMemo(() => safeParseJson(jsonText), [jsonText]);
  const jsonPaths = useMemo(() => {
    if (!parsed.ok) return [];
    return getAllJsonPaths(parsed.value);
  }, [parsed]);

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

  const loadFromBackend = async () => {
    if (!modelId) {
      setStatus("Please enter a Model ID to load.");
      return;
    }
    setBusy(true);
    setStatus("Loading model...");
    try {
      const res = await apiClient.getServiceModel(modelId);
      // Only update local editor state after a successful fetch to avoid partial overwrites
      const newModel = res && typeof res.model === "object" ? res.model : {};
      const newMappings = res && typeof res.mappings === "object" ? res.mappings : {};
      setJsonText(JSON.stringify(newModel, null, 2));
      setMappings(newMappings);
      setStatus(`Loaded model ${res.id}`);
    } catch (e) {
      // Keep current editor content as-is on failure
      setStatus(e.status === 404 ? "Model not found" : e.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  };

  // Validate mapping object shape and template syntax (basic)
  const validateMappings = (mappingsObj) => {
    const errors = [];
    if (!mappingsObj || typeof mappingsObj !== "object") return ["Mappings must be an object."];
    const pathRegex = /^[A-Za-z0-9_\-$]+(\[\])?(?:\.[A-Za-z0-9_\-$]+(\[\])?)*$/;
    for (const [path, entry] of Object.entries(mappingsObj)) {
      if (!pathRegex.test(path)) {
        errors.push(`Invalid path syntax: ${path}`);
      }
      // normalize to object form for validation but do not mutate state here
      const normalized = Array.isArray(entry) ? { xmlParams: entry } : (entry || {});
      if (normalized.xmlParams && !Array.isArray(normalized.xmlParams)) {
        errors.push(`xmlParams for "${path}" must be an array if provided`);
      }
      const tmpl = typeof normalized.template === "string" ? normalized.template : "";
      // quick unbalanced braces/brackets check for the template to catch trivial mistakes
      if (tmpl) {
        const openTagCount = (tmpl.match(/{%/g) || []).length;
        const closeTagCount = (tmpl.match(/%}/g) || []).length;
        const openExprCount = (tmpl.match(/{{/g) || []).length;
        const closeExprCount = (tmpl.match(/}}/g) || []).length;
        if (openTagCount !== closeTagCount) {
          errors.push(`Template tag count mismatch in path "${path}" ({%/%})`);
        }
        if (openExprCount !== closeExprCount) {
          errors.push(`Template expression count mismatch in path "${path}" ({{/}})`);
        }
      }
    }
    return errors;
  };

  const saveToBackend = async () => {
    if (!parsed.ok) {
      setStatus("Fix JSON errors before saving.");
      return;
    }

    // Validate mappings
    const mapErrors = validateMappings(mappings);
    if (mapErrors.length > 0) {
      setStatus(`Fix mapping errors before saving:\n- ${mapErrors.join("\n- ")}`);
      return;
    }

    setBusy(true);
    setStatus(modelId ? "Saving (update)..." : "Saving (create)...");
    try {
      const payload = { model: parsed.value, mappings };
      const res = await apiClient.saveServiceModel({ id: modelId || undefined, ...payload });
      if (!modelId) setModelId(res.id);
      setStatus(`Saved model ${res.id} at ${res.updatedAt}`);
    } catch (e) {
      // Do not overwrite current editor state on failure; show error only
      setStatus(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteFromBackend = async () => {
    if (!modelId) {
      setStatus("Enter a Model ID to delete.");
      return;
    }
    if (!window.confirm(`Delete model ${modelId}?`)) return;
    setBusy(true);
    setStatus("Deleting...");
    try {
      await apiClient.deleteServiceModel(modelId);
      setStatus(`Deleted model ${modelId}`);
      setJsonText(JSON.stringify(SAMPLE_MODEL, null, 2));
      setMappings({});
      setXmlParamInput({});
    } catch (e) {
      setStatus(e.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const handleAddMapping = (path) => {
    const entry = (xmlParamInput[path] || "").trim();
    if (!entry) return;
    const existing = getXmlParamsFor(path);
    const parts = entry.split(",").map((s) => s.trim()).filter(Boolean);
    const newList = Array.from(new Set([...existing, ...parts]));
    setXmlParamsFor(path, newList);
    setXmlParamInput((prev) => ({ ...prev, [path]: "" }));
  };

  const handleRemoveMapping = (path, value) => {
    const list = getXmlParamsFor(path);
    const newList = list.filter((v) => v !== value);
    setXmlParamsFor(path, newList);
  };

  const handleImportFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    setJsonText(text);
  };

  const hintBox = (
    <details style={{ marginTop: 8 }}>
      <summary>Jinja/Nunjucks Template Help</summary>
      <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
        <p>
          Use Jinja/Nunjucks syntax to transform this JSON value into XML fragments or strings.
          The current JSON value is available as <code>value</code>, and the full model as{" "}
          <code>model</code>.
        </p>
        <ul>
          <li>
            Output: Use{" "}
            <code>{String.raw`{{ value }}`}</code> to print.
          </li>
          <li>
            Conditionals:{" "}
            <code>{String.raw`{% if value %}...{% endif %}`}</code>
          </li>
          <li>
            Loops (arrays):{" "}
            <code>{String.raw`{% for item in value %}...{% endfor %}`}</code>
          </li>
          <li>
            Example (simple XML):
            <pre style={{ whiteSpace: "pre-wrap", background: "var(--bg-secondary)", padding: 8, borderRadius: 6 }}>
              {String.raw`<param name="device">{{ value }}</param>`}
            </pre>
          </li>
          <li>
            Example (array to XML list):
            <pre style={{ whiteSpace: "pre-wrap", background: "var(--bg-secondary)", padding: 8, borderRadius: 6 }}>
              {String.raw`{% for ep in value %}<endpoint id="{{ ep.id }}"><if>{{ ep.interface }}</if></endpoint>{% endfor %}`}
            </pre>
          </li>
        </ul>
      </div>
    </details>
  );

  // Live XML preview derived state
  const preview = useMemo(() => {
    if (!parsed.ok) {
      return { xml: "", errors: [{ path: "*", message: parseError || "Invalid JSON" }] };
    }
    try {
      return renderXmlPreview({ model: parsed.value, mappings });
    } catch (e) {
      return { xml: "", errors: [{ path: "*", message: e?.message || String(e) }] };
    }
  }, [parsed, mappings, parseError]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Service Model Editor</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, marginBottom: 8 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Model ID</span>
          <input
            placeholder="e.g., svc-001"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          />
        </label>
        <button onClick={loadFromBackend} disabled={busy || !modelId}>
          {busy ? "Loading..." : "Load"}
        </button>
        <button onClick={saveToBackend} disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
        <button onClick={deleteFromBackend} disabled={busy || !modelId}>
          {busy ? "Deleting..." : "Delete"}
        </button>
        {status && (
          <div role="status" aria-live="polite" style={{ marginLeft: 8 }}>
            {status}
          </div>
        )}
      </div>

      <section aria-labelledby="json-editor-title" style={{ marginTop: 12 }}>
        <h3 id="json-editor-title">JSON Definition</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <button onClick={validateAndFormat} disabled={busy}>Validate & Format</button>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span>Import JSON</span>
            <input
              type="file"
              accept="application/json"
              onChange={(e) => handleImportFile(e.target.files?.[0])}
            />
          </label>
          <button onClick={clearAll} aria-label="Clear JSON and mappings" disabled={busy}>
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
        <h3 id="mapping-ui-title">Map JSON Properties to XML Parameters and Templates</h3>
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
              <p style={{ marginTop: 6, fontSize: 12 }}>
                For each path, optionally add XML parameter names (legacy) and/or a Jinja/Nunjucks template.
              </p>
              <ul style={{ listStyle: "none", padding: 0, marginTop: 8, maxHeight: 420, overflow: "auto" }}>
                {jsonPaths.map((p) => {
                  const params = getXmlParamsFor(p);
                  const tmpl = getTemplateFor(p);
                  return (
                    <li
                      key={p}
                      style={{
                        border: "1px solid var(--border-color)",
                        borderRadius: 6,
                        padding: "8px 10px",
                        marginBottom: 8,
                        background: "var(--bg-secondary)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                        <code style={{ fontSize: 12 }}>{p}</code>
                        <span title="Path in the JSON model">
                          ℹ️
                        </span>
                      </div>

                      {/* XML Params (legacy) */}
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
                          aria-label={`XML Params input for ${p}`}
                          title="Enter comma-separated XML parameter names for this path"
                        />
                        <button onClick={() => handleAddMapping(p)} title="Add XML params">Add</button>
                      </div>
                      {Array.isArray(params) && params.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 12, marginBottom: 4 }}>Mapped XML params:</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {params.map((m) => (
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

                      {/* Jinja/Nunjucks Template Editor */}
                      <div style={{ marginTop: 10 }}>
                        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>Template (Jinja/Nunjucks)</span>
                          <span
                            title="Use {{ value }} to print this path's current value. You can also reference the full model via 'model'."
                            aria-label="Template help tooltip"
                            style={{ cursor: "help" }}
                          >
                            ❔
                          </span>
                        </label>
                        <textarea
                          value={tmpl}
                          onChange={(e) => setTemplateFor(p, e.target.value)}
                          placeholder='Example: <param name="device">{{ value }}</param>'
                          aria-label={`Template for ${p}`}
                          style={{
                            width: "100%",
                            minHeight: 80,
                            fontFamily: "monospace",
                            fontSize: 12,
                            marginTop: 6,
                            border: "1px solid var(--border-color)",
                            borderRadius: 6,
                            background: "var(--bg-primary)",
                            color: "var(--text-primary)",
                          }}
                        />
                        {hintBox}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 12 }}>
                <strong>Summary</strong>
                <p style={{ marginTop: 8 }}>
                  Total properties: <b>{jsonPaths.length}</b>
                </p>
                <p>
                  Mapped properties: <b>{Object.keys(mappings).length}</b>
                </p>
                {(() => {
                  const errs = validateMappings(mappings);
                  return errs.length > 0 ? (
                    <div role="alert" style={{ color: "#a94442", marginTop: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Mapping validation errors:</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {errs.map((msg, idx) => (
                          <li key={idx}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div role="status" style={{ color: "#3c763d", marginTop: 8 }}>
                      Mappings look valid.
                    </div>
                  );
                })()}

                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={saveToBackend}
                    title="Save model and mappings to backend"
                  >
                    Save Model + Mappings
                  </button>
                  <button
                    onClick={() => {
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
                      if (!window.confirm("Clear all mappings (XML params and templates)?")) return;
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

              {/* XML Preview Panel */}
              <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 12 }}>
                <strong>XML Preview</strong>
                <p style={{ marginTop: 6, fontSize: 12 }}>
                  Live preview of templates rendered with current JSON. One fragment per path with a template.
                </p>

                {/* Error list */}
                {preview.errors && preview.errors.length > 0 && (
                  <div role="alert" style={{ marginTop: 8, color: "#a94442" }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Errors:</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {preview.errors.map((e, idx) => (
                        <li key={`${e.path}-${idx}`}>
                          <code style={{ fontSize: 12 }}>{e.path}</code>: {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ marginTop: 8 }}>
                  <details open>
                    <summary>Rendered XML</summary>
                    <pre
                      aria-label="XML preview output"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        background: "var(--bg-secondary)",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid var(--border-color)",
                        fontSize: 12,
                        maxHeight: 300,
                        overflow: "auto",
                      }}
                    >
                      {preview.xml || "<empty>"}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
