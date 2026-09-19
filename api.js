/**
 * OM SAI — tiny API client + shared UI helpers.
 * Wraps fetch(), attaches JWT automatically, and surfaces
 * a friendly toast when the backend can't be reached.
 */
(function () {
  const BASE = window.OMSAI_CONFIG.API_BASE_URL;

  function getToken() {
    return localStorage.getItem("omsai_token");
  }

  async function request(path, { method = "GET", body, auth = true, headers = {} } = {}) {
    const opts = {
      method,
      headers: { "Content-Type": "application/json", ...headers },
    };
    if (auth && getToken()) {
      opts.headers.Authorization = `Bearer ${getToken()}`;
    }
    if (body !== undefined) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(`${BASE}${path}`, opts);
    } catch (err) {
      throw new ApiError(
        0,
        "Can't reach the OM SAI server. Make sure the backend is running (see backend/README.md) and try again."
      );
    }

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      const message = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
      throw new ApiError(res.status, typeof message === "string" ? message : JSON.stringify(message));
    }
    return data;
  }

  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }

  async function requestForm(path, formData, { method = "POST" } = {}) {
    const opts = { method, headers: {}, body: formData };
    if (getToken()) opts.headers.Authorization = `Bearer ${getToken()}`;
    let res;
    try {
      res = await fetch(`${BASE}${path}`, opts);
    } catch (err) {
      throw new ApiError(0, "Can't reach the OM SAI server. Make sure the backend is running and try again.");
    }
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {}
    if (!res.ok) {
      const message = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
      throw new ApiError(res.status, typeof message === "string" ? message : JSON.stringify(message));
    }
    return data;
  }

  window.Api = {
    get: (path, opts) => request(path, { ...opts, method: "GET" }),
    post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
    put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
    patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
    del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
    postForm: (path, formData, opts) => requestForm(path, formData, opts),
    ApiError,
  };

  /* ---------------- Toasts ---------------- */
  window.toast = function (message, type = "success") {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  };

  /* ---------------- Form message helper ---------------- */
  window.showFormMsg = function (el, message, type = "error") {
    if (!el) return;
    el.textContent = message;
    el.className = `form-msg show ${type}`;
  };

  /* ---------------- Image path resolution ---------------- */
  // Normalizes any image path (from local JS data OR fetched from the
  // backend) so it resolves correctly whether the site is opened via
  // a local server or directly as a file:// page, and whether the
  // current page is at the site root or one folder deep (/services/).
  window.omsaiResolveImg = function (src) {
    if (!src) return src;
    if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src; // full URL — use as-is
    const depth = window.OMSAI_DEPTH || "";
    const clean = src.replace(/^\/+/, ""); // strip any leading slash from older/backend data
    return depth + clean;
  };

  /* ---------------- Formatting ---------------- */
  window.fmtCurrency = function (n) {
    if (n === null || n === undefined || n === "") return "—";
    return "₹" + Number(n).toLocaleString("en-IN");
  };
  window.fmtDate = function (iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  window.fmtDateTime = function (iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
})();
