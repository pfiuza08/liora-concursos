import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

if (!getApps().length) initializeApp({
  projectId: process.env.FIREBASE_PROJECT,
});

const db = getFirestore();

export default async function handler(req, res) {
  try {
    const evento = req.body;

    // 1. E-mail do comprador
    const email = evento?.buyer?.email;
    if (!email) return res.status(200).end();

    // 2. Evento: approved / refunded / chargeback
    const status = evento?.purchase?.status;

    let plano = "free";
    if (status === "approved") plano = "premium";
    if (status === "refunded") plano = "free";
    if (status === "chargeback") plano = "free";

    // 3. Atualizar Firestore
    const ref = doc(db, "users", email);
    await setDoc(ref, {
      email,
      plano,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Erro webhook:", e);
    return res.status(500).json({ ok: false });
  }
}
