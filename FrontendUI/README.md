# ModelMapper Frontend UI

React-based visual design studio for mapping network services to vendor-specific YANG models.

## Key Features

- Visual Service-to-YANG Model Mapping with drag-and-drop (supports submodules) and real-time feedback
- Dynamic Device Connection to retrieve vendor YANG models (Cisco, Huawei, Nokia)
- Version Control (view history, revert, manage)
- Authentication with JWT and Role-Based Access Control (RBAC)
- Responsive and accessible UI, extensible vendor support
- API integration per provided OpenAPI spec
- Cypress end-to-end test setup with examples

## Quick Start

- Copy `.env.example` to `.env` and set REACT_APP_API_BASE_URL to your backend API base URL.
- Install dependencies: `npm install`
- Run dev server: `npm start` (http://localhost:3000)
- Run unit tests: `npm test`
- Run Cypress tests (UI): `npm run cypress:open`
- Run Cypress in headless: `npm run cypress:run`

## Environment

- REACT_APP_API_BASE_URL: Backend base URL (e.g., https://api.modelmapper.example.com)

## Structure

- `src/services/apiClient.js`: API client for all endpoints (/api/map-service, /api/connect-device, /api/version-control, /api/auth/*)
- `src/context/AuthContext.js`: JWT handling, session, RBAC
- `src/routes/AppRoutes.js`: Router and protected routes
- `src/views/*`: Pages (Login, MappingStudio, DeviceConnectPage, VersionControlPage)
- `src/components/*`: UI components (Navbar, VendorSelector, DragDropMapping)
- `src/hooks/useTheme.js`: Theme management
- `cypress/*`: Cypress config, support, and example tests

## Accessibility and Responsiveness

- All interactive controls are keyboard accessible (Enter to add in drag-and-drop list).
- Uses CSS variables and semantic markup for better accessibility and theming.

## Extensibility

- Add vendors via VendorSelector or dynamic backend-fed lists.
- Mapping logic abstracts list of YANG modules; can be fed from `/api/connect-device` results.

## Security

- JWT included in Authorization header for authenticated endpoints.
- On 401, user session is cleared and UI can redirect to login.

