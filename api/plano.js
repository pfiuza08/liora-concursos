import { auth, db } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ plano: "free" });
    }

    // 1. Validar token via Firebase Admin
    const decoded = await auth.verifyIdToken(token);

    const uid = decoded.uid;

    // 2. Consultar Firestore
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(200).json({ plano: "free" });
    }

    const data = snap.data();
    const plano = data?.plano || "free";

    return res.status(200).json({ plano });
  } catch (err) {
    console.error("🔥 Erro ao consultar plano:", err);
    return res.status(500).json({ plano: "free" });
  }
}

