/**
 * OM SAI — shared header + footer.
 * Injected via JS so every page (including /services/*.html, one
 * folder deeper) stays in sync without duplicating markup 17 times.
 * Set `window.OMSAI_DEPTH = "../"` before this script on pages
 * that live inside /services/, and `document.body.dataset.page`
 * to highlight the active nav link.
 */
(function () {
  const depth = window.OMSAI_DEPTH || "";
  const page = document.body.dataset.page || "";
  const user = window.Auth ? Auth.getUser() : null;
  const loggedIn = window.Auth ? Auth.isLoggedIn() : false;

  const nav = [
    ["home.html-alias", "index.html", "Home"],
    ["services", "services.html", "Services"],
    ["book", "book-services.html", "Book Services"],
    ["quotations", "quotations.html", "Quotations"],
    ["bills", "bills-invoices.html", "Bills"],
    ["payments", "payments.html", "Payments"],
    ["about", "about.html", "About Us"],
    ["contact", "contact.html", "Contact Us"],
  ];

  const navLinks = nav
    .map(([key, href, label]) => {
      const active = page === key || (key === "home.html-alias" && page === "home");
      return `<a href="${depth}${href}" class="${active ? "active" : ""}">${label}</a>`;
    })
    .join("");

  const authActions = loggedIn
    ? `
      <a href="${depth}${user && user.role === "admin" ? "admin-dashboard.html" : "dashboard.html"}" class="nav-user" style="text-decoration:none">${(user && user.full_name) || "Account"}${user && user.role === "admin" ? " (Owner)" : ""}</a>
      <button class="btn btn-outline btn-sm" id="omsai-logout-btn" type="button">Log out</button>
    `
    : `
      <a href="${depth}login.html" class="btn btn-primary btn-sm">Log In / Sign Up</a>
    `;

  const headerEl = document.getElementById("site-header");
  if (headerEl) {
    headerEl.innerHTML = `
      <div class="nav">
        <a href="${depth}index.html" class="brand">OM SAI <span>Interiors</span></a>
        <nav class="nav-links" id="omsai-nav-links">${navLinks}</nav>
        <div class="nav-actions">${authActions}</div>
        <button class="nav-toggle" id="omsai-nav-toggle" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    `;
    const toggle = document.getElementById("omsai-nav-toggle");
    const links = document.getElementById("omsai-nav-links");
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    const logoutBtn = document.getElementById("omsai-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => Auth.logout(depth + "index.html"));
    }
  }

  const footerEl = document.getElementById("site-footer");
  if (footerEl) {
    const year = new Date().getFullYear();
    footerEl.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="${depth}index.html" class="brand" style="color:var(--white)">OM SAI <span>Interiors</span></a>
            <p>Interior design and end-to-end construction services — designed with care, built to last, priced fairly.</p>
            <div class="footer-social">
              <a href="#" aria-label="Instagram">IG</a>
              <a href="#" aria-label="Facebook">FB</a>
              <a href="#" aria-label="YouTube">YT</a>
            </div>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="${depth}about.html">About Us</a></li>
              <li><a href="${depth}services.html">Services</a></li>
              <li><a href="${depth}contact.html">Contact</a></li>
              <li><a href="${depth}login.html?tab=owner">Owner Login</a></li>
            </ul>
          </div>
          <div>
            <h4>Services</h4>
            <ul>
              <li><a href="${depth}services/interior-designing.html">Interior Designing</a></li>
              <li><a href="${depth}services/painting-services.html">Painting</a></li>
              <li><a href="${depth}services/electrician-services.html">Electrician</a></li>
              <li><a href="${depth}services/granite-work.html">Granite Work</a></li>
            </ul>
          </div>
          <div>
            <h4>Get in touch</h4>
            <ul>
              <li>${window.OMSAI_CONFIG.SUPPORT_PHONE}</li>
              <li>${window.OMSAI_CONFIG.SUPPORT_EMAIL}</li>
              <li>Mon–Sat, 9:00 AM – 7:00 PM</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${year} OM SAI Interiors &amp; Construction. All rights reserved.</span>
          <span>Crafted with care in India.</span>
        </div>
      </div>
    `;
  }

  // WhatsApp floating button on every page
  if (!document.querySelector(".whatsapp-fab")) {
    const fab = document.createElement("a");
    fab.className = "whatsapp-fab";
    fab.href = `https://wa.me/${window.OMSAI_CONFIG.WHATSAPP_NUMBER}`;
    fab.target = "_blank";
    fab.rel = "noopener";
    fab.setAttribute("aria-label", "Chat on WhatsApp");
    fab.textContent = "💬";
    document.body.appendChild(fab);
  }
})();
