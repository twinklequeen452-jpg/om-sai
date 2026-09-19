/**
 * OM SAI — Quotations page.
 * Users submit a quotation request; admin later creates/sends a
 * priced quotation from the Admin Dashboard which shows up here.
 */
(function () {
  if (!Auth.requireAuth()) return;

  const params = new URLSearchParams(location.search);
  const categorySelect = document.getElementById("qt-category");
  const subSelect = document.getElementById("qt-subservice");
  const form = document.getElementById("quotation-form");
  const msg = document.getElementById("quotation-msg");
  const listEl = document.getElementById("quotation-list");
  const emptyEl = document.getElementById("quotation-empty");

  function fillCategories() {
    categorySelect.innerHTML =
      `<option value="">Choose a service category</option>` +
      window.SERVICES_ORDER.map((slug) => `<option value="${slug}">${SERVICES_DATA[slug].title}</option>`).join("");
  }
  function fillSub(slug, preselect) {
    if (!slug || !SERVICES_DATA[slug]) {
      subSelect.innerHTML = `<option value="">Select category first</option>`;
      subSelect.disabled = true;
      return;
    }
    subSelect.disabled = false;
    subSelect.innerHTML =
      `<option value="">Choose a sub-service</option>` +
      SERVICES_DATA[slug].subcategories
        .map((s) => `<option value="${s.name}" ${s.name === preselect ? "selected" : ""}>${s.name}</option>`)
        .join("");
  }

  fillCategories();
  const qCategory = params.get("category");
  const qSub = params.get("sub");
  if (qCategory && SERVICES_DATA[qCategory]) {
    categorySelect.value = qCategory;
    fillSub(qCategory, qSub);
  } else {
    fillSub(null);
  }
  categorySelect.addEventListener("change", () => fillSub(categorySelect.value));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      category: categorySelect.value,
      sub_service: subSelect.value,
      area_sqft: document.getElementById("qt-area").value || null,
      budget_range: document.getElementById("qt-budget").value.trim(),
      requirements: document.getElementById("qt-requirements").value.trim(),
    };
    if (!payload.category || !payload.sub_service) {
      showFormMsg(msg, "Please choose both a category and a sub-service.", "error");
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      await Api.post("/quotations", payload);
      showFormMsg(msg, "Request sent — our estimator will send a quotation here shortly.", "success");
      toast("Quotation request sent");
      form.reset();
      fillSub(null);
      loadList();
    } catch (err) {
      showFormMsg(msg, err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Request quotation";
    }
  });

  async function loadList() {
    try {
      const items = await Api.get("/quotations/me");
      if (!items.length) {
        emptyEl.style.display = "block";
        listEl.innerHTML = "";
        return;
      }
      emptyEl.style.display = "none";
      listEl.innerHTML = items
        .map(
          (q) => `
        <div class="panel">
          <div class="panel-head">
            <div>
              <strong>${q.category} — ${q.sub_service}</strong>
              <div class="eyebrow" style="margin-top:6px">Requested ${fmtDate(q.created_at)}</div>
            </div>
            <span class="badge badge-${q.status}">${q.status}</span>
          </div>
          <p style="color:#5A5140;font-size:.9rem">${q.requirements || "No additional notes provided."}</p>
          ${
            q.status === "sent" || q.status === "approved"
              ? `<div class="table-wrap" style="margin-top:14px">
                  <table class="data-table">
                    <tr><th>Quoted amount</th><td>${fmtCurrency(q.quoted_amount)}</td></tr>
                    <tr><th>Validity</th><td>${q.valid_until ? fmtDate(q.valid_until) : "—"}</td></tr>
                    <tr><th>Estimator notes</th><td>${q.admin_notes || "—"}</td></tr>
                  </table>
                </div>`
              : `<div class="eyebrow">Awaiting estimator review</div>`
          }
        </div>`
        )
        .join("");
    } catch (err) {
      toast(err.message, "error");
    }
  }
  loadList();
})();
