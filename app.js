/* ==========================================================
   AARADHYA MART — STOREFRONT LOGIC
   Multi-store tabs • Multi-image gallery • WhatsApp orders
   ========================================================== */

const STORE_KEY = "aaradhyaMartProductsV1";
const WHATSAPP_NUMBER = "918931911428";
let products = [];
let currentStore = "Fashion";

/* ---------- Data loading ---------- */
function loadStoreProducts() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    products = saved ? JSON.parse(saved) : [...(window.STARTER_PRODUCTS || [])];
    if (!Array.isArray(products)) products = [...(window.STARTER_PRODUCTS || [])];
  } catch (e) {
    products = [...(window.STARTER_PRODUCTS || [])];
  }
}

/* ---------- Helpers ---------- */
function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function safeImage(value) {
  const s = String(value || "");
  return /^(https:\/\/|assets\/|data:image\/)/i.test(s)
    ? escapeText(s)
    : "https://placehold.co/600x800/f1f0ed/10243b?text=No+Image";
}

/* ---------- Multi-image helper ---------- */
/* Returns array of image URLs for any product.
   Handles new `images` array + legacy single `image` field. */
function getProductImages(p) {
  if (p.images && Array.isArray(p.images) && p.images.length > 0) {
    return p.images.filter(Boolean);
  }
  if (p.image) return [p.image];
  return [];
}

/* ---------- Universal search + filters ---------- */
function ensureUniversalFilters() {
  if (document.getElementById('universalFilters')) return;
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  const wrap = document.createElement('section');
  wrap.id = 'universalFilters';
  wrap.className = 'universal-search-wrap';
  wrap.innerHTML = `
    <div class="uf-search-box">
      <span class="uf-search-icon" aria-hidden="true">⌕</span>
      <input id="searchInput" type="search" placeholder="Search for Products, Brands and More..." autocomplete="off" aria-label="Search products">
      <button type="button" id="clearSearchInput" aria-label="Clear search" class="uf-search-clear" hidden>×</button>
    </div>
    <div id="searchSuggestions" class="uf-suggestions" role="listbox" aria-label="Search suggestions"></div>`;
  grid.parentNode.insertBefore(wrap, grid);
}

