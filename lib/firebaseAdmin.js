// lib/firebaseAdmin.js
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app;

try {
  app = initializeApp({
    credential: applicationDefault(),
  });
  console.log("🟩 Firebase Admin inicializado (applicationDefault)");
} catch (err) {
  console.warn("🟨 Firebase Admin já estava inicializado");
}

export const db = getFirestore(app);
export const adminAuth = getAuth(app);
