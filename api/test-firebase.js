// /api/test-firebase.js
import * as admin from "firebase-admin";

export default async function handler(req, res) {
  try {
    console.log("🟦 Teste Firebase Admin iniciado");

    // 1. Verifica se o Admin já existe
    if (admin.apps.length === 0) {
      console.log("🟨 Nenhum app Firebase Admin encontrado. Inicializando...");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log("🟩 Firebase Admin inicializado com sucesso");
    } else {
      console.log("🟩 Firebase Admin já estava inicializado");
    }

    // 2. Teste de Firestore
    const db = admin.firestore();
    console.log("🟦 Conectado ao Firestore. Testando leitura...");

    // 3. Testa leitura simples
    const testDoc = await db.collection("debug_test").doc("ping").get();

    let data;
    if (testDoc.exists) {
      data = testDoc.data();
      console.log("🟩 Documento encontrado:", data);
    } else {
      console.log("🟨 Documento não existe, criando...");
      await testDoc.ref.set({ ok: true, timestamp: Date.now() });
      data = { created: true };
    }

    return res.status(200).json({
      ok: true,
      firebaseAdminLoaded: true,
      firestoreWorking: true,
      data,
    });

  } catch (err) {
    console.error("❌ TESTE FALHOU:", err);
    return res.status(500).json({
      ok: false,
      error: err.message,
      stack: err.stack,
    });
  }
}
