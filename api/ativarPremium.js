// /api/ativarPremium.js
// ===============================================================
// Ativa o plano premium para um usuário
// Pode futuramente ser integrado ao Hotmart/Stripe via webhook
// ===============================================================

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// Config Firebase pelo .env (mesmo usado em outras rotas)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API,
  authDomain: process.env.FIREBASE_AUTH,
  projectId: process.env.FIREBASE_PROJECT,
};

if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID obrigatório" });
    }

    // Grava no Firestore: users/{uid}
    await setDoc(
      doc(db, "users", uid),
      {
        plano: "premium",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({
      status: "ok",
      uid,
      plano: "premium",
      message: "Plano premium ativado com sucesso.",
    });
  } catch (err) {
    console.error("🔥 Erro /api/ativarPremium:", err);
    return res.status(500).json({ error: "Falha ao ativar premium." });
  }
}
