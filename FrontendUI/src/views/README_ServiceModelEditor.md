# Service Model Editor (Frontend)

This screen allows users to define a vendor-agnostic service model in JSON and map JSON properties to XML parameter names and/or render XML fragments using Jinja/Nunjucks templates.

Overview:
- Author your service model in JSON.
- The editor validates and pretty-prints JSON, enumerates JSON paths (including nested structures and array paths using []), and lets you:
  - Map each path to one or more XML parameter names (legacy mapping).
  - Provide a per-path Jinja/Nunjucks template to generate XML fragments based on that path’s value and the full model.
- Live XML Preview renders all templates against your current JSON and shows any render errors.
- Save, Load, and Delete service models via REST API (local mock layer provided).
- Export downloads a combined JSON file with the service model ("model") and "mappings").

Key files:
- UI: src/views/ServiceModelEditor.js
- XML preview engine: src/utils/xmlPreview.js
- API Client: src/services/apiClient.js
- Mock API: src/mocks/browser.js

--------------------------------------------------------------------

1) Mapping Data Model

The "mappings" object supports two shapes per JSON path key:

- Legacy (array of XML params only):
  {
    "serviceId": ["svc-id"],
    "endpoints[].device": ["device-name"]
  }

- Advanced (object with optional xmlParams and/or template):
  {
    "serviceId": { "xmlParams": ["svc-id"], "template": "<param name=\"id\">{{ value }}</param>" },
    "endpoints[].device": { "template": "{% for ep in value %}<endpoint device=\"{{ ep }}\" />{% endfor %}" }
  }

Notes:
- When both xmlParams and template are provided, both are persisted. The XML preview only renders the template part (xmlParams are stored for backward compatibility or external usage).
- A path key uses dot notation; append [] to a key to indicate an array context (e.g., endpoints[].device). In preview, array paths pass the entire array to the template, so loop explicitly if needed.

--------------------------------------------------------------------

2) Allowed Jinja/Nunjucks Syntax

The editor and preview accept a Jinja-style syntax powered by Nunjucks:

- Output variable:
  {{ value }}              // the resolved value at this JSON path
  {{ model }}              // the full JSON object
  {{ value.someField }}

- Conditional blocks:
  {% if value %}...{% endif %}
  {% if value == "gold" %}...{% else %}...{% endif %}

- Loops:
  {% for item in value %}...{% endfor %}
  {% for ep in model.endpoints %}<endpoint id="{{ ep.id }}" />{% endfor %}

- Whitespace control and trimming are enabled (trimBlocks/lstripBlocks). Autoescape is disabled for XML preview (output is not HTML-escaped). Ensure you do not render untrusted content directly.

Context provided to templates:
- value: The resolved value for the current path (can be a primitive, object, or array).
- model: The entire JSON model.

Unsupported in preview:
- Custom filters or loaders (no on-disk includes; client-side only).
- External includes/imports. Use inline templates per path.

--------------------------------------------------------------------

3) Sample Workflow (Defining Mappings with Templates)

Example JSON (abbreviated):
{
  "serviceId": "svc-001",
  "endpoints": [
    { "id": "ep1", "device": "router-a", "interface": "GigabitEthernet0/0/0" },
    { "id": "ep2", "device": "router-b", "interface": "GigabitEthernet0/0/1" }
  ],
  "qos": { "policy": "gold", "bandwidthMbps": 1000 }
}

Steps:
1. Open /service-model and paste your JSON into the editor.
2. Click “Validate & Format” to check syntax.
3. In “JSON Properties”, locate:
   - serviceId
   - endpoints[].device
   - qos.policy
4. For serviceId:
   - Legacy mapping: add XML param svc-id.
   - Template:
     <param name="service-id">{{ value }}</param>
5. For endpoints[].device:
   - Template:
     {% for dev in value %}<endpoint device="{{ dev }}" />{% endfor %}
   Note: value is the array of device strings when the path is endpoints[].device.
6. For qos.policy:
   - Conditional template:
     {% if value == "gold" %}
       <qos policy="gold" priority="high" />
     {% else %}
       <qos policy="{{ value }}" />
     {% endif %}
7. Inspect the XML Preview panel:
   - Rendered XML shows the concatenation of all non-empty template outputs.
   - Fix any errors shown under “Errors”.

Saving:
- Click Save to persist (POST on create; PUT on update when Model ID is set).
- Export JSON to download { model, mappings } as a file for offline review.

--------------------------------------------------------------------

4) How XML Preview Works

- Engine: src/utils/xmlPreview.js with Nunjucks environment configured as:
  - autoescape: false (outputs XML as-is)
  - throwOnUndefined: false (undefined variables render as empty)
  - trimBlocks/lstripBlocks: true (cleaner whitespace)

- Per-path process:
  - For each mappings[path] that defines a template (string with non-whitespace content):
    - Resolve value via path (supports dotted tokens and [] notation; [] is not expanded, it passes the array).
    - Render template with context { value, model }.
    - Collect rendered output. Any render exceptions are captured and listed in errors.

