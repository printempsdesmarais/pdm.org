(async function(){
  const mount = document.getElementById('home-news-list');
  if (!mount) return;

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  };

  const absolutize = (maybeUrl, base) => {
    try { return new URL(maybeUrl, base).toString(); }
    catch { return maybeUrl; }
  };

  // Helpers extraction
  const extractPost = (node, base) => {
    const aTitle = node.querySelector('.post-title a');
    const title  = aTitle ? aTitle.textContent.trim() : 'Article';
    const href   = aTitle ? aTitle.getAttribute('href') : 'actus.html';
    const url    = absolutize(href, base);

    let imgEl = node.querySelector('.post-thumb');
    if (!imgEl) imgEl = node.querySelector('.post-cover img');
    if (!imgEl) imgEl = node.querySelector('img');
    const imgSrc = imgEl ? absolutize(imgEl.getAttribute('src'), base) : '';
    const imgAlt = imgEl ? (imgEl.getAttribute('alt') || title) : title;

    const time = node.querySelector('.post-meta time');
    const dateText = time ? time.textContent.trim() : '';
    const dateISO  = time ? (time.getAttribute('datetime') || '') : '';

    let excerpt = '';
    const exEl = node.querySelector('.post-excerpt') || node.querySelector('.post-body p');
    if (exEl) excerpt = exEl.textContent.trim();
    if (excerpt.length > 240) excerpt = excerpt.slice(0, 237).trim() + '…';

    return { type:'post', title, url, imgSrc, imgAlt, dateText, dateISO, excerpt, orderIndex: node.__orderIndex ?? 0 };
  };

  const extractStory = (node, base) => {
    // Story feature marquée pour la home
    const include = node.getAttribute('data-include') === 'home';
    if (!include) return null;

    const titleEl = node.querySelector('.story-feature__title');
    const title = titleEl ? titleEl.textContent.trim() : 'Article spécial';

    const href   = node.getAttribute('data-url') || 'actus.html#video-actu';
    const url    = absolutize(href, base);

    const thumb  = node.getAttribute('data-thumb') || '';
    const imgSrc = thumb ? absolutize(thumb, base) : '';
    const imgAlt = title;

    // Date : <time> interne prioritaire ; sinon data-published
    let timeEl = node.querySelector('time');
    let dateISO = timeEl ? (timeEl.getAttribute('datetime') || '') : (node.getAttribute('data-published') || '');
    let dateText = timeEl ? timeEl.textContent.trim() : (dateISO || '');

    // Extrait = premier paragraphe de contenu
    let excerpt = '';
    const p = node.querySelector('.story-feature__content p');
    if (p) excerpt = p.textContent.trim();
    if (excerpt.length > 240) excerpt = excerpt.slice(0, 237).trim() + '…';

    return { type:'story', title, url, imgSrc, imgAlt, dateText, dateISO, excerpt, orderIndex: node.__orderIndex ?? 0 };
  };

  try {
    const res = await fetch('actus.html', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Fetch actus.html failed: ' + res.status);
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const base = doc.baseURI || document.baseURI;

    // Marque l'ordre DOM initial (utile si dates manquantes)
    let i = 0;
    doc.querySelectorAll('.post, .story-feature[data-include="home"]').forEach(n => (n.__orderIndex = i++));

    const posts  = Array.from(doc.querySelectorAll('.post')).map(n => extractPost(n, base));
    const stories = Array.from(doc.querySelectorAll('.story-feature[data-include="home"]'))
                        .map(n => extractStory(n, base))
                        .filter(Boolean);

    // Fusion + tri par date desc ; fallback sur l'ordre DOM si pas de date
    const items = [...posts, ...stories].filter(Boolean).sort((a,b)=>{
      const da = a.dateISO ? Date.parse(a.dateISO) : NaN;
      const db = b.dateISO ? Date.parse(b.dateISO) : NaN;
      if (!isNaN(da) && !isNaN(db)) return db - da;        // tri par dates valides
      if (!isNaN(da)) return -1;                           // a a une date, b pas
      if (!isNaN(db)) return 1;                            // b a une date, a pas
      return a.orderIndex - b.orderIndex;                  // fallback : ordre DOM
    }).slice(0,3);

    if (!items.length) {
      mount.appendChild(el('p', null, `Aucune actualité n'est disponible pour le moment.`));
      return;
    }

    items.forEach(it => {
      const card = el('article', 'news-card');

      if (it.imgSrc) {
        const img = el('img', 'news-card__thumb');
        img.src = it.imgSrc;
        img.alt = it.imgAlt || it.title;
        img.loading = 'lazy';
        card.appendChild(img);
      }

      const body = el('div', 'news-card__body');
      const h3 = el('h3', 'news-card__title');
      const link = el('a', null, it.title);
      link.href = it.url;
      h3.appendChild(link);
      body.appendChild(h3);

      if (it.dateText) {
        const meta = el('div', 'news-card__meta', it.dateISO ? `<time datetime="${it.dateISO}">${it.dateText}</time>` : it.dateText);
        body.appendChild(meta);
      }

      if (it.excerpt) {
        const p = el('p', 'news-card__excerpt', it.excerpt);
        body.appendChild(p);
      }

      card.appendChild(body);

      const actions = el('div', 'news-card__actions');
      const readBtn = el('a', 'nav-button', 'Lire');
      readBtn.href = it.url;
      actions.appendChild(readBtn);
      card.appendChild(actions);

      mount.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    const fallback = document.createElement('p');
    fallback.innerHTML = `Impossible de charger les actualités. Consultez la page <a class="text-link" href="actus.html">Toutes les actus</a>.`;
    mount.appendChild(fallback);
  }
})();
