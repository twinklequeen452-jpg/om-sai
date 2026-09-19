/**
 * OM SAI — Payments page.
 * UPI-first payment flow: pick a method, scan/pay the QR, then
 * submit the transaction ID + a screenshot for the admin to verify.
 * No card payments are collected, by design.
 */
(function () {
  if (!Auth.requireAuth()) return;

  const params = new URLSearchParams(location.search);
  const methodButtons = document.querySelectorAll(".pay-method");
  const invoiceSelect = document.getElementById("pay-invoice");
  const form = document.getElementById("payment-form");
  const msg = document.getElementById("payment-msg");
  const historyBody = document.getElementById("payment-history-body");
  const historyEmpty = document.getElementById("payment-history-empty");
  let selectedMethod = "UPI";

  methodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      methodButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedMethod = btn.dataset.method;
    });
  });
  if (methodButtons[0]) methodButtons[0].classList.add("selected");

  async function loadInvoices() {
    try {
      const invoices = await Api.get("/invoices/me");
      const unpaid = invoices.filter((i) => i.status !== "paid");
      invoiceSelect.innerHTML =
        `<option value="">General / advance payment (no invoice yet)</option>` +
        unpaid.map((i) => `<option value="${i.id}">Invoice #OMS-${String(i.id).padStart(4, "0")} — ${fmtCurrency(i.total)}</option>`).join("");
      const pre = params.get("invoice");
      if (pre) invoiceSelect.value = pre;
    } catch (err) {
      /* not fatal — payment form still usable without invoice list */
    }
  }
  loadInvoices();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("method", selectedMethod);
    fd.append("transaction_id", document.getElementById("pay-txn").value.trim());
    fd.append("amount", document.getElementById("pay-amount").value);
    if (invoiceSelect.value) fd.append("invoice_id", invoiceSelect.value);
    const fileInput = document.getElementById("pay-screenshot");
    if (fileInput.files[0]) fd.append("screenshot", fileInput.files[0]);

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Submitting…";
    try {
      await Api.postForm("/payments", fd);
      showFormMsg(msg, "Payment submitted for verification. We'll confirm within a few hours.", "success");
      toast("Payment submitted");
      form.reset();
      loadHistory();
    } catch (err) {
      showFormMsg(msg, err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit payment for verification";
    }
  });

  async function loadHistory() {
    try {
      const payments = await Api.get("/payments/me");
      if (!payments.length) {
        historyEmpty.style.display = "block";
        historyBody.innerHTML = "";
        return;
      }
      historyEmpty.style.display = "none";
      historyBody.innerHTML = payments
        .map(
          (p) => `
        <tr>
          <td>#${p.id}</td>
          <td>${p.method}</td>
          <td>${fmtCurrency(p.amount)}</td>
          <td>${p.transaction_id}</td>
          <td><span class="badge badge-${p.status}">${p.status}</span></td>
          <td>${fmtDateTime(p.created_at)}</td>
        </tr>`
        )
        .join("");
    } catch (err) {
      toast(err.message, "error");
    }
  }
  loadHistory();
})();
