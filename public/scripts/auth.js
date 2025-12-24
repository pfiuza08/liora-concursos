// ======================================================
// 🔐 LIORA — AUTH CORE v3.1 (FIREBASE | CANÔNICO)
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
// 🌍 API GLOBAL DA LIORA
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
      console.error("Erro login:", err);
      this.error = traduzErroFirebase(err);
      throw err;

    } finally {
      this.loading = false;
    }
  },

  // -------------------------------
  // CADASTRO
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
      console.error("Erro cadastro:", err);
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

  // 🔥 ATUALIZA HEADER AQUI (CANÔNICO)
  const btnEntrar = document.getElementById("btn-auth-toggle");
  const btnSair = document.getElementById("btn-logout");
  const userInfo = document.getElementById("liora-user-info");
  const userName = document.getElementById("liora-user-name");
  const userStatus = document.getElementById("liora-user-status");

  if (user) {
    btnEntrar?.classList.add("hidden");
    btnSair?.classList.remove("hidden");

    userInfo?.classList.remove("hidden");
    if (userName) userName.textContent = user.email.split("@")[0];
    if (userStatus) userStatus.textContent = "Conta gratuita";

    console.log("👤 HEADER → logado:", user.email);
  } else {
    btnEntrar?.classList.remove("hidden");
    btnSair?.classList.add("hidden");
    userInfo?.classList.add("hidden");

    console.log("👤 HEADER → deslogado");
  }

  // mantém o evento para o resto do sistema
  window.dispatchEvent(new Event("liora:auth-changed"));
});


console.log("🔐 auth.js v3.1 carregado");

// ------------------------------------------------------
// 🚪 LOGOUT — BIND CANÔNICO
// ------------------------------------------------------
function bindLogoutButton() {
  const btnSair = document.getElementById("btn-logout");
  if (!btnSair || btnSair.dataset.bound === "1") return;

  btnSair.dataset.bound = "1";

  btnSair.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log("🚪 Logout solicitado");

    try {
      await window.lioraAuth.logout();
      // o onAuthStateChanged cuidará da UI
    } catch (err) {
      console.error("❌ Erro no logout:", err);
    }
  });
}

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
    default:
      return "Erro de autenticação.";
  }
}
// 🧪 TESTE A — LOG DE ESTADO REAL
window.addEventListener("liora:auth-changed", () => {
  console.log("🧪 AUTH STATE CHANGED:", {
    user: window.lioraAuth?.user,
    plan: window.lioraUserPlan,
    time: new Date().toISOString()
  });
});
