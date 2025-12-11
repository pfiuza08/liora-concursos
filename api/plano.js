import { db, adminAuth } from "../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const tokenHeader = req.headers.authorization;

    if (!tokenHeader) return res.status(200).json({ plano: "free" });

    const token = tokenHeader.split(" ")[1];
    if (!token) return res.status(200).json({ plano: "free" });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await db.collection("users").doc(uid).get();

    return res.status(200).json({
      plano: snap.exists ? snap.data().plano || "free" : "free"
    });

  } catch (err) {
    console.error("🔥 ERRO /api/plano:", err);
    return res.status(200).json({ plano: "free" });
  }
}
