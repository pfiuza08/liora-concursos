// /api/plano.js
import { db, adminAuth } from "../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(200).json({ plano: "free" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await db.collection("users").doc(uid).get();

    if (!snap.exists) {
      return res.status(200).json({ plano: "free" });
    }

    const plano = snap.data().plano || "free";
    return res.status(200).json({ plano });

  } catch (err) {
    console.error("🔥 /api/plano erro:", err);
    return res.status(200).json({ plano: "free" });
  }
}
