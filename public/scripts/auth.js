// ======================================================
// LIORA — AUTENTICAÇÃO v2 (Firebase Auth + Premium Hooks)
// ------------------------------------------------------
// - Login e cadastro com feedback
// - Indicador de estado: loading, erro, sucesso
// - Proteção automática de recursos premium
// - Evento global para todas as telas reagirem
// - Exposição: window.lioraAuth
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
// 🔧 CONFIGURAÇÃO FIREBASE
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

// Mantém usuário entre sessões
setPersistence(auth, browserLocalPersistence);

// ------------------------------------------------------
// 🌍 API Global da Liora (v2)
// ------------------------------------------------------
window.lioraAuth = {
  user: null,
  premium: false,              // 🔑 habilita recursos premium
  loading: false,
  error: null,

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  login: async (email, senha) => {
    try {
      window.lioraAuth.loading = true;
      window.lioraAuth.error = null;

      const cred = await signInWithEmailAndPassword(auth, email, senha);

      return cred.user;
    } catch (err) {
      console.error("Erro login:", err);
      window.lioraAuth.error = err.message || "Erro ao entrar";
      throw err;
    } finally {
      window.lioraAuth.loading = false;
    }
  },

  // --------------------------------------------------
  // CADASTRO
  // --------------------------------------------------
  cadastro: async (email, senha) => {
    try {
      window.lioraAuth.loading = true;
      window.lioraAuth.error = null;

      const cred = await createUserWithEmailAndPassword(auth, email, senha);

      // 🔥 Novo usuário → plano gratuito por padrão
      window.lioraAuth.premium = false;

      return cred.user;
    } catch (err) {
      console.error("Erro cadastro:", err);
      window.lioraAuth.error = err.message || "Erro ao criar conta";
      throw err;
    } finally {
      window.lioraAuth.loading = false;
    }
  },

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  logout: async () => {
    await signOut(auth);
  },

  // --------------------------------------------------
  // 🔒 Proteção de recurso premium
  // --------------------------------------------------
  exigirPremium: () => {
    if (!window.lioraAuth.premium) {
      window.dispatchEvent(new Event("liora:premium-bloqueado"));
      return false;
    }
    return true;
  }
};

// ------------------------------------------------------
// 👤 Listener de Autenticação
// ------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  window.lioraAuth.user = user;

  if (user) {
    console.log("🟢 Usuário logado:", user.email);
    document.body.classList.add("liora-auth-on");
    document.body.classList.remove("liora-auth-off");

    // Carrega status premium do backend futuramente.
    // Por enquanto: FREE sempre.
    window.lioraAuth.premium = false;

  } else {
    console.log("🔴 Usuário deslogado");
    document.body.classList.add("liora-auth-off");
    document.body.classList.remove("liora-auth-on");

    window.lioraAuth.premium = false;
  }

  // Evento para qualquer módulo reagir
  window.dispatchEvent(new Event("liora:auth-changed"));
});

console.log("🔐 Liora Auth v2 carregado.");
