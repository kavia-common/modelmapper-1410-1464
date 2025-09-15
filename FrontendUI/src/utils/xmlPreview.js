import nunjucks from "nunjucks";

/**
 * Initialize a Nunjucks environment suitable for client-side previews.
 * - Allowed constructs (Jinja/Nunjucks):
 *   {{ ... }} for expressions/printing (e.g., {{ value }}, {{ model.serviceId }})
 *   {% if ... %} ... {% endif %} for conditionals
 *   {% for x in ... %} ... {% endfor %} for loops
 * - Context: each template receives { value, model } where:
 *     value = data resolved at the mapping path (may be primitive/object/array)
 *     model = full JSON model object
 * - Security: autoescape is disabled to emit raw XML fragments. Do not expose untrusted inputs here.
 * - Undefined handling: throwOnUndefined=false to avoid hard errors; preview will report exceptions per path.
 */
const env = new nunjucks.Environment(
  new nunjucks.TemplateLoader(), // default in-browser loader for renderString
  {
    autoescape: false, // XML fragments shouldn't be HTML-escaped for this preview
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true,
  }
);

// PUBLIC_INTERFACE
export function renderXmlPreview({ model, mappings }) {
  /** Render XML preview by applying per-path templates against the model.
   * Returns:
   * {
   *   xml: string,                  // concatenated XML fragments (one per path with a template)
   *   errors: Array<{ path, message }>
   * }
   *
   * Rules:
   * - For each mapping entry:
   *     - If object shape and has template: render with context { value: valueAtPath, model }
   *     - If legacy array-only mapping: skip for XML preview (no template)
   * - If the path points to an array:
   *     - The template receives 'value' as the entire array. Authors should loop in template.
   * - If path resolution fails (no such value), we still render with value = undefined.
   * - Any nunjucks render error is captured and returned in errors.
   */
  const out = [];
  const errors = [];

  if (!model || typeof model !== "object" || !mappings || typeof mappings !== "object") {
    return { xml: "", errors: [{ path: "*", message: "Model or mappings missing/invalid." }] };
    }

  const resolvePath = (obj, path) => {
    // Supports dotted paths and [] notation to indicate arrays (we do not expand [] here)
    // Example: endpoints[].device or qos.policy
    if (!path) return obj;
    const tokens = path.split("."); // split at dots
    let cur = obj;
    for (let token of tokens) {
      if (token.endsWith("[]")) {
        const base = token.slice(0, -2);
        cur = cur?.[base];
        // If array notation used but author expected element; we keep the array as value so template can loop.
        continue;
      }
      cur = cur?.[token];
    }
    return cur;
  };

  Object.entries(mappings).forEach(([path, val]) => {
    // normalize to object form if array (legacy)
    const entry = Array.isArray(val) ? { xmlParams: val } : (val || {});
    const template = typeof entry.template === "string" ? entry.template : "";
    if (!template.trim()) {
      // nothing to render for this path
      return;
    }

    const value = resolvePath(model, path);
    try {
      const rendered = env.renderString(template, { value, model });
      out.push(rendered);
    } catch (e) {
      errors.push({ path, message: e?.message || String(e) });
    }
  });

  const xml = out.join("\n");
  return { xml, errors };
}
