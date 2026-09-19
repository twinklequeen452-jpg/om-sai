/**
 * OM SAI — Admin Dashboard.
 * Single-page tabbed dashboard covering every admin feature from the
 * spec: users, bookings, services, payments, quotations, invoices,
 * gallery and analytics. Requires an authenticated admin account.
 */
(function () {
  if (!Auth.requireAdmin()) return;

  const tabs = document.querySelectorAll(".dash-tab");
  const panels = document.querySelectorAll(".dash-panel");
  const modalOverlay = document.getElementById("admin-modal");
  const modalBody = document.getElementById("admin-modal-body");

  document.getElementById("admin-username").textContent = (Auth.getUser() || {}).full_name || "Admin";

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => (p.style.display = "none"));
      tab.classList.add("active");
      const panel = document.getElementById(`panel-${tab.dataset.tab}`);
      if (panel) panel.style.display = "block";
      loadPanel(tab.dataset.tab);
    });
  });

  function openModal(html) {
    modalBody.innerHTML = html;
    modalOverlay.classList.add("open");
  }
  function closeModal() {
    modalOverlay.classList.remove("open");
    modalBody.innerHTML = "";
  }
  document.getElementById("admin-modal-close").addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  window.omsaiCloseModal = closeModal;

  const loaders = {
    analytics: loadAnalytics,
    users: loadUsers,
    bookings: loadBookings,
    services: loadServices,
    payments: loadPayments,
    quotations: loadQuotations,
    invoices: loadInvoices,
    gallery: loadGallery,
  };
  function loadPanel(name) {
    if (loaders[name]) loaders[name]();
  }

  /* ================= ANALYTICS ================= */
  async function loadAnalytics() {
    const el = document.getElementById("panel-analytics");
    try {
      const s = await Api.get("/admin/stats");
      el.innerHTML = `
        <div class="stat-grid">
          <div class="stat-card"><div class="label">Total users</div><div class="value">${s.total_users}</div></div>
          <div class="stat-card"><div class="label">Total bookings</div><div class="value">${s.total_bookings}</div></div>
          <div class="stat-card"><div class="label">Total revenue</div><div class="value">${fmtCurrency(s.total_revenue)}</div></div>
          <div class="stat-card"><div class="label">This month</div><div class="value">${fmtCurrency(s.monthly_revenue)}</div></div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Popular services</h3></div>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Service</th><th>Bookings</th></tr></thead>
            <tbody>${
              s.popular_services.length
                ? s.popular_services.map((p) => `<tr><td>${p.category} — ${p.sub_service}</td><td>${p.count}</td></tr>`).join("")
                : `<tr><td colspan="2">No bookings yet.</td></tr>`
            }</tbody>
          </table></div>
        </div>`;
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }

  /* ================= USERS ================= */
  async function loadUsers() {
    const body = document.getElementById("users-table-body");
    try {
      const users = await Api.get("/admin/users");
      body.innerHTML = users
        .map(
          (u) => `
        <tr>
          <td>#${u.id}</td><td>${u.full_name}</td><td>${u.email}</td><td>${u.phone || "—"}</td>
          <td><span class="badge ${u.role === "admin" ? "badge-approved" : "badge-pending"}">${u.role}</span></td>
          <td>${fmtDate(u.created_at)}</td>
          <td>${u.role !== "admin" ? `<button class="btn btn-danger btn-sm" data-del-user="${u.id}">Delete</button>` : "—"}</td>
        </tr>`
        )
        .join("");
      body.querySelectorAll("[data-del-user]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this user? This cannot be undone.")) return;
          try {
            await Api.del(`/admin/users/${btn.dataset.delUser}`);
            toast("User deleted");
            loadUsers();
          } catch (err) {
            toast(err.message, "error");
          }
        })
      );
    } catch (err) {
      body.innerHTML = `<tr><td colspan="7">${err.message}</td></tr>`;
    }
  }

  /* ================= BOOKINGS ================= */
  async function loadBookings() {
    const body = document.getElementById("bookings-table-body");
    try {
      const bookings = await Api.get("/admin/bookings");
      body.innerHTML = bookings.length
        ? bookings
            .map(
              (b) => `
        <tr>
          <td>#${b.id}</td><td>${b.full_name}<br><span class="eyebrow">${b.phone}</span></td>
          <td>${b.category} — ${b.sub_service}</td><td>${fmtDate(b.preferred_date)}</td>
          <td><span class="badge badge-${b.status}">${b.status}</span></td>
          <td>
            <select class="form-control booking-status" data-id="${b.id}" style="padding:6px 8px;font-size:.8rem">
              ${["pending", "approved", "rejected", "completed"]
                .map((s) => `<option value="${s}" ${s === b.status ? "selected" : ""}>${s}</option>`)
                .join("")}
            </select>
          </td>
        </tr>`
            )
            .join("")
        : `<tr><td colspan="6">No bookings yet.</td></tr>`;
      body.querySelectorAll(".booking-status").forEach((sel) =>
        sel.addEventListener("change", async () => {
          try {
            await Api.patch(`/admin/bookings/${sel.dataset.id}`, { status: sel.value });
            toast("Booking updated");
            loadBookings();
          } catch (err) {
            toast(err.message, "error");
          }
        })
      );
    } catch (err) {
      body.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
    }
  }

  /* ================= SERVICES (categories & subcategories) ================= */
  async function loadServices() {
    const wrap = document.getElementById("services-admin-wrap");
    try {
      const cats = await Api.get("/services", { auth: false });
      wrap.innerHTML = cats
        .map(
          (c) => `
        <div class="panel">
          <div class="panel-head">
            <div><strong>${c.title}</strong> <span class="eyebrow">/${c.slug}</span></div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-outline btn-sm" data-edit-cat="${c.slug}">Edit category</button>
              <button class="btn btn-primary btn-sm" data-add-sub="${c.slug}">Add sub-service</button>
              <button class="btn btn-danger btn-sm" data-del-cat="${c.slug}">Delete</button>
            </div>
          </div>
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Sub-service</th><th>Price</th><th></th></tr></thead>
            <tbody>
              ${c.subcategories
                .map(
                  (s) => `
                <tr>
                  <td>${s.name}</td><td>${s.price}</td>
                  <td style="display:flex;gap:6px">
                    <button class="btn btn-ghost btn-sm" data-edit-sub="${c.slug}:${s.id}">Edit</button>
                    <button class="btn btn-danger btn-sm" data-del-sub="${c.slug}:${s.id}">Delete</button>
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table></div>
        </div>`
        )
        .join("");
      wireServiceButtons(cats);
    } catch (err) {
      wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }

  function categoryFormHtml(existing) {
    return `
      <h3>${existing ? "Edit" : "Add"} category</h3>
      <form id="cat-form">
        <div class="form-group"><label>Title</label><input class="form-control" name="title" required value="${existing ? existing.title : ""}"></div>
        <div class="form-group"><label>Slug (URL, e.g. interior-designing)</label><input class="form-control" name="slug" required ${existing ? "readonly" : ""} value="${existing ? existing.slug : ""}"></div>
        <div class="form-group"><label>Tagline</label><input class="form-control" name="tagline" value="${existing ? existing.tagline : ""}"></div>
        <div class="form-group"><label>Intro</label><textarea class="form-control" name="intro">${existing ? existing.intro : ""}</textarea></div>
        <div class="form-group"><label>Hero image URL</label><input class="form-control" name="hero" value="${existing ? existing.hero : ""}"></div>
        <button class="btn btn-primary btn-block" type="submit">Save category</button>
      </form>`;
  }
  function subFormHtml(slug, existing) {
    return `
      <h3>${existing ? "Edit" : "Add"} sub-service</h3>
      <form id="sub-form">
        <div class="form-group"><label>Name</label><input class="form-control" name="name" required value="${existing ? existing.name : ""}"></div>
        <div class="form-group"><label>Description</label><textarea class="form-control" name="desc">${existing ? existing.desc : ""}</textarea></div>
        <div class="form-group"><label>Benefits (comma-separated)</label><input class="form-control" name="benefits" value="${existing ? (existing.benefits || []).join(", ") : ""}"></div>
        <div class="form-group"><label>Indicative price</label><input class="form-control" name="price" value="${existing ? existing.price : ""}"></div>
        <div class="form-group"><label>Image URL</label><input class="form-control" name="img" value="${existing ? existing.img : ""}"></div>
        <button class="btn btn-primary btn-block" type="submit">Save sub-service</button>
      </form>`;
  }

  function wireServiceButtons(cats) {
    document.querySelectorAll("[data-edit-cat]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const cat = cats.find((c) => c.slug === btn.dataset.editCat);
        openModal(categoryFormHtml(cat));
        document.getElementById("cat-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = Object.fromEntries(new FormData(e.target));
          try {
            await Api.put(`/admin/services/${cat.slug}`, fd);
            toast("Category updated");
            closeModal();
            loadServices();
          } catch (err) {
            toast(err.message, "error");
          }
        });
      })
    );
    document.querySelectorAll("[data-del-cat]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this whole category?")) return;
        try {
          await Api.del(`/admin/services/${btn.dataset.delCat}`);
          toast("Category deleted");
          loadServices();
        } catch (err) {
          toast(err.message, "error");
        }
      })
    );
    document.querySelectorAll("[data-add-sub]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const slug = btn.dataset.addSub;
        openModal(subFormHtml(slug, null));
        document.getElementById("sub-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = Object.fromEntries(new FormData(e.target));
          fd.benefits = fd.benefits.split(",").map((s) => s.trim()).filter(Boolean);
          try {
            await Api.post(`/admin/services/${slug}/subcategories`, fd);
            toast("Sub-service added");
            closeModal();
            loadServices();
          } catch (err) {
            toast(err.message, "error");
          }
        });
      })
    );
    document.querySelectorAll("[data-edit-sub]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const [slug, id] = btn.dataset.editSub.split(":");
        const cat = cats.find((c) => c.slug === slug);
        const sub = cat.subcategories.find((s) => String(s.id) === id);
        openModal(subFormHtml(slug, sub));
        document.getElementById("sub-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = Object.fromEntries(new FormData(e.target));
          fd.benefits = fd.benefits.split(",").map((s) => s.trim()).filter(Boolean);
          try {
            await Api.put(`/admin/services/${slug}/subcategories/${id}`, fd);
            toast("Sub-service updated");
            closeModal();
            loadServices();
          } catch (err) {
            toast(err.message, "error");
          }
        });
      })
    );
    document.querySelectorAll("[data-del-sub]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const [slug, id] = btn.dataset.delSub.split(":");
        if (!confirm("Delete this sub-service?")) return;
        try {
          await Api.del(`/admin/services/${slug}/subcategories/${id}`);
          toast("Sub-service deleted");
          loadServices();
        } catch (err) {
          toast(err.message, "error");
        }
      })
    );
    document.getElementById("add-category-btn").onclick = () => {
      openModal(categoryFormHtml(null));
      document.getElementById("cat-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        try {
          await Api.post("/admin/services", fd);
          toast("Category added");
          closeModal();
          loadServices();
        } catch (err) {
          toast(err.message, "error");
        }
      });
    };
  }

  /* ================= PAYMENTS ================= */
  async function loadPayments() {
    const body = document.getElementById("payments-table-body");
    try {
      const payments = await Api.get("/admin/payments");
      body.innerHTML = payments.length
        ? payments
            .map(
              (p) => `
        <tr>
          <td>#${p.id}</td><td>${p.user_name}</td><td>${p.method}</td><td>${fmtCurrency(p.amount)}</td>
          <td>${p.transaction_id}</td>
          <td>${p.screenshot_url ? `<a href="${p.screenshot_url}" target="_blank" rel="noopener">View</a>` : "—"}</td>
          <td><span class="badge badge-${p.status}">${p.status}</span></td>
          <td style="display:flex;gap:6px">
            ${p.status === "pending" ? `<button class="btn btn-primary btn-sm" data-verify="${p.id}">Verify</button><button class="btn btn-danger btn-sm" data-reject-pay="${p.id}">Reject</button>` : "—"}
          </td>
        </tr>`
            )
            .join("")
        : `<tr><td colspan="8">No payments submitted yet.</td></tr>`;
      body.querySelectorAll("[data-verify]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          try {
            await Api.patch(`/admin/payments/${btn.dataset.verify}`, { status: "verified" });
            toast("Payment verified");
            loadPayments();
          } catch (err) {
            toast(err.message, "error");
          }
        })
      );
      body.querySelectorAll("[data-reject-pay]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          try {
            await Api.patch(`/admin/payments/${btn.dataset.rejectPay}`, { status: "rejected" });
            toast("Payment rejected");
            loadPayments();
          } catch (err) {
            toast(err.message, "error");
          }
        })
      );
    } catch (err) {
      body.innerHTML = `<tr><td colspan="8">${err.message}</td></tr>`;
    }
  }

  /* ================= QUOTATIONS ================= */
  async function loadQuotations() {
    const wrap = document.getElementById("quotations-admin-wrap");
    try {
      const items = await Api.get("/admin/quotations");
      wrap.innerHTML = items.length
        ? items
            .map(
              (q) => `
        <div class="panel">
          <div class="panel-head">
            <div><strong>${q.user_name}</strong> — ${q.category} / ${q.sub_service}
              <div class="eyebrow" style="margin-top:6px">${fmtDate(q.created_at)} · Budget: ${q.budget_range || "—"}</div>
            </div>
            <span class="badge badge-${q.status}">${q.status}</span>
          </div>
          <p style="color:#5A5140;font-size:.9rem">${q.requirements || "No notes"}</p>
          <form class="quote-form" data-id="${q.id}">
            <div class="form-row">
              <div class="form-group"><label>Quoted amount (₹)</label><input class="form-control" name="quoted_amount" type="number" value="${q.quoted_amount || ""}" required></div>
              <div class="form-group"><label>Valid until</label><input class="form-control" name="valid_until" type="date" value="${q.valid_until ? q.valid_until.substring(0,10) : ""}"></div>
            </div>
            <div class="form-group"><label>Notes to customer</label><textarea class="form-control" name="admin_notes">${q.admin_notes || ""}</textarea></div>
            <button class="btn btn-primary btn-sm" type="submit">Send quotation</button>
          </form>
        </div>`
            )
            .join("")
        : `<div class="empty-state">No quotation requests yet.</div>`;
      wrap.querySelectorAll(".quote-form").forEach((f) =>
        f.addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = Object.fromEntries(new FormData(e.target));
          try {
            await Api.patch(`/admin/quotations/${f.dataset.id}`, { ...fd, status: "sent" });
            toast("Quotation sent to customer");
            loadQuotations();
          } catch (err) {
            toast(err.message, "error");
          }
        })
      );
    } catch (err) {
      wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }

  /* ================= INVOICES ================= */
  async function loadInvoices() {
    const wrap = document.getElementById("invoices-admin-wrap");
    try {
      const [invoices, users] = await Promise.all([Api.get("/admin/invoices"), Api.get("/admin/users")]);
      wrap.innerHTML = `
        <div class="panel">
          <div class="panel-head"><h3>Generate new invoice</h3></div>
          <form id="invoice-form">
            <div class="form-group"><label>Customer</label>
              <select class="form-control" name="user_id" required>
                <option value="">Select customer</option>
                ${users.filter((u) => u.role !== "admin").map((u) => `<option value="${u.id}">${u.full_name} (${u.email})</option>`).join("")}
              </select>
            </div>
            <div id="invoice-items"></div>
            <button type="button" class="btn btn-ghost btn-sm" id="add-item-row">+ Add line item</button>
            <div style="margin-top:18px"><button class="btn btn-primary" type="submit">Generate invoice</button></div>
          </form>
        </div>
        <div id="invoice-list-admin"></div>`;

      const itemsWrap = document.getElementById("invoice-items");
      function addItemRow() {
        const row = document.createElement("div");
        row.className = "form-row item-row";
        row.style.marginTop = "10px";
        row.innerHTML = `
          <div class="form-group"><input class="form-control" placeholder="Description" name="desc" required></div>
          <div class="form-group" style="display:flex;gap:10px">
            <input class="form-control" placeholder="Qty" name="qty" type="number" min="1" value="1" required>
            <input class="form-control" placeholder="Rate (₹)" name="rate" type="number" min="0" required>
          </div>`;
        itemsWrap.appendChild(row);
      }
      addItemRow();
      document.getElementById("add-item-row").addEventListener("click", addItemRow);

      document.getElementById("invoice-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const user_id = e.target.user_id.value;
        const items = Array.from(itemsWrap.querySelectorAll(".item-row")).map((row) => ({
          description: row.querySelector('[name="desc"]').value,
          qty: Number(row.querySelector('[name="qty"]').value),
          rate: Number(row.querySelector('[name="rate"]').value),
        }));
        try {
          await Api.post("/admin/invoices", { user_id: Number(user_id), items });
          toast("Invoice generated");
          loadInvoices();
        } catch (err) {
          toast(err.message, "error");
        }
      });

      document.getElementById("invoice-list-admin").innerHTML = invoices.length
        ? `<div class="table-wrap"><table class="data-table">
            <thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Status</th><th>Issued</th><th></th></tr></thead>
            <tbody>
              ${invoices
                .map(
                  (inv) => `
                <tr>
                  <td>OMS-${String(inv.id).padStart(4, "0")}</td><td>${inv.user_name}</td><td>${fmtCurrency(inv.total)}</td>
                  <td><span class="badge badge-${inv.status}">${inv.status}</span></td><td>${fmtDate(inv.created_at)}</td>
                  <td>${
                    inv.status !== "paid"
                      ? `<button class="btn btn-outline btn-sm" data-mark-paid="${inv.id}">Mark paid</button>`
                      : "—"
                  }</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table></div>`
        : `<div class="empty-state">No invoices generated yet.</div>`;
      document.querySelectorAll("[data-mark-paid]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          try {
            await Api.patch(`/admin/invoices/${btn.dataset.markPaid}`, { status: "paid" });
            toast("Invoice marked paid");
            loadInvoices();
          } catch (err) {
            toast(err.message, "error");
          }
        })
      );
    } catch (err) {
      wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }

  /* ================= GALLERY ================= */
  async function loadGallery() {
    const wrap = document.getElementById("gallery-admin-wrap");
    try {
      const images = await Api.get("/admin/gallery");
      wrap.innerHTML = `
        <div class="panel">
          <div class="panel-head"><h3>Upload image</h3></div>
          <form id="gallery-form">
            <div class="form-row">
              <div class="form-group"><label>Category</label>
                <select class="form-control" name="category" required>
                  <option value="Interior Projects">Interior Projects</option>
                  <option value="Painting Projects">Painting Projects</option>
                  <option value="Granite Projects">Granite Projects</option>
                </select>
              </div>
              <div class="form-group"><label>Image file</label><input class="form-control" type="file" name="image" accept="image/*" required></div>
            </div>
            <button class="btn btn-primary" type="submit">Upload to gallery</button>
          </form>
        </div>
        <div class="grid grid-4" id="gallery-grid" style="margin-top:20px"></div>`;
      document.getElementById("gallery-grid").innerHTML = images.length
        ? images
            .map(
              (img) => `
        <div class="card">
          <div class="card-img"><img src="${img.url}" alt="${img.category}"></div>
          <div class="card-body" style="display:flex;justify-content:space-between;align-items:center">
            <span class="tag">${img.category}</span>
            <button class="btn btn-danger btn-sm" data-del-img="${img.id}">Delete</button>
          </div>
        </div>`
            )
            .join("")
        : `<div class="empty-state">No gallery images uploaded yet.</div>`;
      document.querySelectorAll("[data-del-img]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          try {
            await Api.del(`/admin/gallery/${btn.dataset.delImg}`);
            toast("Image deleted");
            loadGallery();
          } catch (err) {
            toast(err.message, "error");
          }
        })
      );
      document.getElementById("gallery-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await Api.postForm("/admin/gallery", fd);
          toast("Image uploaded");
          loadGallery();
        } catch (err) {
          toast(err.message, "error");
        }
      });
    } catch (err) {
      wrap.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }

  loadPanel("analytics");
})();
