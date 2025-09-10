// js/home-news.js
// Insère automatiquement les 3 derniers articles de actus.html dans la home

(async function(){
  try {
    const res = await fetch("actus.html");
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // Récupère les 3 premiers .post
    const posts = [...doc.querySelectorAll(".post")].slice(0,3);

    const container = document.getElementById("home-news-list");
    if (!container) return;

    posts.forEach(post => {
      const clone = post.cloneNode(true);

      // Ajoute bouton "Lire" si absent
      const link = clone.querySelector("a.text-link");
      if (link && !clone.querySelector(".nav-button")) {
        const btn = document.createElement("a");
        btn.href = link.href;
        btn.className = "nav-button";
        btn.textContent = "Lire";
        clone.querySelector(".post-body").appendChild(btn);
      }

      clone.classList.add("news-card");
      container.appendChild(clone);
    });
  } catch (err) {
    console.error("Impossible de charger les actualités :", err);
  }
})();
