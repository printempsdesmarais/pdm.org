// Ajoute automatiquement la classe .short aux textes courts dans les panels
// - par défaut: <= 140 caractères
// - personnalisable: <div class="panel" data-short-max="120">
document.addEventListener("DOMContentLoaded", () => {
  const panels = document.querySelectorAll(".panel");
  panels.forEach(panel => {
    const max = parseInt(panel.getAttribute("data-short-max") || "140", 10);

    panel.querySelectorAll("p, li").forEach(el => {
      // Ignore si contient des éléments de média/blocs
      if (el.querySelector("img, video, figure, iframe")) return;

      // Texte nettoyé
      const txt = (el.textContent || "")
        .replace(/\s+/g, " ")
        .replace(/\u00A0/g, " ") // espace insécable
        .trim();

      if (txt.length > 0 && txt.length <= max) {
        el.classList.add("short");
      }
    });
  });
});
