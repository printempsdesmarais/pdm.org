(function () {
  const featuredContainer = document.getElementById('home-featured');
  const newsContainer = document.getElementById('home-news');

  if (!featuredContainer && !newsContainer) return;

  const FEATURED_LIMIT = featuredContainer ? parseInt(featuredContainer.getAttribute('data-limit') || '1', 10) : 0;
  const NEWS_LIMIT = newsContainer ? parseInt(newsContainer.getAttribute('data-limit') || '3', 10) : 0;

  fetch('actus.html', { credentials: 'same-origin' })
    .then(r => r.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Déduplication par URL
      const usedKeys = new Set();
      const keyOf = (el) => el.querySelector('a[href]')?.getAttribute('href') || '';

      /* =========================
         1) À LA UNE (FEATURED)
         ========================= */
      if (featuredContainer) {
        // IMPORTANT : on respecte l'ORDRE DU DOCUMENT (aucun tri JS)
        const featured = Array
          .from(doc.querySelectorAll('.story-feature[data-include="home"]'))
          .slice(0, FEATURED_LIMIT);

        if (featured.length) {
          const frag = document.createDocumentFragment();
          featured.forEach(f => {
            const key = keyOf(f);
            if (key) usedKeys.add(key);

            // Clone, puis supprime toute .post-meta interne (ex: dates narratives "mai 2025")
            const cloned = f.cloneNode(true);
            cloned.querySelectorAll('.post-meta').forEach(n => n.remove());
            // Encapsule dans un wrap visuel
            const wrap = document.createElement('div');
            wrap.className = 'feature-wrap';
            wrap.appendChild(cloned);
            frag.appendChild(wrap);
          });
          featuredContainer.innerHTML = '';
          featuredContainer.appendChild(frag);
        } else {
          // Si pas de featured, on masque la section
          const section = document.getElementById('home-featured-section');
          if (section) section.style.display = 'none';
        }
      }

      /* =========================
         2) Dernières actualités
         ========================= */
      if (newsContainer) {
        // IMPORTANT : on respecte l'ORDRE DU DOCUMENT (aucun tri JS)
        const posts = Array.from(doc.querySelectorAll('.post'));

        const frag = document.createDocumentFragment();
        let count = 0;

        for (const el of posts) {
          if (count >= NEWS_LIMIT) break;

          const key = keyOf(el);
          if (key && usedKeys.has(key)) continue; // évite doublon avec "À la une"
          if (key) usedKeys.add(key);

          // Construit une news-card compacte
          const card = document.createElement('article');
          card.className = 'news-card';

          const link = el.querySelector('.post-title a');
          const url = link?.getAttribute('href') || '#';
          const title = link?.textContent?.trim() || 'Actualité';
          // On consomme la date de publication SI fournie par actus.html dans <time datetime=...>
          const timeEl = el.querySelector('time[datetime]');
          const dateText = timeEl ? timeEl.textContent.trim() : '';
          const thumb = el.querySelector('.post-thumb')?.getAttribute('src') || '';

          if (thumb) {
            const img = document.createElement('img');
            img.className = 'news-card__thumb';
            img.src = thumb;
            img.alt = title;
            card.appendChild(img);
          }

          const body = document.createElement('div');
          body.className = 'news-card__body';

          const h = document.createElement('h3');
          h.className = 'news-card__title';
          const a = document.createElement('a');
          a.href = url;
          a.textContent = title;
          a.className = 'text-link';
          h.appendChild(a);

          const meta = document.createElement('div');
          meta.className = 'news-card__meta';
          // Affiche uniquement la date de publication provenant de <time>, si présente
          if (dateText) meta.textContent = dateText;

          // Extrait court (2 lignes contrôlées par CSS)
          const excerptSrc = el.querySelector('.post-excerpt') || el.querySelector('.post-body p');
          const excerpt = document.createElement('p');
          excerpt.className = 'news-card__excerpt';
          excerpt.textContent = excerptSrc ? excerptSrc.textContent.trim() : '';

          body.appendChild(h);
          if (dateText) body.appendChild(meta);
          if (excerpt.textContent) body.appendChild(excerpt);

          card.appendChild(body);
          frag.appendChild(card);

          count++;
        }

        if (!frag.childNodes.length) {
          const empty = document.createElement('p');
          empty.style.opacity = '.9';
          empty.textContent = 'Aucune actualité pour le moment.';
          newsContainer.innerHTML = '';
          newsContainer.appendChild(empty);
        } else {
          newsContainer.innerHTML = '';
          newsContainer.appendChild(frag);
        }
      }
    })
    .catch(err => {
      console.error('home-news:', err);
      if (featuredContainer) {
        const section = document.getElementById('home-featured-section');
        if (section) section.style.display = 'none';
      }
      if (newsContainer) {
        newsContainer.innerHTML = '<p style="opacity:.9">Impossible de charger les actualités.</p>';
      }
    });
})();
