// ======================================================
// 🔥 /api/plano — DEBUG MODE
// ======================================================

import { db, adminAuth } from "../../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  console.log("📡 [DEBUG] /api/plano chamado");
  console.log("📡 Headers recebidos:", req.headers);

  try {
    const tokenHeader = req.headers.authorization;

    if (!tokenHeader) {
      console.log("⚠️ [DEBUG] Nenhum Authorization header");
      return res.status(200).json({ plano: "free" });
    }

    const token = tokenHeader.split(" ")[1];
    console.log("📡 [DEBUG] JWT recebido:", token?.substring(0, 20) + "...");

    if (!token) {
      console.log("⚠️ [DEBUG] Authorization sem Bearer token");
      return res.status(200).json({ plano: "free" });
    }

    // Valida token
    const decoded = await adminAuth.verifyIdToken(token);
    console.log("🧩 [DEBUG] Token decodificado:", decoded);

    const uid = decoded.uid;
    console.log("🧩 [DEBUG] UID:", uid);

    // Consulta Firestore
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();

    console.log("🧩 [DEBUG] Firestore snapshot exists?", snap.exists);
    console.log("🧩 [DEBUG] Firestore data:", snap.data());

    return res.status(200).json({
      plano: snap.exists ? snap.data().plano || "free" : "free",
    });

  } catch (err) {
    console.error("🔥🔥 [DEBUG] ERRO FINAL /api/plano:", err);

    // Enviar texto puro para debug avançado no frontend
    return res
      .status(200)
      .json({ plano: "free", error: "DEBUG: backend erro", detalhes: String(err) });
  }
}
