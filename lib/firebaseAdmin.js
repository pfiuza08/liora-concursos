// ================================
// 🔥 Firebase Admin para ESM + Vercel
// ================================

import pkg from "firebase-admin";
const { initializeApp, cert, getApps } = pkg;

import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Garante que o Firebase Admin só inicializa uma vez
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = getFirestore();
export const adminAuth = getAuth();
