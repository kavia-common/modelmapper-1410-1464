//
// API client for ModelMapper Frontend, handling JWT auth, base URL, and endpoints
//

// PUBLIC_INTERFACE
export class ApiClient {
  /** API client handling base URL, JWT, and endpoint calls */
  constructor({ baseUrl, getToken, onUnauthorized } = {}) {
    // Base URL is taken from environment variable if provided
    this.baseUrl =
      baseUrl ||
      (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE_URL) ||
      "";
    this.getToken = getToken || (() => localStorage.getItem("mm_token"));
    this.onUnauthorized = onUnauthorized || (() => {});
  }

  async request(path, { method = "GET", body, headers = {}, auth = true } = {}) {
    const url = `${this.baseUrl}${path}`;
    const requestHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (auth) {
      const token = this.getToken && this.getToken();
      if (token) requestHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      // Token invalid/expired
      this.onUnauthorized();
      throw new Error("Unauthorized");
    }

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errMsg =
        (isJson && (data.message || data.error)) ||
        `Request failed with status ${response.status}`;
      const error = new Error(errMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  // PUBLIC_INTERFACE
  async login({ username, password }) {
    /** Login endpoint - returns token and expiry */
    return this.request("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { username, password },
    });
  }

  // PUBLIC_INTERFACE
  async logout() {
    /** Logout endpoint */
    return this.request("/api/auth/logout", {
      method: "POST",
      auth: true,
    });
  }

  // PUBLIC_INTERFACE
  async mapService({ serviceId, vendor, yangModel }) {
    /** Map service to YANG model */
    return this.request("/api/map-service", {
      method: "POST",
      body: { serviceId, vendor, yangModel },
    });
  }

  // PUBLIC_INTERFACE
  async connectDevice({ deviceIp, vendor, credentials }) {
    /** Connect device and retrieve YANG models */
    return this.request("/api/connect-device", {
      method: "POST",
      body: { deviceIp, vendor, credentials },
    });
  }

  // PUBLIC_INTERFACE
  async getVersionHistory({ deviceId }) {
    /** Get device model version history */
    const qp = new URLSearchParams({ deviceId });
    return this.request(`/api/version-control?${qp.toString()}`, {
      method: "GET",
    });
  }

  // PUBLIC_INTERFACE
  async versionControlAction({ deviceId, action, targetVersion }) {
    /** Perform version control action */
    return this.request("/api/version-control", {
      method: "POST",
      body: { deviceId, action, targetVersion },
    });
  }
}

const defaultClient = new ApiClient({
  onUnauthorized: () => {
    localStorage.removeItem("mm_token");
    localStorage.removeItem("mm_user");
    // Let app decide navigation; a global event can be dispatched if desired
    window.dispatchEvent(new CustomEvent("mm:unauthorized"));
  },
});

// PUBLIC_INTERFACE
export const apiClient = defaultClient;
