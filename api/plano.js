// /api/plano.js — Consulta real do plano do usuário (free/premium)
// =========================================================================
// Import Firebase (modo server-side em rotas Vercel)
// =========================================================================
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Configurações via variáveis de ambiente
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API,
  authDomain: process.env.FIREBASE_AUTH,
  projectId: process.env.FIREBASE_PROJECT,
};

// Evitar inicializações duplicadas
if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();

// =========================================================================
// HANDLER DA ROTA
// =========================================================================
export default async function handler(req, res) {
  try {
    const { uid } = req.query;

    if (!uid) {
      return res.status(400).json({
        plano: "free",
        error: "UID não informado",
      });
    }

    // users/{uid}
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return res.status(200).json({ plano: "free" });
    }

    const data = snap.data();

    return res.status(200).json({
      plano: data.plano || "free",
      atualizado: data.updatedAt || null,
    });
  } catch (err) {
    console.error("🔥 Erro no /api/plano:", err);
    return res.status(500).json({ plano: "free" });
  }
}