const SEARCH_HISTORY_KEY = 'aaradhyaMartSearchHistoryV1';
function getSearchHistory() {
  try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]').filter(Boolean).slice(0, 6); }
  catch(e) { return []; }
}
function saveSearchHistory(term) {
  const cleaned = String(term || '').trim();
  if (!cleaned) return;
  const history = getSearchHistory().filter(x => x.toLowerCase() !== cleaned.toLowerCase());
  history.unshift(cleaned);
  try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 6))); } catch(e) {}
}
function renderSearchSuggestions(query = '') {
  const box = document.getElementById('searchSuggestions');
  const input = document.getElementById('searchInput');
  if (!box || !input) return;
  const q = String(query || '').trim().toLowerCase();
  let rows = [];
  if (!q) {
    rows = getSearchHistory().map(term => ({type:'history', text:term, sub:'Recent search'}));
  } else {
    const matches = products.filter(p => {
      const hay = [p.name,p.store,p.category,p.description,p.tag,p.brand,p.id,p.keywords,...(p.searchTags||[]),...(p.colors||[]),...(p.sizes||[])].flat().join(' ').toLowerCase();
      return hay.includes(q);
    }).slice(0, 6);
    rows = matches.map(p => ({type:'product', text:p.name, sub:`in ${p.store || currentStore}`, id:p.id}));
    if (!rows.length) rows = [{type:'search', text:`Search all products for “${query}”`, sub:'Press Enter to search'}];
  }
  if (!rows.length) { box.innerHTML = ''; box.classList.remove('active'); return; }
  box.innerHTML = rows.map(r => `<button type="button" class="uf-suggestion" data-suggestion="${escapeText(r.text)}" ${r.id ? `data-product-id="${escapeText(r.id)}"` : ''}><span class="uf-suggestion-icon">${r.type === 'history' ? '◷' : '⌕'}</span><span class="uf-suggestion-text"><span class="uf-suggestion-title">${escapeText(r.text)}</span><span class="uf-suggestion-sub">${escapeText(r.sub)}</span></span></button>`).join('');
  box.classList.add('active');
}
function hideSearchSuggestions() { document.getElementById('searchSuggestions')?.classList.remove('active'); }
function applySearchTerm(term, remember = true) {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.value = term;
  if (remember) saveSearchHistory(term);
  renderStore();
  hideSearchSuggestions();
  const clearBtn = document.getElementById('clearSearchInput');
  if (clearBtn) clearBtn.hidden = !term;
}
function updateCategoryOptions() {
  const catSelect = document.getElementById('categoryFilter');
  if (!catSelect) return;
  const storeChoice = document.getElementById('storeFilter')?.value || currentStore;
  const relevant = storeChoice === 'All' ? products : products.filter(p => p.store === storeChoice);
  const uniqueCats = [...new Set(relevant.map(p => p.category).filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b)));
  const oldValue = catSelect.value;
  catSelect.innerHTML = '<option value="All">All Categories</option>' + uniqueCats.map(cat => `<option value="${escapeText(cat)}">${escapeText(cat)}</option>`).join('');
  if (uniqueCats.includes(oldValue)) catSelect.value = oldValue;
}
function switchStore(storeName) {
  currentStore = storeName;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeTab = document.querySelector(`.tab-btn[data-store="${storeName}"]`);
  if (activeTab) activeTab.classList.add('active');
  const titles = { Fashion: 'Clothing & Apparel', Print: 'Custom Printing Services', Kirana: 'Grocery & Daily Needs' };
  const titleEl = document.getElementById('currentStoreTitle');
  if (titleEl) titleEl.textContent = titles[storeName] || storeName;
  const printBanner = document.getElementById('printBanner');
  if (printBanner) printBanner.classList.toggle('hidden', storeName !== 'Print');
  ensureUniversalFilters();
  const storeFilter = document.getElementById('storeFilter');
  if (storeFilter && storeFilter.value !== 'All') storeFilter.value = storeName;
  updateCategoryOptions();
  renderStore();
}
function renderStore() {
  const query = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const storeChoice = currentStore;
  const sort = 'featured';
  let list = products.filter(p => p.store === storeChoice);
  list = list.filter(p => {
    const haystack = [p.name, p.store, p.category, p.description, p.tag, p.brand, p.id, p.keywords,
      ...(p.searchTags || []), ...(p.colors || []), ...(p.sizes || [])].flat().join(' ').toLowerCase();
    return haystack.includes(query);
  });
  if (sort === 'low') list.sort((a,b) => Number(a.price || 0) - Number(b.price || 0));
  if (sort === 'high') list.sort((a,b) => Number(b.price || 0) - Number(a.price || 0));
  if (sort === 'name') list.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
  const countEl = document.getElementById('productCount');
  if (countEl) countEl.textContent = `${list.length} ITEMS`; 
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('emptyState');
  if (empty) empty.classList.toggle('hidden', list.length !== 0);
  if (!grid) return;
  grid.innerHTML = list.map(p => {
    const isOut = Number(p.stock) <= 0;
    const imgs = getProductImages(p);
    const cover = imgs[0];
    const imgCountBadge = imgs.length > 1 ? `<span class="card-images-count">📷 ${imgs.length}</span>` : '';
    const storeBadge = storeChoice === 'All' ? `<span class="uf-store-badge">${escapeText(p.store || '')}</span>` : '';
    return `<article class="product-card" style="${isOut ? 'opacity:0.8;' : ''}">
      <div class="product-image-wrap" data-open="${escapeText(p.id)}"><img src="${safeImage(cover)}" alt="${escapeText(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/600x800/f1f0ed/10243b?text=No+Image'">${p.tag ? `<span class="product-tag">${escapeText(p.tag)}</span>` : ''}${imgCountBadge}${storeBadge}${isOut ? `<span class="out-of-stock-tag">SOLD OUT</span>` : ''}</div>
      <div class="product-info"><span class="product-category">${escapeText(p.category)}</span><h3>${escapeText(p.name)}</h3><div class="product-price">${p.price === 0 ? 'Custom Quote' : money(p.price)}${Number(p.originalPrice) > Number(p.price) && p.originalPrice > 0 ? `<span class="old-price">${money(p.originalPrice)}</span>` : ''}</div>
      <div class="product-actions"><button class="btn-view" data-open="${escapeText(p.id)}">Details</button><button class="btn-order" data-order="${escapeText(p.id)}" ${isOut ? 'disabled' : ''}>${isOut ? 'Sold Out' : 'Order'}</button></div></div></article>`;
  }).join('');
}


