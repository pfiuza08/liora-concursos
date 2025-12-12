import { db } from "../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const ref = db.collection("debug_test").doc("ping");
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set({ ok: true, createdAt: Date.now() });
    }

    return res.status(200).json({
      ok: true,
      firestore: "connected",
    });
  } catch (err) {
    console.error("🔥 TEST FIREBASE ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
