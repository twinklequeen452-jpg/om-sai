/**
 * OM SAI — Global frontend configuration
 * Change API_BASE_URL when you deploy the backend (see backend/README).
 * Example production value: "https://api.omsaiinteriors.com/api"
 */
window.OMSAI_CONFIG = {
  API_BASE_URL: (function () {
    // Auto-detects a locally running backend during development —
    // covers http://localhost, http://127.0.0.1, AND opening the
    // HTML file directly by double-click (file:// has no hostname).
    const isLocal =
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.protocol === "file:";
    if (isLocal) {
      return "http://localhost:8000/api";
    }
    // 👉 Replace with your deployed backend URL before going live.
    return "https://YOUR-BACKEND-DOMAIN.com/api";
  })(),
  BRAND: "OM SAI Interiors & Construction",
  WHATSAPP_NUMBER: "91 9880435504",
  SUPPORT_PHONE: "+91 9880435504",
  SUPPORT_EMAIL: "sitaramran504@gmile.com",
};
