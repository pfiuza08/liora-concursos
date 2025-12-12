// /api/test-firebase.js
import { db } from "../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    console.log("🟦 Teste Firebase Admin iniciado");

    const ref = db.collection("debug").doc("ping");
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set({ ok: true, createdAt: Date.now() });
    }

    return res.status(200).json({
      ok: true,
      firestore: "connected",
      exists: snap.exists,
    });

  } catch (err) {
    console.error("❌ Teste Firebase falhou:", err);
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
