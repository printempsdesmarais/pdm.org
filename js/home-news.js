(async function(){
  const mount = document.getElementById('home-news-list');
  if (!mount) return;

  // Utilitaire : crée un élément
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  };

  // Normalise les URL relatives -> absolues
  const abs = (url) => new URL(url, location.origin + '/').toString();

  try {
    const res = await fetch('actus.html', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Fetch actus.html failed: ' + res.status);
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Récupère les cartes .post dans actus.html
    const posts = Array.from(doc.querySelectorAll('.post')).slice(0, 3);
    if (!posts.length) {
      mount.appendChild(el('p', null, `Aucune actualité n'est disponible pour le moment.`));
      return;
    }

    posts.forEach(post => {
      // Title + URL
      const aTitle = post.querySelector('.post-title a');
      const title = aTitle ? aTitle.textContent.trim() : 'Article';
      const url = aTitle ? abs(aTitle.getAttribute('href')) : abs('actus.html');

      // Image
      const imgEl = post.querySelector('.post-thumb');
      const imgSrc = imgEl ? abs(imgEl.getAttribute('src')) : '';
      const imgAlt = imgEl ? (imgEl.getAttribute('alt') || title) : title;

      // Date
      const time = post.querySelector('.post-meta time');
      const dateText = time ? time.textContent.trim() : '';
      const dateISO  = time ? (time.getAttribute('datetime') || '') : '';

      // Extrait (priorité à .post-excerpt)
      let excerpt = '';
      const exEl = post.querySelector('.post-excerpt') || post.querySelector('.post-body');
      if (exEl) excerpt = exEl.textContent.trim();

      // Optionnel : tronque “un peu” pour éviter les pavés
      if (excerpt.length > 220) excerpt = excerpt.slice(0, 217).trim() + '…';

      // Build card
      const card = el('article', 'news-card');

      if (imgSrc) {
        const img = el('img', 'news-card__thumb');
        img.src = imgSrc;
        img.alt = imgAlt;
        img.loading = 'lazy';
        card.appendChild(img);
      }

      const body = el('div', 'news-card__body');
      const h3 = el('h3', 'news-card__title');
      const link = el('a', null, title);
      link.href = url;
      h3.appendChild(link);
      body.appendChild(h3);

      if (dateText) {
        const meta = el('div', 'news-card__meta', dateISO ? `<time datetime="${dateISO}">${dateText}</time>` : dateText);
        body.appendChild(meta);
      }

      if (excerpt) {
        const p = el('p', 'news-card__excerpt', excerpt);
        body.appendChild(p);
      }

      card.appendChild(body);

      const actions = el('div', 'news-card__actions');
      const readBtn = el('a', 'nav-button', 'Lire');
      readBtn.href = url;
      actions.appendChild(readBtn);
      card.appendChild(actions);

      mount.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    // Fallback très simple
    const fallback = document.createElement('p');
    fallback.innerHTML = `Impossible de charger les actualités. Consultez la page <a class="text-link" href="actus.html">Toutes les actus</a>.`;
    mount.appendChild(fallback);
  }
})();
