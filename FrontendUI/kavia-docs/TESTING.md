# FrontendUI Testing Guide

## Introduction

This guide describes the current testing stack and how to execute unit and end-to-end (E2E) tests. It also explains how the optional mock layer interacts with Cypress.

## Unit Tests

- Framework: Jest with @testing-library/react and @testing-library/jest-dom.
- Setup:
  - src/setupTests.js registers testing-library matchers.
- Example:
  - src/App.test.js checks for the ModelMapper brand text rendered by Navbar.

Run:
- npm test

Tips:
- Keep tests pure and avoid reliance on the mock layer unless explicitly required.
- Components that use routing or context can be rendered with relevant providers as needed.

## E2E Tests (Cypress)

- Configuration: FrontendUI/cypress.config.js
  - baseUrl: http://localhost:3000
  - supportFile: cypress/support/e2e.js, which imports @testing-library/cypress commands via cypress/support/commands.js
- Test specs:
  - cypress/e2e/auth_and_navigation.cy.js: validates login flow and presence of primary navigation.
  - cypress/e2e/mapping_studio.cy.js: validates Mapping Studio vendor selection, keyboard interactions, and mapping.

Run:
- Development UI: npm run cypress:open
- Headless: npm run cypress:run

## Mocks and Cypress

When REACT_APP_ENABLE_MOCKS=true, the fetch-based mock layer (src/mocks/browser.js) simulates backend responses:
- Authentication is still exercised through the UI flow.
- Mapping, device connection, version history, and service model storage are served from in-memory data.
- This setup enables reliable E2E testing without a backend.

For integration tests against a real backend:
- Set REACT_APP_ENABLE_MOCKS=false (or exclude it).
- Provide a REACT_APP_API_BASE_URL.
- Optionally enable REACT_APP_ENABLE_AUTH=true to test route protection.

## Linting

- ESLint is configured via eslint.config.mjs with React plugin and globals for Cypress tests.
- Run your editor’s ESLint integration or execute eslint as part of CI as needed.

## Troubleshooting

- If tests fail due to missing environment flags:
  - For mock-based tests, ensure REACT_APP_ENABLE_MOCKS=true is present in your environment when starting the dev server.
- For routing or auth-related failures:
  - Confirm REACT_APP_ENABLE_AUTH is set appropriately for the scenario being tested.
- If Cypress cannot find elements:
  - Prefer @testing-library/cypress queries like cy.findByRole and cy.findByLabelText to reduce brittleness.
