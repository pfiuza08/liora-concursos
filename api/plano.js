import { db, adminAuth } from "../../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  console.log("📡 /api/plano chamado");

  try {
    const header = req.headers.authorization;
    if (!header) {
      console.log("⚠️ Sem token → free");
      return res.status(200).json({ plano: "free" });
    }

    const token = header.split(" ")[1];
    if (!token) {
      console.log("⚠️ Token vazio → free");
      return res.status(200).json({ plano: "free" });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    console.log("👤 UID:", decoded.uid);

    const snap = await db.collection("users").doc(decoded.uid).get();

    if (!snap.exists) {
      console.log("📄 Usuário sem doc → free");
      return res.status(200).json({ plano: "free" });
    }

    console.log("🏷️ Plano Firestore:", snap.data().plano);

    return res.status(200).json({
      plano: snap.data().plano || "free",
    });

  } catch (err) {
    console.error("🔥 ERRO /api/plano:", err);
    return res.status(200).json({ plano: "free" });
  }
}
