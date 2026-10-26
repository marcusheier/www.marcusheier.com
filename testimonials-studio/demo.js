/* Fictional local fixtures only. Never included in the Google bundle or upload package. */
window.STUDIO_REVIEW_ID = new URLSearchParams(location.search).get('id') || '';
const demoCount = new URLSearchParams(location.search).get('count');
let demoReviews = demoCount === '0' ? [] : [
 { id:'demo-pending', name:'Example client A', testimonial:'DEMONSTRATION ONLY. A thoughtful session that gave me space to reflect and find a clearer direction.', state:'pending', selected:false, permission:true, portraitPermission:false, order:0, category:'Channeling',date:'2026-10-18', revision:'0' },
 { id:'demo-published-1', name:'Example client B', testimonial:'DEMONSTRATION ONLY. I left feeling grounded, with practical ideas to take into everyday life.', state:'published', selected:true, permission:true, order:1, category:'Healing',date:'2026-10-18', revision:'0' },
 { id:'demo-published-2', name:'Example client C', testimonial:'DEMONSTRATION ONLY. There was time to ask questions, explore what mattered, and discover my next step.', state:'published', selected:true, permission:true, order:2, category:'Mediumship & Coaching',date:'2026-10-18', revision:'0' },
 { id:'demo-hidden', name:'Example client D', testimonial:'DEMONSTRATION ONLY. This hidden example must never appear in the website carousel.', state:'hidden', selected:true, permission:true, order:0,date:'2026-10-18', revision:'0' }
];
if (demoCount === '1') demoReviews = demoReviews.slice(1,2);
window.studioRpc = async (action,p = {}) => {
 if (action === 'list') return { reviews: JSON.parse(JSON.stringify(demoReviews)) };
 if (action === 'portrait') return { portrait:'' };
 if (action === 'graphic') throw new Error('Local demo: use Download PNG. Google Drive saving requires the protected deployment.');
 if (action === 'create') { const id = 'demo-' + Date.now(); demoReviews.push({...p,id,state:'pending',selected:false,order:0,displayName:p.name,revision:'0'}); return {id}; }
 if (action === 'save') {
  const r = demoReviews.find(r => r.id === p.id); if (!r) throw new Error('Review not found');
  if ((p.verifiedPermission || p.verifiedPortraitPermission) && !p.permissionNote) throw new Error('Record the permission source.');
  if (p.state === 'published' && !(r.permission || p.verifiedPermission)) throw new Error('Publication permission is required.');
  Object.assign(r,p,{ permission:r.permission || p.verifiedPermission,portraitPermission:r.portraitPermission || p.verifiedPortraitPermission,revision:String(Date.now()) }); return {ok:true};
 }
 throw new Error('Unsupported action');
};
document.getElementById('demo-notice').hidden = false;
