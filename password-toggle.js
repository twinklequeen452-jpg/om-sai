/**
 * OM SAI — password visibility toggle.
 * Wrap any password <input> like this:
 *
 *   <div class="password-field">
 *     <input class="form-control" type="password" id="my-password">
 *     <button type="button" class="password-toggle" data-target="my-password" aria-label="Show password">
 *       <svg class="icon-eye" ...>...</svg>
 *       <svg class="icon-eye-off" style="display:none">...</svg>
 *     </button>
 *   </div>
 *
 * This script finds every .password-toggle button on the page and
 * wires it up automatically — no per-page JS needed.
 */
(function () {
  function wireToggle(btn) {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const eyeIcon = btn.querySelector(".icon-eye");
    const eyeOffIcon = btn.querySelector(".icon-eye-off");
    btn.addEventListener("click", () => {
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      if (eyeIcon) eyeIcon.style.display = showing ? "block" : "none";
      if (eyeOffIcon) eyeOffIcon.style.display = showing ? "none" : "block";
      btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      input.focus();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".password-toggle").forEach(wireToggle);
  });
})();
