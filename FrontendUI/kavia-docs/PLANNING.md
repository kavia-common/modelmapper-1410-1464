# FrontendUI Planning Notes

## Introduction

This document captures the current scope and near-term improvements based on the existing implementation. It is intended to be kept short and actionable.

## Current Scope

- Core features implemented:
  - Mapping Studio with drag-and-drop/keyboard selection and validation.
  - Device Connect page with vendor, IP, and credentials to fetch YANG models.
  - Version Control page with history loading and revert/manage actions.
  - Service Model Editor with JSON editing, path enumeration, legacy XML params, templates, and live XML preview.
- Architecture:
  - AuthContext supplies auth state; route access is enforced when REACT_APP_ENABLE_AUTH="true".
  - apiClient centralizes backend calls; mock layer optionally replaces fetch when REACT_APP_ENABLE_MOCKS="true".

## Near-Term Improvements

- Accessibility:
  - Continue to refine ARIA attributes and labeling across interactive components.
  - Provide focus management after auth redirects or modals (if introduced for confirmation flows).
- Mapping Studio:
  - Consider virtualized lists for very large model sets.
  - Optional grouping and badges for modules/submodules based on backend metadata.
- Service Model Editor:
  - Add richer validation for template syntax (pre-compilation checks).
  - Provide UI import/export presets and examples.
  - Consider schema-aware validation with backend support.
- Version Control:
  - Add confirmation dialogs for revert.
  - Provide diff view where applicable if backend supports it.
- Integration:
  - Ensure real backend parity with mock endpoints and confirm payload shapes.
- Testing:
  - Expand Cypress coverage for Service Model Editor flows.
  - Add unit tests for xmlPreview rendering edge cases.
- Security:
  - Ensure token refresh/expiry handling if backend supports refresh tokens.
  - Harden error paths and logging around 401/403 cases.

## Environment and Release Notes

- Mocks and auth enforcement are controlled via:
  - REACT_APP_ENABLE_MOCKS
  - REACT_APP_ENABLE_AUTH
- For production:
  - Disable mocks, enable auth, and set REACT_APP_API_BASE_URL.
