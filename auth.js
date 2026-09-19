/**
 * OM SAI — session helpers.
 * Token + user profile are cached in localStorage after login
 * so every page can render nav state without an extra request.
 */
window.Auth = (function () {
  const TOKEN_KEY = "omsai_token";
  const USER_KEY = "omsai_user";

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch (_) {
      return null;
    }
  }
  function isLoggedIn() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
  function isAdmin() {
    const u = getUser();
    return !!u && u.role === "admin";
  }
  async function signup({ full_name, email, phone, password }) {
    const data = await Api.post("/auth/signup", { full_name, email, phone, password }, { auth: false });
    setSession(data.access_token, data.user);
    return data;
  }
  async function login({ email, password }) {
    const data = await Api.post("/auth/login", { email, password }, { auth: false });
    setSession(data.access_token, data.user);
    return data;
  }
  async function forgotPassword(email) {
    return Api.post("/auth/forgot-password", { email }, { auth: false });
  }
  function logout(redirect = "index.html") {
    clearSession();
    const depth = location.pathname.includes("/services/") ? "../" : "";
    location.href = depth + redirect;
  }
  /** Refresh cached profile from the server (call on protected pages). */
  async function refreshProfile() {
    if (!isLoggedIn()) return null;
    try {
      const user = await Api.get("/auth/me");
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (err) {
      if (err.status === 401) clearSession();
      return null;
    }
  }
  /** Redirect to login if not authenticated. Call at top of protected pages. */
  function requireAuth(depth = "") {
    if (!isLoggedIn()) {
      location.href = depth + "login.html?next=" + encodeURIComponent(location.pathname);
      return false;
    }
    return true;
  }
  function requireAdmin(depth = "") {
    if (!requireAuth(depth)) return false;
    if (!isAdmin()) {
      toast("That page is for the OM SAI admin team only.", "error");
      location.href = depth + "index.html";
      return false;
    }
    return true;
  }

  return {
    setSession, clearSession, getUser, isLoggedIn, isAdmin,
    signup, login, forgotPassword, logout, refreshProfile,
    requireAuth, requireAdmin,
  };
})();
