/* ==========================================================
   AARADHYA MART — SHARED MODULE
   - Single Firebase config
   - Phone normalization
   - Cart helpers
   - Toast helpers
   - Order ID normalization
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

// Singleton — safe to import from multiple pages/modules
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

/* ---------- Phone normalization ---------- */
/**
 * Normalizes an Indian phone number to a bare 10-digit string.
 * Accepts: "9876543210", "+919876543210", "91 98765 43210",
 *          "09876543210", "98765-43210", " 9876543210 "
 * Returns "" if invalid.
 */
export function normalizePhone(input) {
  if (!input) return "";
  let digits = String(input).replace(/\D/g, "");
  // Strip country code 91 if present and length is 12
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  // Strip leading 0 (e.g. "09876543210")
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 10) return "";
  // Indian mobile numbers start with 6-9
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
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}
export function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
export function cartCount() {
  return readCart().reduce((sum, i) => sum + (Number(i.qty) || 1), 0);
}
export function addToCart(item) {
  const cart = readCart();
  // Merge if same id+size+color already exists
  const existing = cart.find(
    (c) => c.id === item.id && c.size === item.size && c.color === item.color
  );
  if (existing) {
    existing.qty = (Number(existing.qty) || 1) + 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
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

/* ---------- Toast helpers ---------- */
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

/* ---------- Fly-to-cart animation ---------- */
export function flyToCart(imgSrc, btnElement) {
  const cartBtn = document.getElementById("globalCartBtn");
  const cartBadge = document.getElementById("globalCartCount");
  if (!cartBtn) return;

  const img = document.createElement("img");
  img.src = imgSrc;
  img.className = "fly-image-anim";

  const startRect = btnElement.getBoundingClientRect();
  const endRect = cartBtn.getBoundingClientRect();

  img.style.left = startRect.left + "px";
  img.style.top = startRect.top + "px";
  img.style.width = startRect.width + "px";
  img.style.height = startRect.height + "px";
  document.body.appendChild(img);

  requestAnimationFrame(() => {
    img.style.left = endRect.left + endRect.width / 2 - 15 + "px";
    img.style.top = endRect.top + endRect.height / 2 - 15 + "px";
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