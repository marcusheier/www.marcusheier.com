(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const fields = ['display-name','excerpt','category','selected','display-order','show-portrait','verified-permission','permission-note'];
  let reviews = [], active = null, view = 'reviews', sheetUrl = '', portrait = '', busy = false, dirty = false, loadVersion = 0, permissionChanged = false;
  window.studioRpc = window.studioRpc || ((action, payload = {}) => new Promise((resolve,reject) => {
    if (!window.google?.script?.run) { reject(new Error('Open the protected Google Studio URL.')); return; }
    google.script.run.withSuccessHandler(resolve).withFailureHandler(e => reject(new Error(e.message || 'Google request failed'))).studioApi({ action, payload });
  }));
  function message(s) { $('workspace-status').textContent = s; }
  function values() {
    return { id: active.id, revision: active.revision, state: active.state,
      displayName: $('display-name').value, excerpt: $('excerpt').value, category: $('category').value,
      selected: $('selected').checked, order: Number($('display-order').value), showPortrait: $('show-portrait').checked,
      verifiedPermission: permissionChanged ? $('verified-permission').checked : !!active.verifiedPermission, verifiedPortraitPermission: permissionChanged ? $('verified-permission').checked : !!active.verifiedPortraitPermission, permissionNote: $('permission-note').value };
  }
  function paintPreview() {
    if (!active) return;
    const draft = { ...active, ...values(), portrait: $('show-portrait').checked ? portrait : '' };
    TestimonialCarousel.mount($('website-preview'), [{ name: draft.displayName, testimonial: draft.excerpt || draft.testimonial, category: draft.category, portrait: draft.portrait }]);
  }
  function canLeave() { return !dirty || window.confirm('Discard unsaved settings?'); }
  async function openReview(id) {
    const r = reviews.find(x => x.id === id); if (!r) { message('This testimonial was not found. It has not been published.'); return; }
    const version = ++loadVersion;
    active = r; portrait = ''; dirty = false; permissionChanged = false;
    $('review-editor').hidden = false; $('choose-review').hidden = true;
    $('editor-title').textContent = r.displayName || r.name;
    $('display-name').value = r.displayName || r.name; $('excerpt').value = r.excerpt || ''; $('category').value = r.category || '';
    $('selected').checked = !!r.selected; $('display-order').value = r.order || 0; $('show-portrait').checked = !!r.showPortrait;
    $('show-portrait').disabled = !r.imageId;
    $('verified-permission').checked = !!r.verifiedPermission && !!r.verifiedPortraitPermission; $('permission-note').value = r.permissionNote || '';
    const permitted = r.permission && (!r.imageId || r.portraitPermission);
    $('permission-status').textContent = permitted ? '● Publication permission recorded' : '● Publication permission not fully recorded';
    $('permission-status').className = permitted ? 'permission-granted' : 'permission-missing';
    $('original-name').textContent = r.name; $('original-text').textContent = r.testimonial; $('original-date').textContent = r.date; $('original-id').textContent = 'Record ID: ' + r.id;
    $('original-image').hidden = !r.imageUrl; $('original-image').removeAttribute('href');
    if (/^https:\/\drive\.google\.com\//.test(r.imageUrl || '')) $('original-image').href = r.imageUrl;
    $('original-sheet').hidden = !sheetUrl; if (sheetUrl) $('original-sheet').href = sheetUrl;
    paintPreview(); renderList();
    if (r.imageId) {
      try { const result = await studioRpc('portrait',{ id }); if (version === loadVersion) { portrait = result.portrait || ''; paintPreview(); } }
      catch (e) { if (version === loadVersion) message(e.message); }
    }
  }
  function renderList() {
    const list = $('review-list'); list.replaceChildren(); const filtered = reviews;
    $('review-count').textContent = `${filtered.length} testimonials`;
    for (const r of filtered) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'review-row'; b.setAttribute('aria-pressed', String(active?.id === r.id));
      const title = document.createElement('strong'), excerpt = document.createElement('span'), meta = document.createElement('small');
      title.textContent = r.displayName || r.name; excerpt.textContent = (r.excerpt || r.testimonial).slice(0,100); meta.textContent = [r.category || 'Uncategorized', r.selected ? 'Carousel selected' : 'Not selected', 'Order ' + r.order].join(' · ');
      b.append(title,excerpt,meta); b.onclick = () => { if (!busy && canLeave()) openReview(r.id); }; list.append(b);
    }
    if (!filtered.length) { const p = document.createElement('p'); p.textContent = 'No testimonials yet.'; list.append(p); }
  }
  async function showView(next, guard = true) {
    if (busy || (guard && !canLeave())) return;
    view = next;
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.view === view)));
    $('reviews-panel').hidden = view !== 'reviews'; $('graphics-panel').hidden = view !== 'graphics';
    if (view === 'graphics') {
      if (active) applyStudioGraphic({...active,...values()}, $('show-portrait').checked ? portrait : '');
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    } else {
      renderList(); const r = reviews[0];
      if (!active) { $('review-editor').hidden = true; $('choose-review').hidden = false; if (r) await openReview(r.id); }
    }
  }
  async function reload(id) {
    const result = await studioRpc('list'); reviews = result.reviews; sheetUrl = result.sheetUrl || '';
    if (id) { const found = reviews.find(r => r.id === id); if (found) { view = 'reviews'; await showView(view,false); await openReview(id); } else message('This review was not found.'); }
    else await showView(view,false);
  }
  async function save(state) {
    if (busy || !active || !$('settings-form').reportValidity()) return;
    const p = values(); p.state = state || active.state;
    busy = true; document.querySelectorAll('.moderation-actions button').forEach(b => b.disabled = true);
    try { await studioRpc('save',p); dirty = false; busy = false; await reload(p.id); message(`Saved · ${p.state}. Carousel inclusion is ${p.selected ? 'selected' : 'off'}. Website refreshes every 60 seconds.`); }
    catch(e) { message(e.message); }
    finally { busy = false; document.querySelectorAll('.moderation-actions button').forEach(b => b.disabled = false); }
  }
  fields.forEach(id => $(id).addEventListener('input', () => { dirty = true; if (id === 'verified-permission') permissionChanged = true; paintPreview(); }));
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => showView(b.dataset.view));
  $('settings-form').onsubmit = e => { e.preventDefault(); save(); }; $('publish').onclick = () => save('published'); $('hide-review').onclick = () => save('hidden');
  $('refresh').onclick = () => { if (!busy && canLeave()) { dirty = false; active = null; reload().catch(e => message(e.message)); } };
  $('open-graphics').onclick = () => showView('graphics',false);
  $('preview-mobile').onclick = () => { $('website-preview').classList.add('mobile'); $('preview-mobile').setAttribute('aria-pressed','true'); $('preview-desktop').setAttribute('aria-pressed','false'); };
  $('preview-desktop').onclick = () => { $('website-preview').classList.remove('mobile'); $('preview-mobile').setAttribute('aria-pressed','false'); $('preview-desktop').setAttribute('aria-pressed','true'); };
  $('manual-entry').onclick = () => { if (canLeave()) $('manual-dialog').showModal(); }; $('cancel-manual').onclick = () => $('manual-dialog').close();
  $('manual-form').onsubmit = async e => {
    e.preventDefault(); const form = e.target, b = form.querySelector('[type=submit]'); b.disabled = true;
    try {
      const file = form.elements.portrait.files[0]; let imageData = '';
      if (file) {
        if (file.size > 5*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP up to 5 MB.');
        imageData = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      }
      const result = await studioRpc('create', {name:form.elements.name.value,testimonial:form.elements.testimonial.value,permission:false,portraitPermission:false,imageData});
      form.reset(); $('manual-dialog').close(); dirty = false; await reload(result.id); message('Saved as pending. Record existing permission before publishing.');
    } catch(e) { $('manual-status').textContent = e.message; } finally { b.disabled = false; }
  };
  window.addEventListener('beforeunload',e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  reload(window.STUDIO_REVIEW_ID || '').catch(e => message(e.message));
})();
