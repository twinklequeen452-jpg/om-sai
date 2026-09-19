/**
 * OM SAI — "My Account" customer dashboard.
 * Pulls the logged-in user's profile plus a short preview of their
 * bookings, quotations, invoices and payments. Full lists still live
 * on their dedicated pages — this is just the at-a-glance hub.
 */
(function () {
  if (!Auth.requireAuth()) return;
  // Admins land on the admin dashboard instead — this page is for customers.
  if (Auth.isAdmin()) {
    location.href = "admin-dashboard.html";
    return;
  }

  const user = Auth.getUser();
  if (user) {
    document.getElementById("dash-heading").textContent = `Welcome back, ${user.full_name.split(" ")[0]}`;
    document.getElementById("profile-name").textContent = user.full_name;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-phone").textContent = user.phone || "—";
    document.getElementById("profile-since").textContent = fmtDate(user.created_at);
  }
  // Refresh from server in case the cached profile is stale.
  Auth.refreshProfile().then((fresh) => {
    if (!fresh) return;
    document.getElementById("dash-heading").textContent = `Welcome back, ${fresh.full_name.split(" ")[0]}`;
    document.getElementById("profile-name").textContent = fresh.full_name;
    document.getElementById("profile-email").textContent = fresh.email;
    document.getElementById("profile-phone").textContent = fresh.phone || "—";
    document.getElementById("profile-since").textContent = fmtDate(fresh.created_at);
  });

  async function loadBookings() {
    try {
      const items = (await Api.get("/bookings/me")).slice(0, 3);
      const body = document.getElementById("recent-bookings");
      if (!items.length) {
        document.getElementById("bookings-empty").style.display = "block";
        return;
      }
      body.innerHTML = items
        .map((b) => `<tr><td>${b.category} — ${b.sub_service}</td><td>${fmtDate(b.preferred_date)}</td><td><span class="badge badge-${b.status}">${b.status}</span></td></tr>`)
        .join("");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function loadQuotations() {
    try {
      const items = (await Api.get("/quotations/me")).slice(0, 3);
      const body = document.getElementById("recent-quotations");
      if (!items.length) {
        document.getElementById("quotations-empty").style.display = "block";
        return;
      }
      body.innerHTML = items
        .map((q) => `<tr><td>${q.category} — ${q.sub_service}</td><td><span class="badge badge-${q.status}">${q.status}</span></td></tr>`)
        .join("");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function loadInvoices() {
    try {
      const items = (await Api.get("/invoices/me")).slice(0, 3);
      const body = document.getElementById("recent-invoices");
      if (!items.length) {
        document.getElementById("invoices-empty").style.display = "block";
        return;
      }
      body.innerHTML = items
        .map((inv) => `<tr><td>#OMS-${String(inv.id).padStart(4, "0")}</td><td>${fmtCurrency(inv.total)}</td><td><span class="badge badge-${inv.status}">${inv.status}</span></td></tr>`)
        .join("");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function loadPayments() {
    try {
      const items = (await Api.get("/payments/me")).slice(0, 3);
      const body = document.getElementById("recent-payments");
      if (!items.length) {
        document.getElementById("payments-empty").style.display = "block";
        return;
      }
      body.innerHTML = items
        .map((p) => `<tr><td>${p.method}</td><td>${fmtCurrency(p.amount)}</td><td><span class="badge badge-${p.status}">${p.status}</span></td></tr>`)
        .join("");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  loadBookings();
  loadQuotations();
  loadInvoices();
  loadPayments();
})();
