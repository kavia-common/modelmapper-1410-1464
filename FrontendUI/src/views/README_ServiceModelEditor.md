# Service Model Editor (Frontend)

This screen allows users to define a vendor-agnostic service model in JSON and map JSON properties to XML parameter names.

How it works (demo mode):
- JSON content and mappings are stored in browser localStorage.
- The editor validates and pretty-prints JSON, lists JSON paths (including nested structures), and allows mapping each path to one or more XML parameter names.
- Export will download a combined JSON file with the service model ("model") and "mappings".

Backend integration points:
- Replace localStorage with API calls to your backend.
  - Example endpoints:
    - GET /api/service-models/:id
    - POST /api/service-models (body: { modelJson, mappings })
    - PUT /api/service-models/:id (body: { modelJson, mappings })
- See "saveToBackend" placeholder function inside ServiceModelEditor.js to connect POST/PUT.
- For schema validation, backend may return errors/warnings; wire them into parseError display.

Navigation:
- Accessible via the Navbar link "Service Model Editor" at /service-model
