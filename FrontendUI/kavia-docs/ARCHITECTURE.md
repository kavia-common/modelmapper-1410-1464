# FrontendUI Architecture Overview

## Introduction

This document describes the current architecture of the ModelMapper Frontend UI as implemented in the repository. It explains the core modules, routing, authentication behavior, API client responsibilities, test and mock infrastructure, and environment flags that modify runtime behavior. The goal is to provide an accurate reference to guide development, testing, and integration.

## Architecture

### Application Composition

The application is a React single-page application that renders routes within a global authentication context and a persistent navigation bar.

- Entry: src/index.js
  - Conditionally enables a fetch-based mock layer when REACT_APP_ENABLE_MOCKS=true.
  - Renders the root App component.
- Root: src/App.js
  - Wraps routes in AuthProvider context to supply authentication and role information.
- Routing: src/routes/AppRoutes.js
  - Defines all routes and guards using a ProtectedRoute component.
  - Displays a persistent Navbar on every route.

### Routing

The router uses react-router-dom v6 and is configured in src/routes/AppRoutes.js.

- /login → LoginPage (src/views/LoginPage.js)
- / → MappingStudio (src/views/MappingStudio.js) behind ProtectedRoute
- /connect → DeviceConnectPage (src/views/DeviceConnectPage.js) behind ProtectedRoute
- /versions → VersionControlPage (src/views/VersionControlPage.js) behind ProtectedRoute with role check (["admin", "user"])
- /service-model → ServiceModelEditor (src/views/ServiceModelEditor.js) behind ProtectedRoute
- /unauthorized → Inline unauthorized page component
- * → Redirects to /

ProtectedRoute behavior:
- If REACT_APP_ENABLE_AUTH is not "true", no authentication enforcement is performed and all routes are accessible.
- If REACT_APP_ENABLE_AUTH is "true":
  - Not authenticated users are redirected to /login.
  - If a roles array is provided, user roles must intersect with the required roles; otherwise, the user is redirected to /unauthorized.

### Authentication and RBAC

Authentication state is managed by AuthContext (src/context/AuthContext.js):
- State:
  - token: stored in localStorage as mm_token
  - user: stored in localStorage as mm_user with username and roles
  - roles: derived from user.roles
  - isAuthenticated: Boolean(token)
- Methods:
  - login(username, password): calls apiClient.login; stores token and a demo user with inferred roles ("admin" → ["admin","user"]; otherwise ["user"]).
  - logout(): calls apiClient.logout; clears localStorage and state.
  - hasRole(role): checks role membership.
- Unauthorized handling:
  - apiClient dispatches a mm:unauthorized event on 401 responses; the AuthProvider listens and clears auth state.

Note: When REACT_APP_ENABLE_AUTH is not enabled, the app does not gate routes, but the auth context and login/logout UI still function to preserve flow.

### Navbar

Navbar (src/components/Navbar.js) provides:
- Menu toggle button for primary links.
- Links to Mapping Studio, Service Model Editor, Connect Device, Version Control.
- Theme toggle using useTheme hook.
- Auth area:
  - If not authenticated: Login button that navigates to /login.
  - If authenticated: User chip (username and roles) and Logout button.

### Theme

useTheme (src/hooks/useTheme.js) manages the theme:
- Persists the selected theme in localStorage as mm_theme.
- Sets data-theme on the document element ("light" or "dark").
- Default is "light".
- CSS variables are defined in src/App.css and used across the app.

### Views

- LoginPage (src/views/LoginPage.js)
  - Simple login form which calls AuthContext.login and navigates to / on success.

- MappingStudio (src/views/MappingStudio.js)
  - Allows selection of a vendor and a Service ID.
  - Uses DragDropMapping for selecting YANG modules/submodules from an available list and submitting to the backend via apiClient.mapService.
  - Displays mapping status updates.
  - Available models are derived from a vendor → array mapping (DEMO_MODELS) for demo purposes.

- DeviceConnectPage (src/views/DeviceConnectPage.js)
  - Form to provide device IP, vendor, and credentials.
  - Calls apiClient.connectDevice to retrieve YANG models.
  - Displays connection status and retrieved models.

- VersionControlPage (src/views/VersionControlPage.js)
  - Fetches version history with apiClient.getVersionHistory and shows a table.
  - Supports revert and manage actions via apiClient.versionControlAction.
  - Displays feedback status messages.

- ServiceModelEditor (src/views/ServiceModelEditor.js)
  - JSON editor for a vendor-agnostic service model with validation/formatting.
  - Lists JSON paths and supports:
    - Legacy XML parameter mapping (per-path array of strings).
    - Advanced templating per-path with Jinja/Nunjucks syntax to generate XML fragments.
  - Live XML preview via renderXmlPreview (src/utils/xmlPreview.js).
  - REST interactions:
    - getServiceModel(id)
    - saveServiceModel({ id?, model, mappings })
    - deleteServiceModel(id)
  - Includes import/export capabilities and mapping validation.

