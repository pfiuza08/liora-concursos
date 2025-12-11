// /api/test-admin.js
// Teste definitivo para Firebase Admin no Vercel.
// Se isso falhar, o problema é AMBIENTE (variáveis) ou FORMATO DA CHAVE.

import { db, adminAuth } from "../../lib/firebaseAdmin.js";

export default async function handler(req, res) {
  try {
    console.log("🔥 Teste: Início /api/test-admin");

    // 1. Verifica se adminAuth existe
    if (!adminAuth) {
      throw new Error("adminAuth NÃO foi carregado!");
    }

    console.log("🟢 adminAuth carregado com sucesso.");

    // 2. Tenta pegar o App atual
    const user = await adminAuth.getUserByEmail("pfiuza.castro@gmail.com")
      .catch(() => null);

    console.log("👤 Resultado getUserByEmail:", user?.uid || "Usuário não encontrado (mas Admin funciona)");

    // 3. Teste Firestore básico
    console.log("📚 Testando Firestore...");
    const testDoc = db.collection("debug").doc("vercel-admin-test");

    await testDoc.set({
      ok: true,
      timestamp: Date.now()
    });

    const snap = await testDoc.get();

    console.log("📄 Leitura Firestore:", snap.data());

    return res.status(200).json({
      status: "ok",
      admin: true,
      firestoreWrite: snap.data(),
      message: "Firebase Admin funcionando no Vercel!"
    });

  } catch (err) {
    console.error("❌ ERRO TESTE ADMIN:", err);
    return res.status(500).json({
      status: "erro",
      message: err.message,
      stack: err.stack
    });
  }
}