- Output:
  {
    xml: "<fragment from path A>\n<fragment from path B>\n...",
    errors: [{ path, message }]
  }

- Important:
  - The preview does not enforce XML schema validity; it only renders string fragments.
  - Legacy xmlParams-only entries are not rendered in the XML preview.

--------------------------------------------------------------------

5) Validation and Troubleshooting

Editor validation:
- JSON parse errors: shown inline above the editor; use “Validate & Format”.
- Mapping validation (pre-save):
  - Path syntax check: /^[A-Za-z0-9_\-$]+(\[\])?(?:\.[A-Za-z0-9_\-$]+(\[\])?)*$/
  - xmlParams (if provided) must be an array of strings.
  - Template basic checks: balanced {{ }}, {% %} counts (heuristic).
  - Errors are summarized in the Summary panel; fix before saving.

Preview troubleshooting:
- “Template tag count mismatch”: A missing {% endif %} or {% endfor %}.
- “Template expression count mismatch”: Unbalanced {{ or }}.
- Blank output:
  - The template is empty or only whitespace.
  - The path resolves to undefined; with throwOnUndefined=false the output becomes empty. Consider guarding with {% if value %}...{% endif %}.
- Array handling:
  - Paths ending with [] pass the array to value. You must loop explicitly: {% for x in value %}...{% endfor %}.

Security considerations:
- autoescape=false: intended for XML snippet rendering. Do not inject untrusted raw content into templates.
- Client-side preview is illustrative; enforce real validation, escaping, and schema checks in the backend.

--------------------------------------------------------------------

6) Backend Integration Guidance

Persisted payload shape:
- Create/Update request body:
  {
    "model": { ... },
    "mappings": {
      "json.path": [ "XML_PARAM", ... ] OR
      "json.path": { "xmlParams": [ ... ], "template": "<nunjucks string>" }
    }
  }

Typical backend flows:
- Accept the mappings object as-is.
- For legacy processing:
  - Consume array-form xmlParams as classic name-mappings.
- For template processing:
  - Server-side render each mapping with a Jinja2-compatible engine (e.g., Python Jinja2) using a context analogous to { value, model }:
    - Resolve value by dotted path with [] semantics (treat [] as “give me the array at that segment”).
    - Render template; gather fragments; assemble into your target document or per-vendor structures.
- Validation:
  - Consider compiling templates at save-time to catch syntax errors early.
  - Enforce safe filters/whitelisting if templates are authored by untrusted users.
  - Optionally, provide schema-aware validation (e.g., ensure produced XML conforms to an XSD) and surface errors back to the UI.

Migration/backward-compatibility:
- If existing models store only arrays, continue to accept them.
- When a template is added to an array-based mapping, upgrade to object form in storage:
  { "xmlParams": ["..."], "template": "..." }.

Environment:
- Base URL: REACT_APP_API_BASE_URL (e.g., https://api.modelmapper.example.com).
- Authentication: The ApiClient adds Authorization: Bearer <token> when configured.

--------------------------------------------------------------------

7) Endpoints (recap)

- GET    /api/service-models/:id
- POST   /api/service-models
- PUT    /api/service-models/:id
- DELETE /api/service-models/:id

Responses (example):
{
  "id": "svc-001",
  "model": { ... },
  "mappings": { ... },
  "updatedAt": "2025-01-01T00:00:00Z"
}

DELETE response:
{ "id": "svc-001", "deleted": true }

Mock development:
- src/mocks/browser.js provides in-memory CRUD for /api/service-models and is enabled automatically in src/index.js via enableApiMocks().
- Disable mocks before production.

--------------------------------------------------------------------

8) UI Usage Cheatsheet

- Location: /service-model
- Controls:
  - Model ID: choose or type an ID to Load/Save/Delete.
  - Validate & Format: pretty print and validate JSON.
  - Import JSON: load from file.
  - Map JSON Properties:
    - Add XML params (legacy).
    - Write a template to generate XML (Jinja/Nunjucks).
  - Summary panel: mapping validation.
  - Export JSON: download { model, mappings }.
  - XML Preview: see combined output and errors in real-time.

--------------------------------------------------------------------

9) Examples (copy-paste)

- Simple print:
  <param name="service-id">{{ value }}</param>

- Loop array of endpoints (at path endpoints[].device):
  {% for dev in value %}
    <endpoint device="{{ dev }}" />
  {% endfor %}

- Conditional QoS (at path qos.policy):
  {% if value == "gold" %}
    <qos policy="gold" priority="high" />
  {% else %}
    <qos policy="{{ value }}" />
  {% endif %}

--------------------------------------------------------------------

Notes:
- Authentication: If enabled, ApiClient adds Authorization: Bearer <token>.
- The XML preview is for guidance; implement authoritative rendering/validation on the backend.
- For schema validation, have the backend return errors/warnings; these can be surfaced next to the Summary or Preview panels as needed.
