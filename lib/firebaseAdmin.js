// ===============================================================
// 🔥 Firebase Admin — Nova API Modular (v11+) para Vercel + ESM
// ===============================================================

import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Garante que só inicializa uma vez no ambiente serverless da Vercel
let app;

if (!getApps().length) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

  console.log("🔥 Firebase Admin inicializado (nova API v11).");
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const db = getFirestore(app);
