/**
 * OM SAI — renders /services/<slug>.html
 * Tries GET /api/services/<slug> first (so admin-added subcategories
 * show up live); silently falls back to the bundled SERVICES_DATA
 * so the page always renders even with the backend offline.
 */
(async function () {
  const slug = document.body.dataset.category;
  if (!slug) return;

  let data = window.SERVICES_DATA[slug];
  try {
    const live = await Api.get(`/services/${slug}`, { auth: false });
    if (live && live.subcategories && live.subcategories.length) data = live;
  } catch (_) {
    /* offline or not seeded yet — local fallback already assigned above */
  }

  if (!data) {
    document.getElementById("category-root").innerHTML = `<div class="empty-state">This service category isn't available right now.</div>`;
    return;
  }

  document.title = `${data.title} — OM SAI Interiors & Construction`;
  document.getElementById("cat-hero-bg").src = omsaiResolveImg(data.hero);
  document.getElementById("cat-eyebrow").textContent = "Services / " + data.title;
  document.getElementById("cat-title").textContent = data.title;
  document.getElementById("cat-tagline").textContent = data.tagline;
  document.getElementById("cat-intro").textContent = data.intro;

  const root = document.getElementById("category-root");
  root.innerHTML = data.subcategories
    .map((sub, i) => {
      const idx = String(i + 1).padStart(2, "0");
      const gallery = (sub.gallery || [])
        .map((g) => `<img src="${omsaiResolveImg(g)}" alt="${sub.name} detail" loading="lazy">`)
        .join("");
      return `
      <div class="spec-row ${i % 2 ? "reverse" : ""}">
        <div class="spec-media">
          <img src="${omsaiResolveImg(sub.img)}" alt="${sub.name}" loading="lazy">
        </div>
        <div class="spec-body">
          <div class="spec-head">
            <span class="spec-index">${idx}</span>
            <span class="eyebrow">Sub-service</span>
          </div>
          <h3>${sub.name}</h3>
          <p>${sub.desc}</p>
          <ul class="spec-benefits">
            ${(sub.benefits || []).map((b) => `<li>${b}</li>`).join("")}
          </ul>
          <span class="spec-price">Indicative price: ${sub.price}</span>
          <div class="spec-actions">
            <a class="btn btn-primary" href="../book-services.html?category=${slug}&sub=${encodeURIComponent(sub.name)}">Book this service</a>
            <a class="btn btn-outline" href="../quotations.html?category=${slug}&sub=${encodeURIComponent(sub.name)}">Request quotation</a>
          </div>
          <div class="spec-gallery">${gallery}</div>
        </div>
      </div>`;
    })
    .join("");
})();