/* ---------- Product dialog with gallery ---------- */
function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  const dialog = document.getElementById("productDialog");
  const images = getProductImages(p);

  // Fallback if no images
  const safeImages = images.length > 0
    ? images
    : ["https://placehold.co/600x800/f1f0ed/10243b?text=No+Image"];

  const priceHtml = p.price === 0
    ? `<span style="color:var(--gold);font-weight:bold;">Custom Quote</span>`
    : `${money(p.price)} ${Number(p.originalPrice) > Number(p.price)
        ? `<span class="old-price">${money(p.originalPrice)}</span>`
        : ""}`;

  // Thumbnails only if > 1 image
  const thumbnailsHtml = safeImages.length > 1 ? `
    <div class="thumbnails">
      ${safeImages.map((img, i) => `
        <img src="${safeImage(img)}"
             class="thumb ${i === 0 ? 'active' : ''}"
             data-index="${i}"
             alt="View ${i + 1}"
             onerror="this.src='https://placehold.co/600x800/f1f0ed/10243b?text=No+Image'">
      `).join("")}
    </div>` : "";

  document.getElementById("dialogContent").innerHTML = `
    <div class="dialog-layout">
      <div class="product-gallery">
        <img id="mainProductImage"
             class="main-image"
             src="${safeImage(safeImages[0])}"
             alt="${escapeText(p.name)}"
             onerror="this.src='https://placehold.co/600x800/f1f0ed/10243b?text=No+Image'">
        ${thumbnailsHtml}
      </div>
      <div class="dialog-details">
        <span class="product-category">${escapeText(p.category)}</span>
        <h2>${escapeText(p.name)}</h2>
        <div class="product-price">${priceHtml}</div>
        <p>${escapeText(p.description)}</p>

        ${p.sizes && p.sizes.length > 0 ? `
        <label>Select Size / Qty</label>
        <select id="sizeChoice">
          ${p.sizes.map(s => `<option>${escapeText(s)}</option>`).join("")}
        </select>` : ''}

        ${p.colors && p.colors.length > 0 ? `
        <label>Select Colour</label>
        <select id="colorChoice">
          ${p.colors.map(c => `<option>${escapeText(c)}</option>`).join("")}
        </select>` : ''}

        <p style="margin-top:10px;">
          Status: ${Number(p.stock) > 0
            ? "<span style='color:var(--success);font-weight:bold;'>In Stock</span>"
            : "<span style='color:#ef4444;font-weight:bold;'>Out of Stock</span>"}
        </p>

        <button class="button-navy" id="dialogOrder" ${Number(p.stock) <= 0 ? 'disabled' : ''} style="margin-top:15px;">
          ${Number(p.stock) <= 0 ? 'Out of Stock' : 'Order on WhatsApp ↗'}
        </button>
      </div>
    </div>`;

  dialog.showModal();

  // Wire up thumbnails → swap main image
  document.querySelectorAll(".product-gallery .thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const idx = Number(thumb.dataset.index);
      document.getElementById("mainProductImage").src = safeImage(safeImages[idx]);
      document.querySelectorAll(".product-gallery .thumb").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  // Order button
  if (Number(p.stock) > 0) {
    document.getElementById("dialogOrder").addEventListener("click", () => {
      const size = document.getElementById("sizeChoice")?.value || "N/A";
      const color = document.getElementById("colorChoice")?.value || "N/A";
      orderProduct(p.id, size, color);
    });
  }
}

/* ---------- WhatsApp order ---------- */
function orderProduct(id, size, color) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  const storeName = p.store === "Fashion"
    ? "Aaradhya Fashion"
    : p.store === "Print"
    ? "A-Print"
    : "Aaradhya Kirana";

  const msg = `Hello ${storeName}!\nI want to order:\n\nProduct: ${p.name}\nPrice: ${p.price === 0 ? 'Custom Quote' : money(p.price)}\nSize/Qty: ${size}\nColour: ${color}\n\nPlease confirm.`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loadStoreProducts();
  ensureUniversalFilters();
  switchStore('Fashion');
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearchInput');
  searchInput?.addEventListener('input', () => {
    renderStore();
    if (clearSearch) clearSearch.hidden = !searchInput.value;
    renderSearchSuggestions(searchInput.value);
  });
  searchInput?.addEventListener('focus', () => renderSearchSuggestions(searchInput.value));
  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); applySearchTerm(searchInput.value); }
    if (e.key === 'Escape') hideSearchSuggestions();
  });
  clearSearch?.addEventListener('click', () => { applySearchTerm('', false); renderSearchSuggestions(''); searchInput?.focus(); });
  document.getElementById('searchSuggestions')?.addEventListener('click', e => {
    const row = e.target.closest('.uf-suggestion');
    if (!row) return;
    const term = row.dataset.suggestion || '';
    applySearchTerm(term);
  });
  document.addEventListener('click', e => { if (!e.target.closest('#universalFilters')) hideSearchSuggestions(); });
  document.getElementById("productGrid")?.addEventListener("click", e => {
    const open = e.target.closest("[data-open]");
    const order = e.target.closest("[data-order]");
    if (open) openProduct(open.dataset.open);
    if (order && !order.disabled) orderProduct(order.dataset.order, "N/A", "N/A");
  });

  document.getElementById("dialogClose")?.addEventListener("click", () => {
    document.getElementById("productDialog").close();
  });

  document.getElementById("productDialog")?.addEventListener("click", e => {
    if (e.target.id === "productDialog") e.target.close();
  });
});
