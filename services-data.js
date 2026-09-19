/**
 * OM SAI — service catalogue.
 * This is the single source of truth for category/subcategory copy,
 * pricing and imagery on the frontend. category-render.js tries the
 * live backend first (so admin edits show up) and falls back to this
 * file if the API is unreachable — the site never shows a broken page.
 *
 * Images: most photos are real project photos supplied for this site
 * (stored locally in /assets/img/) — every one hand-matched to its
 * exact sub-service, no two sub-services anywhere share a photo. A
 * handful of gaps (Kitchen Design, Bedroom Design, Dining Area
 * Design, Interior Painting, Granite Flooring) use verified real
 * Unsplash photos instead, since no local photo fit those slots.
 */
function localImg(filename) {
  // Relative to the current page's folder, using the same depth
  // convention as layout.js — works whether the site is opened via
  // a local server (recommended) OR opened directly as a file:// page.
  const depth = window.OMSAI_DEPTH || "";
  return depth + "assets/img/" + filename;
}
function unsplashImg(id, w, h) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

// Verified real Unsplash photos used only where no local photo was supplied.
const U = {
  KITCHEN: "1764526624453-db32c24eca55",
  BEDROOM: "1768487422639-7ba3900d0f02",
  LIVING_ROOM_ALT: "1758448755856-01d3add0177b",
  BATHROOM: "1754788358645-d6e6cca12e25",
  PAINTING: "1717281234297-3def5ae3eee1",
  STONE: "1554296048-b59c9fca4857",
};

