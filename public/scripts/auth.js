// ======================================================
// LIORA — AUTENTICAÇÃO v1 (Firebase Auth Oficial)
// ------------------------------------------------------
// - Login com email/senha
// - Cadastro
// - Logout
// - Sessão persistente
// - Exposição global: window.lioraAuth
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ------------------------------------------------------
// Configuração fornecida por você
// ------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBG2SFwUH-oebuOieWS5WbUtidbuSYgDLY",
  authDomain: "liora-d4e3e.firebaseapp.com",
  projectId: "liora-d4e3e",
  storageBucket: "liora-d4e3e.firebasestorage.app",
  messagingSenderId: "545087329216",
  appId: "1:545087329216:web:7955f259a753f6e2692e25"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sessão persistente
setPersistence(auth, browserLocalPersistence);

// ------------------------------------------------------
// API de autenticação exposta globalmente
// ------------------------------------------------------
window.lioraAuth = {
  user: null,

  login: async (email, senha) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      return cred.user;
    } catch (err) {
      console.error("Erro login:", err);
      throw err;
    }
  },

  cadastro: async (email, senha) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      return cred.user;
    } catch (err) {
      console.error("Erro cadastro:", err);
      throw err;
    }
  },

  logout: async () => {
    return await signOut(auth);
  }
};

// ------------------------------------------------------
// Listener de mudança de usuário
// ------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  window.lioraAuth.user = user;

  if (user) {
    console.log("🟢 Usuário logado:", user.email);
    document.body.classList.add("liora-auth-on");
    document.body.classList.remove("liora-auth-off");
  } else {
    console.log("🔴 Usuário deslogado");
    document.body.classList.add("liora-auth-off");
    document.body.classList.remove("liora-auth-on");
  }

  // Dispara evento global
  window.dispatchEvent(new Event("liora:auth-changed"));
});

console.log("🔐 Liora Auth v1 carregado.");
