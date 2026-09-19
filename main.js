/**
 * OM SAI — renders the service-category cards used on the
 * home page ("Featured Services") and the full services.html grid.
 */
function renderServiceCards(targetId, { limit, basePath = "services/" } = {}) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const slugs = limit ? window.SERVICES_ORDER.slice(0, limit) : window.SERVICES_ORDER;
  el.innerHTML = slugs
    .map((slug, i) => {
      const d = window.SERVICES_DATA[slug];
      return `
      <a class="service-card card" href="${basePath}${slug}.html">
        <div class="card-img">
          <span class="num">${String(i + 1).padStart(2, "0")}</span>
          <img src="${omsaiResolveImg(d.hero)}" alt="${d.title}" loading="lazy">
          <span class="card-title">${d.title}</span>
        </div>
        <div class="card-cta">
          <span>${d.tagline}</span>
          <span aria-hidden="true">→</span>
        </div>
      </a>`;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderServiceCards("featured-services", { limit: 8 });
  renderServiceCards("services-grid");
});
