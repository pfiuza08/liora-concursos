// =========================================================
// 🔍 /api/plano — Consulta segura do plano do usuário
// =========================================================

import { db, adminAuth } from "../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  console.log("🟠 [/api/plano] Iniciado...");

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log("🟡 Sem Authorization header → FREE");
      return res.status(200).json({ plano: "free" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("🟡 Authorization sem token → FREE");
      return res.status(200).json({ plano: "free" });
    }

    console.log("🔑 Token recebido:", token.substring(0, 25) + "...");

    // Verifica o token JWT
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    console.log("👤 UID decodificado:", uid);

    // Consulta Firestore
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      console.log("📄 Usuário sem documento → FREE");
      return res.status(200).json({ plano: "free" });
    }

    const plano = snap.data().plano || "free";
    console.log("🏅 Plano encontrado:", plano);

    return res.status(200).json({ plano });

  } catch (err) {
    console.error("🔥 ERRO FINAL EM /api/plano:", err);
    // O frontend sempre deve receber JSON válido
    return res.status(200).json({ plano: "free" });
  }
}
