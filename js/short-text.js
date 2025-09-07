// Ajoute automatiquement la classe .short aux textes courts dans les panels
document.addEventListener("DOMContentLoaded", () => {
  const candidates = document.querySelectorAll(".panel p, .panel li");

  candidates.forEach(el => {
    // Nettoyer le texte
    const text = el.textContent.trim();

    // Vérifier la longueur
    if (text.length > 0 && text.length <= 140) {
      el.classList.add("short");
    }
  });
});
