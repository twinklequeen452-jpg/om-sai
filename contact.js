/**
 * OM SAI — Contact Us page form handler.
 */
(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const msg = document.getElementById("contact-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("ct-name").value.trim(),
      email: document.getElementById("ct-email").value.trim(),
      phone: document.getElementById("ct-phone").value.trim(),
      message: document.getElementById("ct-message").value.trim(),
    };
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      await Api.post("/contact", payload, { auth: false });
      showFormMsg(msg, "Thanks — we've received your message and will get back within 24 hours.", "success");
      toast("Message sent");
      form.reset();
    } catch (err) {
      showFormMsg(msg, err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Send message";
    }
  });
})();
