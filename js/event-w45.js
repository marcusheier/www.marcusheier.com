(function () {
    'use strict';

    function setupRevealAnimations() {
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var elements = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

        if (reduceMotion || !('IntersectionObserver' in window)) {
            elements.forEach(function (element) {
                element.classList.add('is-visible');
            });
            return;
        }

        elements.forEach(function (element) {
            element.classList.add('will-reveal');
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.12
        });

        elements.forEach(function (element) {
            observer.observe(element);
        });
    }

    setupRevealAnimations();
})();
