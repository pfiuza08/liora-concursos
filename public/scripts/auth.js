// ======================================================
// 🔐 LIORA — AUTH CORE v3.2 (FIREBASE | CANÔNICO)
// ======================================================

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ------------------------------------------------------
// 🔧 FIREBASE CONFIG
// ------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBG2SFwUH-oebuOieWS5WbUtidbuSYgDLY",
  authDomain: "liora-d4e3e.firebaseapp.com",
  projectId: "liora-d4e3e",
  storageBucket: "liora-d4e3e.firebasestorage.app",
  messagingSenderId: "545087329216",
  appId: "1:545087329216:web:7955f259a753f6e2692e25",
};

// ------------------------------------------------------
// 🔥 FIREBASE INIT
// ------------------------------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "pt-BR";
setPersistence(auth, browserLocalPersistence);

// ------------------------------------------------------
// 🌍 API GLOBAL DA LIORA (ÚNICA FONTE DE VERDADE)
// ------------------------------------------------------
window.lioraAuth = {
  user: null,
  premium: false,
  loading: false,
  error: null,

  // -------------------------------
  // LOGIN
  // -------------------------------
  async login(email, senha) {
    console.log("🧪 LOGIN RECEBIDO:", { email, senha });

    if (!email || !senha) {
      throw new Error("E-mail e senha são obrigatórios.");
    }

    try {
      this.loading = true;
      this.error = null;

      const cred = await signInWithEmailAndPassword(auth, email, senha);
      return cred.user;

    } catch (err) {
      this.error = traduzErroFirebase(err);
      console.error("❌ Erro login:", err);
      throw err;

    } finally {
      this.loading = false;
    }
  },

  // -------------------------------
  // 🆕 CADASTRO
  // -------------------------------
  async cadastro(email, senha) {
    console.log("🧪 CADASTRO RECEBIDO:", { email, senha });

    if (!email || !senha) {
      throw new Error("E-mail e senha são obrigatórios.");
    }

    try {
      this.loading = true;
      this.error = null;

      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      this.premium = false;
      return cred.user;

    } catch (err) {
      this.error = traduzErroFirebase(err);
      console.error("❌ Erro cadastro:", err);
      throw err;

    } finally {
      this.loading = false;
    }
  },

  // -------------------------------
  // 🔁 RESET DE SENHA
  // -------------------------------
  async resetPassword(email) {
    if (!email) {
      throw new Error("Informe o e-mail para redefinir a senha.");
    }

    try {
      this.loading = true;
      this.error = null;

      await sendPasswordResetEmail(auth, email);
      console.log("📧 E-mail de redefinição enviado:", email);
      return true;

    } catch (err) {
      this.error = traduzErroFirebase(err);
      console.error("❌ Erro reset senha:", err);
      throw err;

    } finally {
      this.loading = false;
    }
  },

  // -------------------------------
  // LOGOUT
  // -------------------------------
  async logout() {
    await signOut(auth);
  }
};

// ------------------------------------------------------
// 👤 AUTH STATE LISTENER (ÚNICO)
// ------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  window.lioraAuth.user = user || null;
  window.lioraAuth.premium = false;

  window.dispatchEvent(new Event("liora:auth-changed"));

  console.log("🧪 AUTH STATE CHANGED:", {
    user: user?.email || null,
    time: new Date().toISOString()
  });
});

console.log("🔐 auth.js v3.2 carregado");

// ------------------------------------------------------
// 🔤 TRADUÇÃO DE ERROS FIREBASE
// ------------------------------------------------------
function traduzErroFirebase(err) {
  if (!err?.code) return "Erro inesperado. Tente novamente.";

  switch (err.code) {
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou senha incorretos.";
    case "auth/email-already-in-use":
      return "Este e-mail já está em uso.";
    case "auth/weak-password":
      return "A senha deve ter pelo menos 6 caracteres.";
    case "auth/invalid-credential":
      return "E-mail ou senha incorretos. Se esqueceu a senha, use a opção de redefinição.";
    default:
      return "Erro de autenticação.";
  }
}
