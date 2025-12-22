// ======================================================
// LIORA — AUTENTICAÇÃO v2.1 (Firebase Auth + Premium Hooks)
// ------------------------------------------------------
// - Login, cadastro, logout
// - Sessão persistente
// - Estados: user, premium, loading, error
// - Eventos globais:
//    - liora:auth-changed
//    - liora:login-required
//    - liora:premium-bloqueado
// - API global: window.lioraAuth
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
// 🌍 API Global da Liora
// ------------------------------------------------------
window.lioraAuth = {
  user: null,
  premium: false, // por enquanto sempre false (freemium)
  loading: false,
  error: null,

  // LOGIN
  login: async (email, senha) => {
    try {
      window.lioraAuth.loading = true;
      window.lioraAuth.error = null;

      const cred = await signInWithEmailAndPassword(auth, email, senha);
      return cred.user;
    } catch (err) {
      console.error("Erro login:", err);
      window.lioraAuth.error = traduzErroFirebase(err);
      throw err;
    } finally {
      window.lioraAuth.loading = false;
      window.dispatchEvent(new Event("liora:auth-ui-update"));
    }
  },

  // CADASTRO
  cadastro: async (email, senha) => {
    try {
      window.lioraAuth.loading = true;
      window.lioraAuth.error = null;

      const cred = await createUserWithEmailAndPassword(auth, email, senha);

      // Novo usuário começa no plano FREE
      window.lioraAuth.premium = false;

      return cred.user;
    } catch (err) {
      console.error("Erro cadastro:", err);
      window.lioraAuth.error = traduzErroFirebase(err);
      throw err;
    } finally {
      window.lioraAuth.loading = false;
      window.dispatchEvent(new Event("liora:auth-ui-update"));
    }
  },

  // LOGOUT
  logout: async () => {
    await signOut(auth);
  },

  // 🔒 Proteção de recurso premium
  // - Se não logado → dispara liora:login-required
  // - Se logado mas FREE → dispara liora:premium-bloqueado
  // - Se premium → retorna true
 exigirPremium: () => {
  const state = window.lioraState;

  // 🚫 Estado ainda não inicializado (defensivo)
  if (!state) {
    console.warn("⚠️ exigirPremium chamado antes do lioraState");
    return false;
  }

  // 🚫 Não logado
  if (!state.logged) {
    console.log("🔐 Premium bloqueado → login necessário");
    window.dispatchEvent(new Event("liora:login-required"));
    return false;
  }

  // 🚫 Logado, mas não premium
  if (state.plan !== "premium") {
    console.log("💎 Premium bloqueado → upgrade necessário");
    window.dispatchEvent(new Event("liora:premium-bloqueado"));
    return false;
  }

  // ✅ Tudo ok
  return true;
},
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

    // TODO backend
    window.lioraAuth.premium = false;

    // 🔑 PLANO CANÔNICO (ESSENCIAL)
    window.lioraUserPlan = window.lioraAuth.premium ? "premium" : "free";
  } else {
    console.log("🔴 Usuário deslogado");
    document.body.classList.add("liora-auth-off");
    document.body.classList.remove("liora-auth-on");

    window.lioraAuth.premium = false;
    window.lioraUserPlan = "free";
  }

  window.lioraAuth.error = null;

  // 🔥 FORÇA PROPAGAÇÃO REAL
  setTimeout(() => {
    console.log("🔔 Disparando liora:auth-changed (forçado)");
    window.dispatchEvent(new Event("liora:auth-changed"));
  }, 0);
});


console.log("🔐 Liora Auth v2.1 carregado.");

// ------------------------------------------------------
// 🔤 Tradução simples de erros Firebase
// ------------------------------------------------------
function traduzErroFirebase(err) {
  if (!err || !err.code) return "Ocorreu um erro. Tente novamente.";

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
      return "Erro de autenticação. Tente novamente.";
  }
}
// ======================================================
// 🎛️ AUTH UI BINDINGS — BOTÕES ENTRAR / SAIR (CANÔNICO)
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar = document.getElementById("btn-auth-toggle");
  const btnSair = document.getElementById("btn-logout");

  // -----------------------------------
  // 🔐 BOTÃO ENTRAR (ABRE MODAL)
  // -----------------------------------
  if (btnEntrar && !btnEntrar.dataset.bound) {
    btnEntrar.dataset.bound = "1"; // 🛡️ blindagem

    btnEntrar.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("🔐 Clique em ENTRAR");
      window.lioraModal.open("liora-auth-modal");
    });
  }

  // -----------------------------------
  // 🚪 BOTÃO SAIR (LOGOUT)
  // -----------------------------------
  if (btnSair && !btnSair.dataset.bound) {
    btnSair.dataset.bound = "1"; // 🛡️ blindagem

    btnSair.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("🚪 Clique em SAIR");
      try {
        await window.lioraAuth.logout();
      } catch (err) {
        console.error("Erro no logout:", err);
      }
    });
  }
});

  // --------------------------------------------
  // 🔄 Atualiza UI quando auth muda
  // --------------------------------------------
  function atualizarAuthUI() {
    const user = window.lioraAuth?.user;

    if (user) {
      btnEntrar?.classList.add("hidden");
      btnSair?.classList.remove("hidden");
    } else {
      btnSair?.classList.add("hidden");
      btnEntrar?.classList.remove("hidden");
    }
  }

  window.addEventListener("liora:auth-changed", atualizarAuthUI);
  atualizarAuthUI();
});