### Components and Utilities

- DragDropMapping (src/components/DragDropMapping.js)
  - Dependency-free drag-and-drop and keyboard-accessible selection.
  - Validates vendor and requires at least one item before allowing commit.
  - Provides success, warn, and error feedback.

- VendorSelector (src/components/VendorSelector.js)
  - Simple select component for vendor.

- xmlPreview (src/utils/xmlPreview.js)
  - Client-side Nunjucks environment to render XML previews from templates.
  - Supports per-path rendering with context { value, model }.
  - Tolerant to undefined values; collects render errors per path.

- rbac (src/utils/rbac.js)
  - Utility function canAccess(roles, allowed) for role intersection checks.

### API Client

apiClient (src/services/apiClient.js) encapsulates all backend communication:
- Base URL is REACT_APP_API_BASE_URL or empty string for same-origin requests.
- Automatically adds Authorization: Bearer <token> header when a token is available.
- Methods:
  - login({ username, password })
  - logout()
  - mapService({ serviceId, vendor, yangModel })
  - connectDevice({ deviceIp, vendor, credentials })
  - getVersionHistory({ deviceId })
  - versionControlAction({ deviceId, action, targetVersion })
  - getServiceModel(id)
  - saveServiceModel({ id?, model, mappings })
  - deleteServiceModel(id)
- On 401 responses, dispatches a mm:unauthorized event to trigger auth reset.

### Mock Layer

The mock layer lives in src/mocks/browser.js and is conditionally enabled in src/index.js when REACT_APP_ENABLE_MOCKS is set to "true".

Mocked endpoints include:
- POST /api/auth/login and /api/auth/logout
- POST /api/map-service
- POST /api/connect-device
- GET /api/version-control?deviceId=...
- POST /api/version-control
- Service model storage CRUD under /api/service-models and /api/service-models/:id

The mock responses simulate realistic data for UI flows and store service models in an in-memory object.

### Testing

- Unit tests: jest/react-testing-library setup via src/setupTests.js and App.test.js.
- E2E tests: Cypress configuration in FrontendUI/cypress.config.js with test specs in FrontendUI/cypress/e2e:
  - auth_and_navigation.cy.js: validates login flow and navigation.
  - mapping_studio.cy.js: validates Mapping Studio interactions including keyboard-based selection.

## Environment and Configuration

### Environment Variables

- REACT_APP_API_BASE_URL
  - Base URL for apiClient requests.
  - When omitted, relative paths are used (same-origin).

- REACT_APP_ENABLE_AUTH
  - When set to "true", ProtectedRoute enforces authentication and RBAC.
  - Any value other than "true" disables route guards (useful for demos/tests).

- REACT_APP_ENABLE_MOCKS
  - When set to "true", src/mocks/browser.js is enabled and fetch requests to listed endpoints are intercepted and answered by the mock layer.

Note: The previous README guidance stating that mocks are always enabled and auth is always bypassed is superseded by the environment flags above. The current code makes both behaviors opt-in via environment configuration.

### Dependencies

- react, react-dom, react-router-dom
- react-scripts (CRA)
- nunjucks for XML preview in the Service Model Editor
- Development and test dependencies include Cypress and @testing-library packages

## Data and API Contracts

The API contracts used in the app align with the work item OpenAPI description. The following requests are made by apiClient:
- POST /api/auth/login, POST /api/auth/logout
- POST /api/map-service
- POST /api/connect-device
- GET /api/version-control?deviceId=...
- POST /api/version-control
- GET/POST/PUT/DELETE /api/service-models (for the Service Model Editor)

When REACT_APP_ENABLE_MOCKS=true, these endpoints are handled by the mock layer.

## Accessibility and Responsiveness

- Keyboard-accessible controls across views, with Enter behavior for DragDropMapping.
- ARIA attributes and role=status feedback messaging in interactive flows.
- Theme-aware styling using CSS variables (light/dark).
- Responsive layout across pages, stacking forms and columns on smaller viewports.

## Conclusion

The current architecture favors clear separation of concerns:
- Authentication and roles live in AuthContext.
- Routing and enforcement live in AppRoutes with explicit, environment-controlled gating.
- API logic is centralized in apiClient with a lightweight, optional mock layer for development and testing.
- Feature views are self-contained and rely on shared components and utilities.

This document reflects the present implementation and should be kept in sync with code changes to ensure accurate guidance for contributors and integrators.
