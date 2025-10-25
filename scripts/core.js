// ==========================================================
// 🌙 Tema funcional (escuro por padrão, claro opcional)
// ==========================================================
const body = document.body;
const themeBtn = document.getElementById('btn-theme');

function setTheme(mode) {
  body.classList.add('fading');
  setTimeout(() => {
    if (mode === 'light') {
      body.classList.add('light');
      localStorage.setItem('liora_theme', 'light');
      themeBtn.textContent = '☀️';
    } else {
      body.classList.remove('light');
      localStorage.setItem('liora_theme', 'dark');
      themeBtn.textContent = '🌙';
    }
    body.classList.remove('fading');
  }, 150);
}

// alternar manualmente
themeBtn?.addEventListener('click', () => {
  const current = body.classList.contains('light') ? 'light' : 'dark';
  setTheme(current === 'light' ? 'dark' : 'light');
});

// aplicar preferido ou padrão
const saved = localStorage.getItem('liora_theme') || 'dark';
setTheme(saved);
