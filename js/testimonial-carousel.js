/* Shared by website and Studio. Manual navigation; fresh public data every 60s. */
(function () {
  'use strict';
  function eligible(reviews) {
    return reviews.filter(r => r.state === undefined || (r.state === 'published' && r.selected && r.permission))
      .slice().sort((a,b) => (a.order || 0) - (b.order || 0));
  }
  function mount(root, input) {
    const reviews = eligible(input); let index = 0, start;
    root.replaceChildren(); root.classList.add('testimonial-carousel');
    root.setAttribute('role', 'region'); root.setAttribute('aria-roledescription', 'carousel'); root.setAttribute('aria-label', 'Client testimonials');
    const card = document.createElement('article'); card.className = 'testimonial-slide'; card.setAttribute('aria-live','polite'); card.setAttribute('aria-atomic','true');
    const controls = document.createElement('div'); controls.className = 'testimonial-carousel-controls';
    const previous = document.createElement('button'), next = document.createElement('button'), count = document.createElement('span');
    previous.type = next.type = 'button'; previous.textContent = '←'; next.textContent = '→';
    previous.setAttribute('aria-label','Previous testimonial'); next.setAttribute('aria-label','Next testimonial');
    function render() {
      card.replaceChildren(); const r = reviews[index];
      if (!r) { const empty = document.createElement('p'); empty.textContent = 'Client reflections will appear here when available.'; card.append(empty); return; }
      card.setAttribute('aria-label', `${index + 1} of ${reviews.length}`);
      const image = r.portrait;
      if (image && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) { const img = document.createElement('img'); img.src = image; img.alt = ''; img.className = 'testimonial-portrait'; card.append(img); }
      const quote = document.createElement('blockquote'), name = document.createElement('p'), category = document.createElement('p');
      quote.textContent = r.excerpt || r.testimonial; name.textContent = r.displayName || r.name; name.className = 'testimonial-client'; category.textContent = r.category || ''; category.className = 'testimonial-category';
      card.append(quote, name, category); count.textContent = `${index + 1} / ${reviews.length}`;
    }
    function move(delta) { if (reviews.length) { index = (index + delta + reviews.length) % reviews.length; render(); } }
    previous.onclick = () => move(-1); next.onclick = () => move(1);
    root.onkeydown = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); } };
    root.onpointerdown = e => { start = { x: e.clientX, y: e.clientY }; };
    root.onpointerup = e => { if (start && Math.abs(e.clientX - start.x) > 45 && Math.abs(e.clientX-start.x) > Math.abs(e.clientY-start.y)) move(e.clientX < start.x ? 1 : -1); start = null; };
    root.onpointercancel = () => { start = null; };
    controls.append(previous, count, next); controls.hidden = reviews.length < 2; root.append(card, controls); render();
    return { move, count: reviews.length, get index() { return index; } };
  }
  window.TestimonialCarousel = { mount, eligible };
  document.querySelectorAll('[data-testimonial-feed]').forEach(root => {
    const endpoint = window.TESTIMONIAL_CONFIG?.publicUrl;
    if (!endpoint) { root.hidden = true; return; }
    let refreshVersion = 0;
    async function refresh() {
      const version = ++refreshVersion;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(endpoint + '?action=published&t=' + Date.now(), { cache: 'no-store', credentials: 'omit', signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.ok || !Array.isArray(result.reviews)) throw new Error('Unavailable');
        if (version === refreshVersion) { root.hidden = false; mount(root, result.reviews); }
      } catch { if (version === refreshVersion) { root.hidden = false; mount(root, []); } }
      finally { clearTimeout(timeout); }
    }
    refresh(); setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  });
})();