window.SERVICES_DATA = {
  "interior-designing": {
    title: "Interior Designing",
    tagline: "Rooms planned around how you actually live",
    hero: localImg("interior-living-room.jpg"),
    intro: "From a single accent wall to a full-home layout, our design team plans space, light and material together — then hands you a build-ready plan our own crews execute.",
    subcategories: [
      { name: "Kitchen Design", desc: "Modular layouts built around your cooking habits — work-triangle planning, soft-close fittings, and finishes that shrug off daily use.", benefits: ["Modular cabinetry", "Chimney & hob planning", "Soft-close hardware", "3D layout preview"], price: "₹1,80,000 – ₹6,50,000", img: unsplashImg(U.KITCHEN, 800, 600) },
      { name: "Bedroom Design", desc: "Calm, well-lit bedrooms with wardrobes sized to what you own — not the other way around.", benefits: ["Custom wardrobes", "Ambient lighting", "Study/work nook", "Sound-friendly finishes"], price: "₹1,20,000 – ₹4,50,000", img: unsplashImg(U.BEDROOM, 800, 600) },
      { name: "Master Bedroom Design", desc: "A dedicated suite layout — sleeping, dressing and lounging zoned separately within the same room.", benefits: ["Walk-in wardrobe option", "Dressing unit", "Premium headboard panelling", "Reading corner"], price: "₹2,00,000 – ₹7,50,000", img: unsplashImg(U.BEDROOM, 800, 600) },
      { name: "Bathroom Design", desc: "Waterproofing-first bathroom renovations with fittings chosen for your water pressure and usage.", benefits: ["Anti-skid tiling", "Concealed plumbing", "Vanity & storage", "Premium sanitaryware tie-up"], price: "₹90,000 – ₹3,20,000", img: localImg("bathroom-design.jpg") },
      { name: "Living Area Design", desc: "The room that does the most work in your home — seating, storage, TV unit and lighting planned as one system.", benefits: ["TV & storage unit", "False ceiling coordination", "Seating layout planning", "Curtain & blind consult"], price: "₹1,50,000 – ₹5,50,000", img: localImg("interior-living-room.jpg") },
      { name: "Dining Area Design", desc: "Dining spaces sized correctly for your table and traffic flow, with lighting that actually flatters food.", benefits: ["Crockery unit", "Pendant lighting plan", "Space-saving seating", "Wall paneling accents"], price: "₹80,000 – ₹2,80,000", img: unsplashImg(U.LIVING_ROOM_ALT, 800, 600) },
    ],
  },

  "painting-services": {
    title: "Painting Services",
    tagline: "Finishes that hold their colour through Indian summers and monsoons",
    hero: unsplashImg(U.PAINTING, 1600, 700),
    intro: "Surface prep is 80% of a paint job — we sand, putty and prime before a single coat of colour goes on, so the finish actually lasts.",
    subcategories: [
      { name: "Interior Painting", desc: "Low-VOC emulsion painting for living spaces, with clean masking and dust protection for your furniture.", benefits: ["Low-VOC paints", "Two-coat finish", "Furniture protection", "Colour consultation"], price: "₹14 – ₹28 / sq.ft.", img: unsplashImg(U.PAINTING, 800, 600) },
      { name: "Exterior Painting", desc: "Weatherproof exterior systems designed for monsoon exposure, with crack-filling before topcoat.", benefits: ["Weatherproof coats", "Crack & seepage filling", "UV-resistant finish", "5-step surface prep"], price: "₹22 – ₹42 / sq.ft.", img: localImg("painting-exterior-house.jpg") },
      { name: "Waterproof Coating", desc: "Terrace, bathroom and external wall waterproofing to stop seepage before it starts.", benefits: ["Terrace waterproofing", "Bathroom sunken slab treatment", "Seepage diagnosis", "10-yr rated coatings available"], price: "₹45 – ₹90 / sq.ft.", img: localImg("painting-waterproof-roof.jpg") },
      { name: "Wall Putty Work", desc: "Smooth, crack-free base coats using white cement putty — the foundation every good paint job needs.", benefits: ["Crack filling", "Two-coat putty", "Sandpaper finishing", "Ready-to-paint surface"], price: "₹9 – ₹16 / sq.ft.", img: localImg("painting-wall-putty.jpg") },
    ],
  },

  "aluminium-ceiling": {
    title: "Aluminium Ceiling Services",
    tagline: "Lightweight ceiling systems for homes and offices",
    hero: localImg("ceiling-aluminium-false.jpg"),
    intro: "Aluminium ceiling panels give you a clean, moisture-resistant finish that's faster to install and easier to maintain than plaster alternatives.",
    subcategories: [
      { name: "Aluminium False Ceiling", desc: "Panel ceilings for balconies, kitchens and bathrooms that resist moisture and won't yellow over time.", benefits: ["Moisture resistant", "Fast installation", "Easy panel replacement", "Concealed wiring channel"], price: "₹85 – ₹160 / sq.ft.", img: localImg("ceiling-aluminium-false.jpg") },
      { name: "Grid Ceiling", desc: "Modular grid ceilings ideal for offices and utility spaces, allowing easy access to wiring and ducting.", benefits: ["Modular access panels", "Acoustic options", "Fire-retardant tiles", "Quick maintenance"], price: "₹65 – ₹120 / sq.ft.", img: localImg("ceiling-grid-office.jpg") },
      { name: "Custom Ceiling", desc: "Curved, cove-lit or multi-level ceiling designs built to your interior designer's drawings.", benefits: ["Cove lighting channels", "Multi-level design", "Curved panel fabrication", "Design-to-install service"], price: "₹150 – ₹320 / sq.ft.", img: localImg("ceiling-decorative.jpg") },
      { name: "Office Ceiling", desc: "Commercial-grade ceiling systems that meet fire and acoustic requirements for workspaces.", benefits: ["Fire-rated materials", "Acoustic dampening", "Cable-tray friendly", "Bulk-area pricing"], price: "₹70 – ₹135 / sq.ft.", img: localImg("ceiling-office-custom.jpg") },
    ],
  },

  "plumber-work": {
    title: "Plumber Work",
    tagline: "Licensed plumbing for new builds and repairs",
    hero: localImg("plumber-pipe-installation.jpg"),
    intro: "From first-fix pipe-laying to a midnight leak, our plumbing team works to code and pressure-tests every line before handover.",
    subcategories: [
      { name: "Pipe Installation", desc: "Fresh water and drainage line installation for new construction or full renovations, pressure-tested before closing walls.", benefits: ["CPVC/UPVC piping", "Pressure testing", "Concealed routing", "Leak-proof joints"], price: "₹35 – ₹70 / running ft.", img: localImg("plumber-pipe-installation.jpg") },
      { name: "Bathroom Plumbing", desc: "Complete bathroom plumbing — fittings, mixers, geysers and floor traps installed and tested.", benefits: ["Fixture installation", "Geyser plumbing", "Floor trap & slope check", "Mixer & shower fitting"], price: "₹8,000 – ₹35,000 / bathroom", img: unsplashImg(U.BATHROOM, 800, 600) },
      { name: "Water Tank Installation", desc: "Overhead and underground tank installation with float-valve automation and inlet/outlet planning.", benefits: ["Overhead & sump tanks", "Float valve automation", "Inlet/outlet planning", "Cleaning access design"], price: "₹6,000 – ₹28,000", img: localImg("plumber-water-tank.jpg") },
      { name: "Drainage Solutions", desc: "Blockage clearing and drainage slope correction to stop recurring waterlogging.", benefits: ["High-pressure jetting", "Slope correction", "Manhole & trap repair", "Recurring-blockage diagnosis"], price: "₹1,500 – ₹12,000", img: localImg("plumber-drainage-trench.jpg") },
    ],
  },

  "upvc-work": {
    title: "UPVC Work",
    tagline: "Weather-sealed UPVC windows and doors",
    hero: localImg("upvc-window-sash.jpg"),
    intro: "UPVC frames don't warp, rust or need repainting — a one-time investment for noise and dust control in Indian cities.",
    subcategories: [
      { name: "UPVC Windows", desc: "Sliding and fixed UPVC windows with dual-glass options for noise and heat reduction.", benefits: ["Dual-glass option", "Multi-point locking", "Mosquito mesh included", "10-yr frame warranty"], price: "₹450 – ₹850 / sq.ft.", img: localImg("upvc-window-sash.jpg") },
      { name: "Casement Windows", desc: "Outward-opening casement windows for maximum ventilation and a tighter weather seal.", benefits: ["Tighter weather seal", "Maximum ventilation", "Concealed hinges", "Child-safety restrictor"], price: "₹500 – ₹900 / sq.ft.", img: localImg("upvc-casement-window.jpg") },
      { name: "UPVC Doors", desc: "Main and balcony UPVC doors — termite-proof, low-maintenance and available in wood-finish laminates.", benefits: ["Termite-proof", "Wood-finish laminate options", "Multi-point lock", "Rain/dust sealing"], price: "₹600 – ₹1,200 / sq.ft.", img: localImg("upvc-door.jpg") },
    ],
  },

  "electrician-services": {
    title: "Electrician Services",
    tagline: "Licensed wiring, fixtures and smart-home setup",
    hero: localImg("electrician-switchboard.jpg"),
    intro: "Every circuit is load-calculated and labelled before we close a single switchboard — safety first, then finish.",
    subcategories: [
      { name: "House Wiring", desc: "Concealed copper wiring sized to your actual load, with a labelled distribution board.", benefits: ["ISI copper wiring", "Load calculation", "Labelled DB", "MCB/RCCB protection"], price: "₹35 – ₹65 / sq.ft.", img: localImg("electrician-network-panel.jpg") },
      { name: "Switchboard Installation", desc: "Modular switch and socket layouts planned around your furniture, not the other way around.", benefits: ["Modular switches", "Furniture-aware layout", "Child-safety shutters", "Labelled circuits"], price: "₹450 – ₹1,200 / point", img: localImg("electrician-switchboard.jpg") },
      { name: "Lighting Design", desc: "Layered lighting plans — ambient, task and accent — coordinated with your false ceiling.", benefits: ["Layered lighting plan", "Ceiling coordination", "Dimmer-ready circuits", "Energy-efficient fixtures"], price: "₹250 – ₹900 / point", img: localImg("electrician-lighting-install.jpg") },
      { name: "Smart Home Electrical Setup", desc: "Smart switches, app control and automation wiring for a home you can control from your phone.", benefits: ["Smart switch wiring", "App/voice control ready", "Scene automation", "Retrofit or new-build"], price: "₹1,200 – ₹3,500 / point", img: localImg("electrician-panel-testing.jpg") },
      { name: "Generator Connection", desc: "Changeover panel wiring so your backup generator kicks in safely without back-feeding the grid.", benefits: ["Changeover panel", "Safety interlock", "Load-priority wiring", "Testing & handover"], price: "₹8,000 – ₹22,000", img: localImg("electrician-generator-units.jpg") },
    ],
  },

  "granite-work": {
    title: "Granite Work",
    tagline: "Stone countertops, flooring and cladding",
    hero: localImg("granite-kitchen-countertop.jpg"),
    intro: "We template on-site before cutting, so every granite piece is fitted to your actual walls and cabinets — not a generic slab size.",
    subcategories: [
      { name: "Kitchen Countertops", desc: "Templated, edge-polished granite countertops with sink and hob cut-outs done to size.", benefits: ["On-site templating", "Sink/hob cut-outs", "Polished edge finish", "Stain-resistant sealing"], price: "₹150 – ₹450 / sq.ft.", img: localImg("granite-kitchen-countertop.jpg") },
      { name: "Granite Flooring", desc: "Large-format granite flooring laid with precise grout lines and slope for wet areas.", benefits: ["Large-format slabs", "Precision grouting", "Slope for wet areas", "Anti-skid finish option"], price: "₹120 – ₹320 / sq.ft.", img: unsplashImg(U.STONE, 800, 600) },
      { name: "Staircase Granite", desc: "Step and riser granite cladding with nosing detail for slip resistance on every tread.", benefits: ["Nosing detail", "Slip-resistant tread", "Matched riser panels", "On-site precision cutting"], price: "₹180 – ₹380 / sq.ft.", img: localImg("granite-staircase.jpg") },
      { name: "Wall Granite", desc: "Feature-wall and cladding granite with book-matched veining for a showroom finish.", benefits: ["Book-matched veining", "Feature wall cladding", "Weatherproof exterior option", "Mirror polish finish"], price: "₹160 – ₹420 / sq.ft.", img: localImg("granite-wall-cladding.jpg") },
    ],
  },
};

window.SERVICES_ORDER = [
  "interior-designing",
  "painting-services",
  "aluminium-ceiling",
  "plumber-work",
  "upvc-work",
  "electrician-services",
  "granite-work",
];
