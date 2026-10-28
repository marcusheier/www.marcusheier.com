/* Default public-page reveal: once per element, matching the homepage. */
(function () {
    'use strict';
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window) || motion.matches) return;
    var targets;
    if (document.querySelector('.hero-section--home')) {
        targets = Array.from(document.querySelectorAll('.section--light .section-inner, .section--split, .home-testimonial-grid, .about-preview-media, .about-preview-copy, .link-grid a, .footer-panel'));
    } else if (document.querySelector('.page-event-w45')) {
        targets = Array.from(document.querySelectorAll('.reveal, .event-w45-footer__inner'));
    } else {
        targets = Array.from(document.querySelectorAll('main section')).filter(function (section) {
            return !section.parentElement.closest('section');
        }).map(function (section) {
            return section.querySelector(':scope > .section-inner, :scope > .page-inner, :scope > .about-preview-inner') || section;
        });
        document.querySelectorAll('.footer-panel').forEach(function (footer) { targets.push(footer); });
    }
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
        });
    }, {threshold: 0.08, rootMargin: '0px 0px -25px 0px'});
    // Sections taller than the viewport still reveal as their leading edge enters.
    var tallObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            tallObserver.unobserve(entry.target);
        });
    }, {threshold: 0, rootMargin: '0px 0px -25px 0px'});
    targets.forEach(function (target) {
        target.classList.add('scroll-reveal');
        (target.getBoundingClientRect().height > window.innerHeight ? tallObserver : observer).observe(target);
    });
    function showAll() {
        observer.disconnect(); tallObserver.disconnect();
        targets.forEach(function (target) { target.classList.add('is-revealed'); });
    }
    motion.addEventListener('change', function (event) { if (event.matches) showAll(); });
    // Keyboard navigation and in-page links must never land on hidden content.
    document.addEventListener('focusin', function (event) {
        var target = event.target.closest('.scroll-reveal');
        if (target) target.classList.add('is-revealed');
    });
})();
