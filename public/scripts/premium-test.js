// ==========================================================
// 🧪 LIORA — PREMIUM TEST USERS
// ==========================================================

(function () {
  const PREMIUM_TEST_EMAILS = [
    "pfiuza.castro@gmail.com",
    "taruk@gmail.com",
    "teste.premium@liora.ai"
  ];

  function checkPremiumTestUser(user) {
    if (!user?.email) return false;
    return PREMIUM_TEST_EMAILS.includes(user.email.toLowerCase());
  }

  window.lioraPremiumTest = {
    isPremium(user) {
      return checkPremiumTestUser(user);
    }
  };
})();
