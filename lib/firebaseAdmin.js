// lib/firebaseAdmin.js
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("❌ Variáveis do Firebase Admin não estão completas");
}

const app =
  getApps().length === 0
    ? initializeApp({
        projectId,
        credential: {
          getAccessToken: async () => ({
            access_token: "",
            expires_in: 0,
          }),
        },
      })
    : getApps()[0];

export const db = getFirestore(app);
export const adminAuth = getAuth(app);
