const STORE_KEY = "aaradhyaMartProductsV1";
const WHATSAPP_NUMBER = "918931911428";
let products = [];
let currentStore = "Fashion";

function loadStoreProducts() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    products = saved ? JSON.parse(saved) : [...(window.STARTER_PRODUCTS || [])];
    if (!Array.isArray(products)) products = [...(window.STARTER_PRODUCTS || [])];
  } catch (e) {
    products = [...(window.STARTER_PRODUCTS || [])];
  }
}

function money(value) { return "₹" + Number(value || 0).toLocaleString("en-IN"); }
function escapeText(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function safeImage(value) { return /^(https:\/\/|assets\/)/i.test(String(value)) ? escapeText(value) : "https://placehold.co/600x800/f1f0ed/10243b?text=No+Image"; }

function switchStore(storeName) {
  currentStore = storeName;
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeTab = document.querySelector(`.tab-btn[data-store="${storeName}"]`);
  if(activeTab) activeTab.classList.add('active');

  const titles = {
    "Fashion": { tag: "AARADHYA FASHION", title: "Clothing & Apparel" },
    "Print": { tag: "A-PRINT", title: "Custom Printing Services" },
    "Kirana": { tag: "AARADHYA KIRANA", title: "Grocery & Daily Needs" }
  };
  document.getElementById("currentStoreTag").textContent = titles[storeName].tag;
  document.getElementById("currentStoreTitle").textContent = titles[storeName].title;

  document.getElementById("printBanner").classList.toggle("hidden", storeName !== "Print");

  const catSelect = document.getElementById("categoryFilter");
  catSelect.innerHTML = `<option value="All">All Categories</option>`;
  const storeProducts = products.filter(p => p.store === storeName);
  const uniqueCats = [...new Set(storeProducts.map(p => p.category))];
  uniqueCats.forEach(cat => {
    catSelect.innerHTML += `<option value="${escapeText(cat)}">${escapeText(cat)}</option>`;
  });

  document.getElementById("searchInput").value = "";
  renderStore();
  document.getElementById("main-shop").scrollIntoView({ behavior: "smooth" });
}

function renderStore() {
  const query = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
  const category = document.getElementById("categoryFilter")?.value || "All";
  const sort = document.getElementById("sortFilter")?.value || "featured";
  
  let list = products.filter(p => p.store === currentStore);
  
  if (category !== "All") list = list.filter(p => p.category === category);
  list = list.filter(p => [p.name, p.category, p.description].join(" ").toLowerCase().includes(query));
  
  if (sort === "low") list.sort((a,b)=>Number(a.price)-Number(b.price));
  if (sort === "high") list.sort((a,b)=>Number(b.price)-Number(a.price));

  document.getElementById("productCount").textContent = `${list.length} ITEMS`;
  const grid = document.getElementById("productGrid");
  document.getElementById("emptyState").classList.toggle("hidden", list.length !== 0);

  grid.innerHTML = list.map(p => {
    const isOut = Number(p.stock) <= 0;
    return `
    <article class="product-card" style="${isOut ? 'opacity: 0.7;' : ''}">
      <div class="product-image-wrap" data-open="${escapeText(p.id)}">
        <img src="${safeImage(p.image)}" alt="${escapeText(p.name)}" loading="lazy">
        ${p.tag ? `<span class="product-tag">${escapeText(p.tag)}</span>` : ""}
        ${isOut ? `<span class="product-tag" style="background:#a22;color:#fff;left:auto;right:12px;">OUT OF STOCK</span>` : ""}
      </div>
      <div class="product-info">
        <span class="product-category">${escapeText(p.category)}</span>
        <h3>${escapeText(p.name)}</h3>
        <div class="product-price">${p.price === 0 ? 'Custom Quote' : money(p.price)} ${Number(p.originalPrice)>Number(p.price)&&p.originalPrice>0?`<span class="old-price">${money(p.originalPrice)}</span>`:""}</div>
        <div class="product-actions">
          <button class="small-button" data-open="${escapeText(p.id)}">VIEW</button>
          <button class="small-button primary" data-order="${escapeText(p.id)}" ${isOut ? 'disabled style="background:#999;border-color:#999;"' : ''}>${isOut ? 'OUT OF STOCK' : 'ORDER ↗'}</button>
        </div>
      </div>
    </article>`;
  }).join("");
}

function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const dialog = document.getElementById("productDialog");
  
  const priceHtml = p.store === "Print" && p.price === 0 
    ? `<span style="color:var(--gold);font-weight:bold;">Custom Quote on WhatsApp</span>` 
    : `${money(p.price)} ${Number(p.originalPrice)>Number(p.price)?`<span class="old-price">${money(p.originalPrice)}</span>`:""}`;
  
  document.getElementById("dialogContent").innerHTML = `
    <div class="dialog-layout">
      <img src="${safeImage(p.image)}" alt="${escapeText(p.name)}">
      <div class="dialog-details">
        <span class="product-category">${escapeText(p.category)}</span>
        <h2>${escapeText(p.name)}</h2>
        <div class="product-price">${priceHtml}</div>
        <p>${escapeText(p.description)}</p>
        
        ${p.sizes && p.sizes.length > 0 ? `
        <label for="sizeChoice">Choose Size/Quantity</label>
        <select id="sizeChoice">${p.sizes.map(s=>`<option>${escapeText(s)}</option>`).join("")}</select>` : ''}
        
        ${p.colors && p.colors.length > 0 ? `
        <label for="colorChoice">Choose Colour</label>
        <select id="colorChoice">${p.colors.map(c=>`<option>${escapeText(c)}</option>`).join("")}</select>` : ''}
        
        <p>Availability: ${Number(p.stock)>0? "In stock" : "<span style='color:#a22'>Out of stock</span>"}</p>
        
        <button class="button button-navy" id="dialogOrder" ${Number(p.stock)<=0 ? 'disabled style="background:#999"' : ''}>
          ${Number(p.stock)<=0 ? 'OUT OF STOCK' : 'ORDER ON WHATSAPP ↗'}
        </button>
      </div>
    </div>`;
  dialog.showModal();
  
  if (Number(p.stock) > 0) {
    document.getElementById("dialogOrder").addEventListener("click", () => {
      const size = document.getElementById("sizeChoice")?.value || "N/A";
      const color = document.getElementById("colorChoice")?.value || "N/A";
      orderProduct(p.id, size, color);
    });
  }
}

