import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export default async function handler(req, res) {
  try {
    // Inicializa Admin SDK uma única vez
    if (!getApps().length) {
      initializeApp({
        credential: {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
      });
    }

    const auth = getAuth();
    const db = getFirestore();

    // Recuperar token enviado pelo front
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ plano: "free" });

    // Verificar token
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    // Consultar Firestore
    const snap = await db.collection("users").doc(uid).get();

    if (!snap.exists) {
      return res.status(200).json({ plano: "free" });
    }

    return res.status(200).json({
      plano: snap.data().plano || "free",
    });

  } catch (e) {
    console.error("🔥 ERRO /api/plano:", e);
    return res.status(500).json({ plano: "free" });
  }
}
