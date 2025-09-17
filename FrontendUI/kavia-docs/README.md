# ModelMapper Frontend UI – Project Guide

## Introduction

This guide summarizes how to run, configure, and contribute to the Frontend UI. It reflects the current codebase behavior, including authentication and mock controls via environment variables, available pages and features, and the testing setup.

## Getting Started

### Prerequisites

- Node.js and npm
- Internet access for dependency installation

### Install and Run

- Install dependencies:
  - npm install
- Start the development server:
  - npm start (http://localhost:3000)
- Run unit tests:
  - npm test
- Cypress (E2E) tests:
  - Interactive: npm run cypress:open
  - Headless: npm run cypress:run

## Configuration

Create a .env file in FrontendUI root as needed. The app respects the following environment variables:

- REACT_APP_API_BASE_URL
  - Base URL for backend REST API. When omitted, calls use relative paths (same-origin).
- REACT_APP_ENABLE_AUTH
  - "true" enables authentication enforcement via ProtectedRoute. Any other value disables enforcement.
- REACT_APP_ENABLE_MOCKS
  - "true" enables the fetch-based mock layer defined in src/mocks/browser.js. Any other value disables mocks.

Typical combinations:
- Local demo without a backend:
  - REACT_APP_ENABLE_MOCKS=true
  - REACT_APP_ENABLE_AUTH=false (or unset)
- Integration against a real backend:
  - REACT_APP_API_BASE_URL=https://api.example.com
  - REACT_APP_ENABLE_MOCKS=false (or unset)
  - REACT_APP_ENABLE_AUTH=true

## Features

- Visual Service-to-YANG Model Mapping:
  - Vendor selection and drag-and-drop/keyboard selection of available YANG modules/submodules.
  - Real-time validation and feedback, and API submission to create a mapping.
- Device Connection and YANG Retrieval:
  - Connects to a device to retrieve YANG models for the selected vendor.
- Version Control:
  - Loads device model history and supports revert/manage actions.
- Service Model Editor:
  - JSON authoring, validation, path enumeration, legacy XML param mapping, and Jinja/Nunjucks templating with live XML preview.

## Pages and Navigation

- /login: Login form using AuthContext.
- /: Mapping Studio.
- /connect: Connect Device.
- /versions: Version Control (requires role ["admin", "user"] when auth is enabled).
- /service-model: Service Model Editor.
- /unauthorized: Unauthorized message page.

The Navbar is visible on all routes and includes:
- Links: Mapping Studio, Service Model Editor, Connect Device, Version Control.
- Theme toggle (light/dark).
- Auth area: Login button (if not authenticated) or user chip and Logout (if authenticated).

## Authentication & RBAC

AuthContext manages:
- Token and user state (stored in localStorage as mm_token and mm_user).
- login(username, password) via apiClient.
- logout() via apiClient.
- hasRole(role) helper.

ProtectedRoute behavior:
- When REACT_APP_ENABLE_AUTH=true:
  - Redirects unauthenticated users to /login.
  - Enforces role checks when a roles array is provided.
- Otherwise, routing is open for demos/testing.

## API Client

apiClient centralizes calls to the backend:
- POST /api/auth/login and /api/auth/logout
- POST /api/map-service
- POST /api/connect-device
- GET /api/version-control?deviceId=...
- POST /api/version-control
- GET/POST/PUT/DELETE /api/service-models

On 401 responses, apiClient dispatches a mm:unauthorized event to trigger auth reset.

## Mock Layer

When REACT_APP_ENABLE_MOCKS=true, src/mocks/browser.js wraps fetch and serves responses for the endpoints listed above. This supports local development and E2E testing without a running backend.

## Testing

- Unit tests:
  - Configured via src/setupTests.js with @testing-library/jest-dom.
  - Example: src/App.test.js validates the presence of the ModelMapper navbar title.
- Cypress E2E:
  - Config at cypress.config.js.
  - Tests under cypress/e2e cover login navigation and Mapping Studio interaction.
  - @testing-library/cypress commands are enabled.

## Accessibility & Theming

- The UI is keyboard accessible and provides visible focus states.
- ARIA roles and role=status messaging are present in interactive features.
- Theme management via useTheme hook and CSS variables supports light/dark modes.

## Contributing

- Follow the existing code style defined in eslint.config.mjs.
- Keep documentation in kavia-docs synchronized with code changes.
- Update architecture and feature descriptions when adding or modifying routes, API methods, or major UI flows.

## License

This project is part of the ModelMapper system. Consult the repository root license and policies for usage and contribution terms.
