// =========================================================
// Firebase Admin compatível com Vercel (ESM + firebase-admin v11+)
// =========================================================

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

console.log("🔥 firebaseAdmin.js carregado");

// Evita múltipla inicialização
if (!getApps().length) {
  console.log("⚙️ Inicializando Firebase Admin...");
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = getFirestore();
export const adminAuth = getAuth();
