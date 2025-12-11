// ======================================================
// 🔥 FIREBASE ADMIN DEBUG
// ======================================================

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

console.log("🧩 [DEBUG] Carregando firebaseAdmin.js");
console.log("🧩 FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("🧩 FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("🧩 PRIVATE_KEY LENGTH:", process.env.FIREBASE_PRIVATE_KEY?.length);

// Prepara privateKey corretamente
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey?.includes("\\n")) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

if (!getApps().length) {
  console.log("🚀 [DEBUG] Inicializando Firebase Admin SDK...");

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });

  console.log("✅ [DEBUG] Firebase Admin inicializado");
} else {
  console.log("ℹ️ [DEBUG] Firebase Admin já existia");
}

export const db = getFirestore();
export const adminAuth = getAuth();
