// =============================================================
// 🔐 LIORA AUTH v1
// - Firebase Auth (Email + Google)
// - Estado global window.lioraUser
// - Eventos: liora:user-login | liora:user-logout
// =============================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ------------------------------------------------------
// 1) CONFIG DO FIREBASE (substituir pelos seus dados)
// ------------------------------------------------------
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MSG_ID",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Estado global
window.lioraUser = null;

// ------------------------------------------------------
// 2) OBSERVADOR DE LOGIN
// ------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.lioraUser = user;
    console.log("🔐 Usuário logado:", user.email);

    window.dispatchEvent(new CustomEvent("liora:user-login", { detail: user }));
  } else {
    window.lioraUser = null;
    console.log("🔐 Nenhum usuário logado.");

    window.dispatchEvent(new CustomEvent("liora:user-logout"));
  }
});

// ------------------------------------------------------
// 3) FUNÇÕES DE LOGIN / CADASTRO
// ------------------------------------------------------
window.lioraAuth = {
  loginEmail: async (email, senha) => {
    return signInWithEmailAndPassword(auth, email, senha);
  },

  cadastroEmail: async (email, senha) => {
    return createUserWithEmailAndPassword(auth, email, senha);
  },

  loginGoogle: async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  },

  logout: async () => {
    return signOut(auth);
  },

  getUser: () => window.lioraUser,
};
