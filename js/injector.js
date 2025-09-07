// js/injector.js
(function () {
  "use strict";

  // Utilitaire: normalise les chemins (retire trailing slash, index.html, etc.)
  function normalizePath(path) {
    try {
      // En cas d'URL absolue
      const url = new URL(path, location.origin);
      path = url.pathname;
    } catch (_) {}
    // Retire le trailing slash (sauf racine)
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    // Transforme / -> /index.html pour matching simple
    if (path === "") path = "/";
    return path;
  }

  const CURRENT_PATH = normalizePath(location.pathname);

  function reexecuteScripts(container) {
    const scripts = container.querySelectorAll("script");
    scripts.forEach((old) => {
      const s = document.createElement("script");
      // Copie des attributs (type, src, etc.)
      for (const { name, value } of old.attributes) {
        s.setAttribute(name, value);
      }
      // Si inline
      if (!s.src) s.text = old.textContent;
      old.replaceWith(s);
    });
  }

  function markActiveNav(root) {
    if (!root) return;
    // Sélectionne tous les liens internes (nav + sous-menu + mobile)
    const links = root.querySelectorAll('a[href]:not([href^="http"]):not([href^="mailto:"])');
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;

      // Calcule le path cible
      let target;
      if (href.startsWith("#")) {
        // Ancre de la page courante
        target = CURRENT_PATH;
      } else {
        try {
          target = normalizePath(new URL(href, location.origin).pathname);
        } catch (_) {
          target = normalizePath(href);
        }
      }

      // Règle simple:
      // - la page index : "/" ou "/index.html" considère BOTH comme actifs
      // - sinon, match exact
      const isIndex = CURRENT_PATH === "/" || CURRENT_PATH.endsWith("/index.html");
      const targetIsIndex = target === "/" || target.endsWith("/index.html");

      const match =
        (isIndex && targetIsIndex) ||
        (!isIndex && target === CURRENT_PATH);

      if (match) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      } else {
        a.classList.remove("is-active");
        a.removeAttribute("aria-current");
      }
    });
  }

  function wireHeaderAccessibility(root) {
    if (!root) return;
    // Burger: synchronise aria-expanded sur le label
    const toggle = root.querySelector("#nav-toggle");
    const label = root.querySelector('label[for="nav-toggle"]');
    if (toggle && label) {
      const sync = () => label.setAttribute("aria-expanded", String(!!toggle.checked));
      toggle.addEventListener("change", sync);
      // init
      sync();
    }
  }

  function injectFragment(targetId, url, fallbackHTML) {
    const slot = document.getElementById(targetId);
    if (!slot) return Promise.resolve();

    return fetch(url, { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then((html) => {
        slot.innerHTML = html;
        // Ré-exécute les scripts du fragment
        reexecuteScripts(slot);

        // Post-traitements spécifiques header
        if (targetId === "site-header") {
          markActiveNav(slot);
          wireHeaderAccessibility(slot);
        }
      })
      .catch((err) => {
        console.warn(`[injector] Échec d'injection ${url}:`, err);
        slot.innerHTML =
          fallbackHTML ||
          (targetId === "site-header"
            ? '<div class="nav"><a class="brand" href="index.html" style="color:#fff;text-decoration:none;font-weight:800">Printemps des Marais</a></div>'
            : '<div style="padding:1rem;text-align:center;color:#fff;background:#222">© ' +
              new Date().getFullYear() +
              " Printemps des Marais — Association loi 1901</div>");
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Injecte header & footer
    Promise.all([
      injectFragment("site-header", "header.html"),
      injectFragment("site-footer", "footer.html"),
    ]).then(() => {
      // En cas de navigation par hash (facultatif pour marquer actif)
      window.addEventListener("hashchange", () => {
        const header = document.getElementById("site-header");
        markActiveNav(header);
      });
    });
  });
})();
