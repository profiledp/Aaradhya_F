/* ==========================================================
   AARADHYA MART — SHARED MODULE (v2)
   Single source of truth for Firebase, cart, phone, toasts.
   ========================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
export const REVIEW_KEY = "aaradhyaReviewTimes";
export const REVIEW_COOLDOWN_MS = 60 * 1000;

/* ---------- Phone normalization ---------- */
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

/* ---------- Order ID normalization ---------- */
export function normalizeOrderId(input) {
  return String(input || "").trim().toUpperCase();
}

/* ---------- Cart helpers ---------- */
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

/* ---------- Toast (single source of truth) ---------- */
let _toastTimer = null;
export function showToast(message, type = "success") {
  const isError = type === "error";
  let t = document.querySelector(".premium-toast");
  if (t) t.remove();
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }

  const toast = document.createElement("div");
  toast.className = "premium-toast" + (isError ? " is-error" : "");
  toast.innerHTML = `<span>${isError ? "⚠️" : "✅"}</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  _toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ---------- Review rate limit (client-side) ---------- */
export function canSubmitReview(productId) {
  try {
    const raw = localStorage.getItem(REVIEW_KEY) || "{}";
    const times = JSON.parse(raw);
    const last = Number(times[productId] || 0);
    return Date.now() - last > REVIEW_COOLDOWN_MS;
  } catch { return true; }
}
export function markReviewSubmitted(productId) {
  try {
    const raw = localStorage.getItem(REVIEW_KEY) || "{}";
    const times = JSON.parse(raw);
    times[productId] = Date.now();
    localStorage.setItem(REVIEW_KEY, JSON.stringify(times));
  } catch { /* ignore */ }
}

/* ---------- Fly-to-cart ---------- */
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
}z
