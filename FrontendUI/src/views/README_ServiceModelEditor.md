# Service Model Editor (Frontend)

This screen allows users to define a vendor-agnostic service model in JSON and map JSON properties to XML parameter names.

Overview:
- The editor validates and pretty-prints JSON, lists JSON paths (including nested structures), and allows mapping each path to one or more XML parameter names.
- Users can Save, Load, and Delete service models via backend REST API (a local mock layer is provided for development).
- Export will download a combined JSON file with the service model ("model") and "mappings".

API integration:
- Base URL: REACT_APP_API_BASE_URL (e.g., https://api.modelmapper.example.com)
- Endpoints used by the editor:
  - GET    /api/service-models/:id
  - POST   /api/service-models
  - PUT    /api/service-models/:id
  - DELETE /api/service-models/:id

Payloads:
- Create/Update request body:
  {
    "model": { ... },       // Parsed JSON from the editor
    "mappings": {           // Map of "json.path" -> [ "XML_PARAM", ... ]
      "serviceId": ["svc-id"],
      "endpoints[].device": ["device-name"]
    }
  }
- GET/POST/PUT responses (example):
  {
    "id": "svc-001",
    "model": { ... },
    "mappings": { ... },
    "updatedAt": "2025-01-01T00:00:00Z"
  }
- DELETE response:
  { "id": "svc-001", "deleted": true }

API client usage:
- Implemented in src/services/apiClient.js
  - getServiceModel(id)
  - saveServiceModel({ id?, model, mappings })
  - deleteServiceModel(id)

Mocking in development:
- src/mocks/browser.js intercepts fetch() and simulates the endpoints above:
  - In-memory store keyed by id
  - Supports GET/POST/PUT/DELETE with example responses
  - Enabled automatically in index.js via enableApiMocks()
- Disable mocks before production.

UI usage:
- The Service Model Editor screen is at /service-model.
- Controls:
  - Model ID input: specify which model to load/save/delete.
  - Load: calls GET /api/service-models/:id
  - Save: POST (create if no id) or PUT (update when id is present)
  - Delete: DELETE /api/service-models/:id
  - Validate & Format: fixes JSON indentation and validates syntax.
  - Export JSON: downloads { model, mappings } to a file.

Error and progress:
- Buttons show progress text while requests are in flight.
- Status area displays success or error messages.
- JSON parse errors are indicated inline.

Notes:
- Authentication: If enabled, ApiClient adds Authorization: Bearer <token>.
- For schema validation, the backend may return errors/warnings; wire these into the editor’s status or parseError area as needed.
