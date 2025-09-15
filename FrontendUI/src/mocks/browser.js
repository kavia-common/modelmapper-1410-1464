//
// Simple custom fetch mocking bootstrap for testing/demo only.
// IMPORTANT: This is not for production use. It intercepts fetch()
// requests at runtime and returns static example data for the app.
//
// The mocks cover:
 // - POST /api/map-service
 // - POST /api/connect-device
 // - GET /api/version-control?deviceId=..
 // - POST /api/version-control
 // - POST /api/auth/login (to allow LoginPage to work in demo)
 // - POST /api/auth/logout
 // - Service Model storage (GET/POST/PUT/DELETE)
 //   GET    /api/service-models/:id
 //   POST   /api/service-models
 //   PUT    /api/service-models/:id
 //   DELETE /api/service-models/:id
//
// It includes interface and l2vpn yang model sample data, version history,
// and simulated mapping responses.
//

const MOCK_VERSION_HISTORY = [
  { version: "v1.0.0", timestamp: "2024-05-02T09:00:00Z", user: "admin" },
  { version: "v1.1.0", timestamp: "2024-06-10T11:15:00Z", user: "testuser" },
];

const INTERFACE_YANG_MODELS = [
  "ietf-interfaces",
  "ietf-if-extensions",
  "cisco-ietf-interfaces",
];

const L2VPN_YANG_MODELS = [
  "l2vpn",
  "l2vpn-evpn",
  "l2vpn-pseudowire",
];

function makeJsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });
}

function parseBody(body) {
  try {
    return body ? JSON.parse(body) : {};
  } catch (e) {
    return {};
  }
}

// PUBLIC_INTERFACE
export function enableApiMocks() {
  /** Enable API mocks by wrapping global fetch. Test-use only. */
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;

  if (window.__mmMocksEnabled) return;
  window.__mmMocksEnabled = true;

  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url;
    const method = (init.method || "GET").toUpperCase();

    // Normalize for cases where baseUrl may be present
    const { pathOnly, searchPart } = (() => {
      try {
        const u = new URL(url, window.location.origin);
        return { pathOnly: u.pathname, searchPart: u.search || "" };
      } catch {
        // Fallback if URL constructor fails
        return { pathOnly: url || "", searchPart: "" };
      }
    })();
    const path = pathOnly + searchPart;

    // Simple in-memory demo store for service models
    window.__mmServiceModels = window.__mmServiceModels || {};
    const svcStore = window.__mmServiceModels;

    const svcMatch = (p) => {
      // match /api/service-models or /api/service-models/:id
      const base = "/api/service-models";
      if (p === base) return { base: true, id: null };
      if (p.startsWith(base + "/")) {
        const id = decodeURIComponent(p.slice((base + "/").length));
        return { base: false, id };
      }
      return null;
    };

    // LOGIN (mock)
    if (path.startsWith("/api/auth/login") && method === "POST") {
      const body = parseBody(init.body);
      const token = "demo-token";
      return makeJsonResponse({ token, expiresIn: 3600, username: body.username || "user" });
    }

    // LOGOUT (mock)
    if (path.startsWith("/api/auth/logout") && method === "POST") {
      return makeJsonResponse({ ok: true });
    }

    // MAP SERVICE (mock)
    if (path === "/api/map-service" && method === "POST") {
      const body = parseBody(init.body);
      const mappingId = `map-${Math.random().toString(36).slice(2, 8)}`;
      const status = "created";
      const details = `Mapped service ${body?.serviceId} to ${body?.yangModel} for vendor ${body?.vendor}`;
      return makeJsonResponse({ mappingId, status, details });
    }

    // CONNECT DEVICE (mock)
    if (path === "/api/connect-device" && method === "POST") {
      const body = parseBody(init.body);
      const vendor = body?.vendor || "Cisco";

      // Blend some interface and l2vpn YANG with vendor-ish models
      const vendorExtras = {
        Cisco: ["cisco-ios-xr", "cisco-qos", "cisco-routing.submodule"],
        Huawei: ["huawei-ethernet", "huawei-bgp", "huawei-mpls.submodule"],
        Nokia: ["nokia-sros", "nokia-policy", "nokia-isis.submodule"],
      }[vendor] || ["generic-vendor-model"];

      const yangModels = Array.from(
        new Set([...INTERFACE_YANG_MODELS, ...L2VPN_YANG_MODELS, ...vendorExtras])
      );

      return makeJsonResponse({
        connected: true,
        yangModels,
        message: `Connected to ${vendor} device at ${body?.deviceIp || "unknown IP"}`,
      });
    }

    // VERSION CONTROL (GET) - mock history
    if (path.startsWith("/api/version-control?") && method === "GET") {
      const deviceId = (() => {
        try {
          const u = new URL(path, window.location.origin);
          return u.searchParams.get("deviceId") || "device-unknown";
        } catch {
          return "device-unknown";
        }
      })();
      return makeJsonResponse({ deviceId, history: MOCK_VERSION_HISTORY });
    }

    // VERSION CONTROL (POST) - mock actions
    if (path === "/api/version-control" && method === "POST") {
      const body = parseBody(init.body);
      if (body?.action === "revert" && body?.targetVersion) {
        // In a real backend, this would update state; here we just echo success
        return makeJsonResponse({
          deviceId: body.deviceId || "device-unknown",
          history: MOCK_VERSION_HISTORY, // unchanged for demo
          message: `Reverted to ${body.targetVersion}`,
        });
      }
      if (body?.action === "manage") {
        return makeJsonResponse({
          deviceId: body.deviceId || "device-unknown",
          history: MOCK_VERSION_HISTORY,
          message: "Manage action completed",
        });
      }
      // Default: view
      return makeJsonResponse({
        deviceId: body.deviceId || "device-unknown",
        history: MOCK_VERSION_HISTORY,
      });
    }

    // SERVICE MODEL STORAGE (mock CRUD)
    const match = svcMatch(pathOnly);
    if (match && method === "GET" && match.id) {
      const found = svcStore[match.id];
      if (!found) {
        return new Response(JSON.stringify({ error: "NotFound", message: "Service model not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return makeJsonResponse(found);
    }

    if (match && method === "POST" && match.base) {
      const body = parseBody(init.body);
      const id = body?.id || `svc-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const record = { id, model: body?.model || {}, mappings: body?.mappings || {}, updatedAt: now };
      svcStore[id] = record;
      return makeJsonResponse(record, { status: 201 });
    }

    if (match && method === "PUT" && match.id) {
      const body = parseBody(init.body);
      const exists = svcStore[match.id];
      if (!exists) {
        return new Response(JSON.stringify({ error: "NotFound", message: "Service model not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      const now = new Date().toISOString();
      const updated = { id: match.id, model: body?.model || {}, mappings: body?.mappings || {}, updatedAt: now };
      svcStore[match.id] = updated;
      return makeJsonResponse(updated);
    }

    if (match && method === "DELETE" && match.id) {
      const exists = svcStore[match.id];
      if (!exists) {
        return new Response(JSON.stringify({ error: "NotFound", message: "Service model not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      delete svcStore[match.id];
      return makeJsonResponse({ id: match.id, deleted: true });
    }

    // Fallback to real fetch for any other requests
    return realFetch(input, init);
  };
}
