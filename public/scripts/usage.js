// ==========================================================
// 📊 LIORA — USAGE TRACKER v1
// Controle diário de uso (free)
// ==========================================================

(function () {
  console.log("📊 Liora Usage v1 carregado");

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function get(key) {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    if (data.date !== todayKey()) return { date: todayKey(), count: 0 };
    return data;
  }

  function inc(key) {
    const data = get(key);
    data.count += 1;
    localStorage.setItem(key, JSON.stringify(data));
    return data.count;
  }

  function count(key) {
    return get(key).count;
  }

  window.lioraUsage = {
    planos: {
      count: () => count("liora:planos"),
      inc: () => inc("liora:planos"),
    },
    simulados: {
      count: () => count("liora:simulados"),
      inc: () => inc("liora:simulados"),
    },
  };
})();
