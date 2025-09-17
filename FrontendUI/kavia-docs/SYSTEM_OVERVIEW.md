# FrontendUI System Overview

## Introduction

This document provides a concise overview of the Frontend UI’s modules, key routes, data flows, and the interplay between authentication, routing, API client, mock layer, and feature pages. It supplements the architecture overview with a visual diagram.

## High-Level Diagram

```mermaid
flowchart TD
  subgraph App["App Root"]
    A[AuthProvider]
    B[Navbar]
    C[Routes]
  end

  subgraph Routes
    R1["/login\nLoginPage"]
    R2["/\nMappingStudio"]
    R3["/connect\nDeviceConnectPage"]
    R4["/versions\nVersionControlPage"]
    R5["/service-model\nServiceModelEditor"]
  end

  A --> C
  B --> C

  subgraph Auth
    AC[AuthContext\nisAuthenticated, user, roles\nlogin/logout/hasRole]
  end

  C -->|ProtectedRoute check\n(REACT_APP_ENABLE_AUTH)| AC

  subgraph API["apiClient (services/apiClient.js)"]
    AP1[login/logout]
    AP2[mapService]
    AP3[connectDevice]
    AP4[getVersionHistory/postVersionAction]
    AP5[get/save/delete ServiceModel]
  end

  R1 --> AP1
  R2 --> AP2
  R3 --> AP3
  R4 --> AP4
  R5 --> AP5

  subgraph Mocks["Mock Layer (mocks/browser.js)\n(enabled when REACT_APP_ENABLE_MOCKS=true)"]
    M1[/auth login/logout/]
    M2[/map-service/]
    M3[/connect-device/]
    M4[/version-control GET/POST/]
    M5[/service-models CRUD/]
  end

  API -->|fetch()| Mocks
```

## Modules and Responsibilities

- AuthContext
  - Manages token, user, and roles using localStorage.
  - Exposes login, logout, and hasRole helpers.
  - Clears state on global mm:unauthorized events.
- AppRoutes
  - Defines SPA routes and applies ProtectedRoute.
  - Enforcement only when REACT_APP_ENABLE_AUTH="true".
- apiClient
  - Centralizes HTTP requests, adds Authorization header when available.
  - Dispatches mm:unauthorized on 401.
- Mock layer
  - Intercepts fetch when enabled; simulates backend behavior for listed endpoints.

## Data and Endpoints

- Authentication: POST /api/auth/login, POST /api/auth/logout
- Mapping: POST /api/map-service
- Device connection: POST /api/connect-device
- Version control: GET /api/version-control?deviceId=..., POST /api/version-control
- Service model editor: GET/POST/PUT/DELETE /api/service-models

## Notes

- Route access and mocks are entirely driven by environment flags, allowing flexible local development with or without a backend.
- Service Model Editor uses Nunjucks to render previews from templates; actual authoritative rendering/validation should occur on the backend in production environments.
