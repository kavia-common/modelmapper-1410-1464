import nunjucks from "nunjucks";

/**
 * Initialize a Nunjucks environment suitable for client-side previews.
 * We avoid custom loaders because renderString does not require one, and
 * nunjucks.TemplateLoader is not part of the browser bundle. Using it
 * causes runtime errors and prevents preview rendering.
 */
let env;
/* Create a resilient environment for browser use */
try {
  env = new nunjucks.Environment(undefined, {
    autoescape: false, // emit raw XML fragments
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true,
  });
} catch (e) {
  // Fallback minimal shim: expose a renderString that throws a readable error
  env = {
    renderString(_tpl) {
      throw new Error(
        "Nunjucks environment failed to initialize. Check bundling and imports."
      );
    },
  };
}

// PUBLIC_INTERFACE
export function renderXmlPreview({ model, mappings }) {
  /** Render XML preview by applying per-path templates against the model.
   * Returns:
   * {
   *   xml: string,
   *   errors: Array<{ path, message }>
   * }
   *
   * Rules:
   * - For each mapping entry:
   *     - If object shape and has template: render with context { value, model }
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
    const tokens = path.split(".");
    let cur = obj;
    for (let token of tokens) {
      if (token.endsWith("[]")) {
        const base = token.slice(0, -2);
        cur = cur?.[base];
        // keep arrays intact so templates can loop
        continue;
      }
      cur = cur?.[token];
    }
    return cur;
  };

  Object.entries(mappings).forEach(([path, val]) => {
    const entry = Array.isArray(val) ? { xmlParams: val } : (val || {});
    const template = typeof entry.template === "string" ? entry.template : "";
    if (!template || !template.trim()) {
      return; // nothing to render for this path
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
