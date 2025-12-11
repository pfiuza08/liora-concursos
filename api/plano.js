import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ plano: "free" });
    }

    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(200).json({ plano: "free" });
    }

    return res.status(200).json({
      plano: snap.data().plano || "free",
    });

  } catch (err) {
    console.error("🔥 ERRO /api/plano:", err);
    return res.status(500).json({ plano: "free" });
  }
}
