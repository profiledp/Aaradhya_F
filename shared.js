/* ==========================================================
   AARADHYA MART — SHARED MODULE (WITH SIDE OFFERS)
   ========================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAffhI69b-piezGsdI5E1lUVcNj9nobG8Y",
  authDomain: "aaradhya-mart.firebaseapp.com",
  projectId: "aaradhya-mart",
  storageBucket: "aaradhya-mart.firebasestorage.app",
  messagingSenderId: "146782544824",
  appId: "1:146782544824:web:d605e1971d3480fab1654d"
};

let _app = null;
let _db = null;
export function getApp() {
  if (!_app) _app = initializeApp(FIREBASE_CONFIG);
  return _app;
}
export function getDb() {
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

export const WHATSAPP_NUMBER = "918931911428";
export const CART_KEY = "aaradhyaMartCart";
export const MY_ORDERS_KEY = "aaradhyaMyOrders";

/* ---------- Phone ---------- */
export function normalizePhone(input) {
  if (!input) return "";
  let digits = String(input).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 10) return "";
  if (!/^[6-9]/.test(digits)) return "";
  return digits;
}
export function isValidPhone(input) {
  return normalizePhone(input) !== "";
}
export function normalizeOrderId(input) {
  return String(input || "").trim().toUpperCase();
}

/* ---------- Cart ---------- */
export function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}
export function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
export function cartCount() {
  return readCart().reduce((sum, i) => sum + (Number(i.qty) || 1), 0);
}
export function addToCart(item) {
  const cart = readCart();
  const existing = cart.find(
    (c) => c.id === item.id && c.size === item.size && c.color === item.color
  );
  if (existing) existing.qty = (Number(existing.qty) || 1) + 1;
  else cart.push({ ...item, qty: 1 });
  writeCart(cart);
  return cart;
}
export function updateCartBadge() {
  const badge = document.getElementById("globalCartCount");
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.background = count === 0 ? "#ccc" : "var(--gold)";
  badge.style.color = count === 0 ? "#fff" : "var(--navy)";
}

/* ---------- Toast ---------- */
export function showToast(message, icon = "✅") {
  let t = document.querySelector(".toast-notification");
  if (t) t.remove();
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/* ---------- Fly to cart ---------- */
export function flyToCart(imgSrc, btnElement) {
  const cartBtn = document.getElementById("globalCartBtn");
  const cartBadge = document.getElementById("globalCartCount");
  if (!cartBtn) return;
  const img = document.createElement("img");
  img.src = imgSrc;
  img.className = "fly-image-anim";
  const s = btnElement.getBoundingClientRect();
  const e = cartBtn.getBoundingClientRect();
  img.style.left = s.left + "px";
  img.style.top = s.top + "px";
  img.style.width = s.width + "px";
  img.style.height = s.height + "px";
  document.body.appendChild(img);
  requestAnimationFrame(() => {
    img.style.left = e.left + e.width / 2 - 15 + "px";
    img.style.top = e.top + e.height / 2 - 15 + "px";
    img.style.width = "30px";
    img.style.height = "30px";
    img.style.opacity = "0.5";
  });
  setTimeout(() => {
    img.remove();
    if (cartBadge) {
      cartBadge.classList.add("bounce-anim");
      setTimeout(() => cartBadge.classList.remove("bounce-anim"), 500);
    }
  }, 800);
}

/* ==========================================================
   SIDE OFFER BANNERS
   ========================================================== */
export async function loadSideOffers() {
  // data-no-offers वाले पेज पर न चले (admin, checkout)
  if (document.body.dataset.noOffers !== undefined) return;

  try {
    const db = getDb();
    const q = query(collection(db, "sideOffers"), where("active", "==", true));
    const snap = await getDocs(q);
    const today = new Date().toISOString().split("T")[0];
    const offers = [];

    snap.forEach((docSnap) => {
      const o = docSnap.data();
      if (o.startDate && today < o.startDate) return;
      if (o.endDate && today > o.endDate) return;
      offers.push({ id: docSnap.id, ...o });
    });

    renderSideOffers(offers);
  } catch (err) {
    console.warn("Side offers load failed:", err);
  }
}

function renderSideOffers(offers) {
  document.querySelectorAll(".side-offer-banner").forEach((el) => el.remove());

  offers.forEach((offer) => {
    // localStorage में बंद किया गया याद रखें (7 दिन)
    const closeKey = "offerClosed_" + offer.id;
    const closedAt = localStorage.getItem(closeKey);
    if (closedAt && Date.now() - Number(closedAt) < 7 * 24 * 60 * 60 * 1000) return;

    const banner = document.createElement("div");
    banner.className = `side-offer-banner side-${offer.position || "right"}`;
    if (offer.mobileShow) banner.classList.add("mobile-show");

    banner.innerHTML = `
      ${offer.closeable !== false ? `<button class="side-offer-close" aria-label="Close">✕</button>` : ""}
      <a href="${offer.link || "#"}" ${offer.link?.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>
        <img src="${offer.image}" alt="Special Offer" loading="lazy">
      </a>
    `;
    document.body.appendChild(banner);

    const closeBtn = banner.querySelector(".side-offer-close");
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        localStorage.setItem(closeKey, Date.now());
        banner.remove();
      };
    }
  });
}

// हर पेज पर auto-load
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSideOffers);
  } else {
    loadSideOffers();
  }
}
