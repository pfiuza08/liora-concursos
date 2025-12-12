// /api/plano.js
import { adminAuth, db } from "../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token ausente" });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const doc = await db.collection("users").doc(uid).get();
    const plano = doc.exists ? doc.data().plano : "free";

    return res.status(200).json({ plano });

  } catch (err) {
    console.error("❌ Erro /api/plano:", err);
    return res.status(500).json({
      error: "Erro interno",
    });
  }
}