function orderProduct(id, size, color) {
  const p = products.find(x=>x.id===id);
  if (!p) return;
  const storeName = p.store === "Fashion" ? "Aaradhya Fashion" : p.store === "Print" ? "A-Print" : "Aaradhya Kirana";
  
  const msg = `Hello ${storeName}!\nI want to order:\n\nProduct: ${p.name}\nID: ${p.id}\nPrice: ${p.price === 0 ? 'Custom Quote' : money(p.price)}\nSize/Qty: ${size}\nColour: ${color}\n\nPlease confirm availability.`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

document.addEventListener("DOMContentLoaded", () => {
  loadStoreProducts();
  switchStore('Fashion');
  
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("searchInput").addEventListener("input", renderStore);
  document.getElementById("categoryFilter").addEventListener("change", renderStore);
  document.getElementById("sortFilter").addEventListener("change", renderStore);
  
  document.getElementById("productGrid").addEventListener("click", e=>{
    const open = e.target.closest("[data-open]");
    const order = e.target.closest("[data-order]");
    if (open) openProduct(open.dataset.open);
    if (order && !order.disabled) orderProduct(order.dataset.order, "N/A", "N/A");
  });
  
  document.getElementById("dialogClose").addEventListener("click",()=>document.getElementById("productDialog").close());
  document.getElementById("productDialog").addEventListener("click",e=>{if(e.target.id==="productDialog")e.target.close();});
  document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("mainNav").classList.toggle("open"));
});
