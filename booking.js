/**
 * OM SAI — Book Services page.
 * Requires login. Pre-fills category/sub-service from the query
 * string when arriving via a "Book this service" link.
 */
(function () {
  if (!Auth.requireAuth()) return;

  const params = new URLSearchParams(location.search);
  const categorySelect = document.getElementById("bk-category");
  const subSelect = document.getElementById("bk-subservice");
  const form = document.getElementById("booking-form");
  const msg = document.getElementById("booking-msg");
  const historyBody = document.getElementById("booking-history-body");
  const historyEmpty = document.getElementById("booking-history-empty");

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

  const user = Auth.getUser();
  if (user) {
    document.getElementById("bk-name").value = user.full_name || "";
    document.getElementById("bk-phone").value = user.phone || "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-msg";
    const payload = {
      full_name: document.getElementById("bk-name").value.trim(),
      phone: document.getElementById("bk-phone").value.trim(),
      address: document.getElementById("bk-address").value.trim(),
      category: categorySelect.value,
      sub_service: subSelect.value,
      preferred_date: document.getElementById("bk-date").value,
      notes: document.getElementById("bk-notes").value.trim(),
    };
    if (!payload.category || !payload.sub_service) {
      showFormMsg(msg, "Please choose both a category and a sub-service.", "error");
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Booking…";
    try {
      await Api.post("/bookings", payload);
      showFormMsg(msg, "Booking request received! Our team will confirm your slot shortly.", "success");
      toast("Booking submitted successfully");
      form.reset();
      fillSub(null);
      document.getElementById("bk-name").value = user.full_name || "";
      document.getElementById("bk-phone").value = user.phone || "";
      loadHistory();
    } catch (err) {
      showFormMsg(msg, err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit booking request";
    }
  });

  async function loadHistory() {
    try {
      const bookings = await Api.get("/bookings/me");
      if (!bookings.length) {
        historyEmpty.style.display = "block";
        historyBody.innerHTML = "";
        return;
      }
      historyEmpty.style.display = "none";
      historyBody.innerHTML = bookings
        .map(
          (b) => `
        <tr>
          <td>#${b.id}</td>
          <td>${b.category} — ${b.sub_service}</td>
          <td>${fmtDate(b.preferred_date)}</td>
          <td><span class="badge badge-${b.status}">${b.status}</span></td>
          <td>${fmtDateTime(b.created_at)}</td>
        </tr>`
        )
        .join("");
    } catch (err) {
      toast(err.message, "error");
    }
  }
  loadHistory();
})();
