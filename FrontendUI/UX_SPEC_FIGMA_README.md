# ModelMapper Frontend UI – Figma-Ready Visual and Layout Specification

This document defines the visual structure, components, interactions, and responsive behavior for the ModelMapper Frontend UI, enabling designers to recreate the UI in Figma.

## 1. Global

- Grid:
  - Desktop ≥1200px: 12-col, 24px gutters, 72px max page gutters (36px each side), max width 1280.
  - Tablet 600–1199px: 8-col, 24px gutters, 24px page padding.
  - Mobile <600px: 4-col, 16px gutters, 16px page padding.

- Typography:
  - H1 32px, H2 24px, H3 20px, Body 16px, Caption 12–14px, Code 13px.
  - Font: System UI stack.

- Colors (Tokens):
  - Light: bg-primary #ffffff, bg-secondary #f8f9fa, text-primary #282c34, text-secondary #0d6efd, border #e9ecef, primary #0d6efd.
  - Dark: bg-primary #1a1a1a, bg-secondary #282c34, text-primary #ffffff, text-secondary #61dafb, border #404040, primary #0d6efd.
  - Feedback: success #3c763d, warn #8a6d3b, error #a94442, info #0d6efd.

- Components (base styles):
  - Buttons: radius 8px; Primary (filled primary), Secondary (outline primary), Ghost (transparent).
  - Inputs: 6px radius, 1px border, 8px padding; focus ring 2px primary with 20% alpha.
  - Cards/Panels: 8px radius, 1px border; internal padding 12–16px.
  - Navbar: 56px height, sticky, bg var(--bg-secondary), border-bottom 1px.

- Accessibility:
  - Visible focus for all interactive elements.
  - ARIA labels for icons and drag targets.
  - Keyboard parity for drag-and-drop (Enter adds item).

- Iconography:
  - Placeholder glyphs: ☰ (hamburger), 🌙/☀️ (theme), ✕ (remove). Replace with a consistent icon set in final comps.

## 2. Screens

### 2.1 Login (/login)
- Layout:
  - Navbar (unauthenticated): left brand “ModelMapper”, right theme toggle + disabled Login button.
  - Center card (max 420px):
    - H2 “Login”.
    - Username (label top) and Password (label top).
    - Primary button “Login”.
    - Error alert row (hidden until error).
    - Optional links (12–14px): “Forgot password?”, “Need access?”.
- Spacing: 40–72px from navbar to card.
- States: Loading “Signing in…”, Error alert.
- Responsive: Card full width minus padding on mobile; button full width.

### 2.2 Mapping Studio (/)
- Purpose: Map services to vendor YANG models/submodules.
- Header:
  - H2 “Mapping Studio”.
  - Two-field row:
    - Vendor selector (label “Vendor”).
    - Service ID input (label “Service ID”, placeholder “Enter Service ID”).
- Main area (two columns):
  - Left panel “Available Models”:
    - Header with title and search input “Filter models…”.
    - Scrollable list; items are pill cards with:
      - Title (module/submodule), optional “submodule” badge for *.submodule.
      - Drag affordance (⋮⋮) or use entire row as draggable.
      - Keyboard: focusable; Enter adds item.
  - Right panel “Mapping Target”:
    - Dashed dropzone; empty state “Drag items here”.
    - Mapped items list with name + remove ✕.
    - Footer: Secondary “Clear”, Primary “Map Service”.
    - Feedback strip (role=status) for success/warn/error messages.
- Interaction:
  - Prevent duplicates with warning “Already added.”.
  - Validation on Map: require vendor, service ID, ≥1 item; inline errors in right panel.
- Responsive:
  - Stack panels on mobile; buttons full width.

### 2.3 Connect Device (/connect)
- Header: H2 “Connect Device”.
- Form (card, max 900px, 2-col):
  - Device IP, Vendor, Username, Password (all labeled, required).
  - Actions: Primary “Connect” + inline error alert.
- Results (below form):
  - H3 “Device Status”: Connected Yes/No, message line.
  - H4 “Retrieved YANG Models”: scrollable list (add search if long).
  - Optional CTA (future): “Use in Mapping Studio”.
- States: Loading “Connecting…”, Error alert.
- Responsive: Collapse to one column below 900px; full-width actions.

### 2.4 Version Control (/versions)
- Header:
  - H2 “Version Control”.
  - Controls row: Device ID, “Load History” (primary), “Manage” (secondary), status message.
- Content:
  - Empty: “No history” card.
  - Table:
    - Columns: Version | Timestamp | User | Actions.
    - Revert button opens confirm modal (“Revert to version X?”).
  - Post actions: Inline feedback success/error; refresh list.
- Mobile:
  - Table becomes card-list:
    - Card title: Version.
    - Meta: Timestamp, User.
    - Action: “Revert” full width.

### 2.5 Unauthorized (/unauthorized)
- Simple content with H2 “Unauthorized”, message, and link back to login/home.

## 3. Global Navigation & Flows

- Navbar (authenticated):
  - Left: ☰ (toggles menu on small screens), brand.
  - Center/Inline: Links “Mapping Studio”, “Connect Device”, “Version Control”.
  - Right: Theme toggle, user chip “username (roles)”, Logout.
- Unauthenticated:
  - Shows brand, theme toggle, Login button.
- Redirects:
  - Protected routes redirect to /login when unauthenticated.

## 4. Drag-and-Drop Details

- Left item states:
  - Default: bordered chip.
  - Hover: slightly darker bg.
  - Dragging: elevation/shadow, 10% tinted bg.
- Dropzone:
  - Default: dashed border.
  - Drag-over: border + tint in primary color.
- Keyboard:
  - Focus ring; Enter adds item.
  - Remove buttons tab-focusable with label “Remove {name}”.
- Announcements:
  - Use role=status for messages: “Item added.”, “Already added.”, “Select a vendor first.”, “Add at least one…”.

## 5. Modals

- Confirm Revert:
  - Title: “Revert to version X?”
  - Body: impact note.
  - Primary: “Confirm Revert”.
  - Secondary: “Cancel”.

## 6. Responsive Breakpoints

- ≥1200px: Two-column boards and forms, fixed-width containers.
- 900–1199px: Two columns retained where possible.
- 600–899px: Forms may drop to single column.
- <600px: Stacked panels, full-width controls and actions.

## 7. Figma Deliverables

Create the following frames:
1) 1440 Desktop – Login
2) 1440 Desktop – Mapping Studio (with populated lists and success feedback)
3) 1440 Desktop – Connect Device (connected with models)
4) 1440 Desktop – Version Control (history table with modal)
5) 768 Tablet – Mapping Studio (stacked)
6) 375 Mobile – Mapping Studio (stacked)
7) Component Library – Buttons, Inputs, Navbar (variants), Panels, Table + Mobile Card, Drag Item (variants), Alerts, Modal, Empty States
8) Design Tokens – Colors, Typography, Spacing, Radii, Shadows

## 8. Notes for Designers

- Use Auto Layout (vertical stacks for forms; horizontal for action bars).
- Keep consistent spacing: 8/12/16/24 increments.
- Ensure WCAG AA contrast in both themes.
- Organize layers: e.g., “MappingStudio/LeftPanel/Item”.
- Provide redline specs (padding/margins) for developer handoff.
- Add interaction notes for hover, focus, pressed, disabled, loading.

## 9. Future Enhancements (Optional)

- “Send to Mapping Studio” from Connect Device.
- Role-based restrictions (disable/manage buttons for non-admin).
- Virtualized lists for very large model sets.
- Collapsible groups for modules/submodules.
- Multi-user presence indicators.

