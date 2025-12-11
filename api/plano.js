import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API,
  authDomain: process.env.FIREBASE_AUTH,
  projectId: process.env.FIREBASE_PROJECT,
};

if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();

export default async function handler(req, res) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return res.status(401).json({ plano: "free" });
    }

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return res.status(200).json({ plano: "free" });
    }

    return res.status(200).json({ plano: snap.data().plano || "free" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ plano: "free" });
  }
}
