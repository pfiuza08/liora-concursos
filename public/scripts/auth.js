// ======================================================
// 🔐 LIORA — AUTH CORE v3 (FIREBASE | CANÔNICO)
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// ------------------------------------------------------
// 🌍 API GLOBAL
// ------------------------------------------------------
window.lioraAuth = {
  user: null,
  premium: false,
  loading: false,
  error: null,

  // -------------------------------
  // LOGIN
  // -------------------------------
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error("E-mail e senha são obrigatórios.");
    }

    try {
      this.loading = true;
      this.error = null;

      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err) {
      this.error = traduzErroFirebase(err);
      throw err;
    } finally {
      this.loading = false;
    }
  },

  // -------------------------------
  // CADASTRO
  // -------------------------------
  async cadastro({ email, password }) {
    if (!email || !password) {
      throw new Error("E-mail e senha são obrigatórios.");
    }

    try {
      this.loading = true;
      this.error = null;

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      this.premium = false;
      return cred.user;
    } catch (err) {
      this.error = traduzErroFirebase(err);
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
// 👤 AUTH STATE LISTENER
// ------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  window.lioraAuth.user = user || null;
  window.lioraAuth.premium = false;

  window.lioraUserPlan = user ? "free" : "free";

  document.body.classList.toggle("liora-auth-on", !!user);
  document.body.classList.toggle("liora-auth-off", !user);

  window.dispatchEvent(new Event("liora:auth-changed"));
});

console.log("🔐 auth.js v3 carregado");

// ------------------------------------------------------
// 🔤 ERROS FIREBASE
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
    default:
      return "Erro de autenticação.";
  }
}
