/* Keep old Sheet/email URLs working without exposing private data on the website. */
(function () {
  const url = window.TESTIMONIAL_CONFIG?.studioUrl;
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url || '')) return;
  const target = new URL(url); const id = new URLSearchParams(location.search).get('id');
  if (id) target.searchParams.set('id',id);
  const link = document.getElementById('open-studio'); link.href = target.href; link.hidden = false;
  location.replace(target.href);
})();
