import { db, adminAuth } from "../../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    console.log("📌 /api/plano — início");

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("📌 Sem token → free");
      return res.status(200).json({ plano: "free" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(200).json({ plano: "free" });

    // Verifica o token
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    console.log("📌 UID:", uid);

    const snap = await db.collection("users").doc(uid).get();

    const plano = snap.exists ? snap.data().plano || "free" : "free";

    console.log("📌 Plano encontrado:", plano);

    return res.status(200).json({ plano });

  } catch (err) {
    console.error("🔥 ERRO /api/plano:", err);
    return res.status(200).json({ plano: "free" });
  }
}
