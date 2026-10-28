/* Offline visual carousel of published client words; review management is later. */
(function () {
    'use strict';
    document.querySelectorAll('[data-home-carousel]').forEach(function (root) {
        var slides = Array.from(root.querySelectorAll('.testimonial-slide'));
        var controls = root.querySelector('.testimonial-carousel-controls');
        var count = root.querySelector('[data-carousel-count]');
        var reviewResets = new Map();
        if (!slides.length || !controls || !count) return;
        var viewport = document.createElement('div');
        viewport.className = 'testimonial-viewport';
        var track = document.createElement('div');
        track.className = 'testimonial-track';
        viewport.append(track);
        root.insertBefore(viewport, controls);
        slides.forEach(function (slide, position) {
            slide.hidden = false;
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-roledescription', 'slide');
            slide.setAttribute('aria-label', (position + 1) + ' of ' + slides.length);
            track.append(slide);
        });
        root.classList.add('is-carousel', 'is-moving');
        controls.hidden = slides.length < 2;
        count.setAttribute('aria-live', 'off');
        var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        var mobile = window.matchMedia('(max-width: 768px)');
        var offset = 0, lastTime = 0, hovering = false, focused = false, manuallyPaused = false, inView = false;
        var toggle = document.createElement('button');
        toggle.type = 'button'; toggle.className = 'carousel-playback';
        controls.append(toggle);
        function playbackLabel() {
            toggle.textContent = manuallyPaused ? '▶' : 'Ⅱ';
            toggle.setAttribute('aria-label', manuallyPaused ? 'Play testimonial movement' : 'Pause testimonial movement');
            toggle.setAttribute('aria-pressed', String(manuallyPaused));
            toggle.hidden = motion.matches || mobile.matches;
        }
        toggle.addEventListener('click', function () { manuallyPaused = !manuallyPaused; playbackLabel(); });
        playbackLabel();
        function stepSize() { return slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap); }
        function draw() {
            var step = stepSize();
            if (!step) return;
            while (offset >= step) {
                var departing = track.firstElementChild;
                track.append(departing);
                if (reviewResets.has(departing)) reviewResets.get(departing)();
                offset -= step;
            }
            while (offset < 0) {
                var returning = track.lastElementChild;
                track.prepend(returning);
                if (reviewResets.has(returning)) reviewResets.get(returning)();
                offset += step;
            }
            track.style.transform = 'translateX(' + (-offset) + 'px)';
            Array.from(track.children).forEach(function (slide, index) {
                var left = index * step - offset;
                var visible = left + step - 24 > 1 && left < viewport.clientWidth - 1;
                slide.classList.toggle('is-visible', visible);
                slide.setAttribute('aria-hidden', String(!visible));
                slide.inert = !visible;
            });
        }
        function advance(delta) { offset += delta * stepSize(); draw(); }
        root.querySelector('[data-carousel-previous]').addEventListener('click', function () { advance(-1); });
        root.querySelector('[data-carousel-next]').addEventListener('click', function () { advance(1); });
        root.addEventListener('keydown', function (event) {
            if (event.target.closest('.review-page-controls')) return;
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault(); advance(event.key === 'ArrowRight' ? 1 : -1);
        });
        slides.forEach(function (slide) {
            slide.addEventListener('mouseenter', function () { hovering = true; });
            slide.addEventListener('mouseleave', function () { hovering = false; });
        });
        root.addEventListener('focusin', function (event) { focused = !!event.target.closest('.testimonial-slide'); });
        root.addEventListener('focusout', function (event) {
            focused = !!(event.relatedTarget && event.relatedTarget.closest('.testimonial-slide'));
        });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; }).observe(root);
        } else inView = true;
        function animate(time) {
            var elapsed = lastTime ? Math.min(time - lastTime, 50) : 0;
            lastTime = time;
            if (!mobile.matches && !hovering && !focused && !manuallyPaused && !motion.matches && !document.hidden && inView) {
                offset += elapsed * .0276; // 27.6px per second: 15% faster than the original 24px/s.
                draw();
            }
            requestAnimationFrame(animate);
        }
        motion.addEventListener('change', playbackLabel);
        mobile.addEventListener('change', function () {
            offset = 0;
            hovering = false;
            playbackLabel();
            draw();
        });
        draw(); requestAnimationFrame(animate);
        var pagers = slides.map(function (slide) {
            var body = slide.querySelector('.testimonial-body');
            var name = slide.querySelector('.testimonial-client').textContent;
            var original = body.textContent;
            var chunks = original.match(/\S+\s*|\s+/g) || [];
            var content = document.createElement('span');
            content.className = 'review-page-text';
            body.replaceChildren(content);
            body.setAttribute('aria-live', 'polite');
            body.setAttribute('aria-atomic', 'true');
            var pager = document.createElement('div');
            pager.className = 'review-page-controls';
            var previous = document.createElement('button');
            var next = document.createElement('button');
            var status = document.createElement('span');
            previous.type = next.type = 'button';
            previous.textContent = '‹'; next.textContent = '›';
            previous.setAttribute('aria-label', 'Previous page of ' + name + "'s review");
            next.setAttribute('aria-label', 'Next page of ' + name + "'s review");
            status.className = 'review-page-status';
            status.setAttribute('role', 'status');
            pager.append(previous, status, next);
            body.after(pager);
            var textPages = [], current = 0;
            function render() {
                content.textContent = textPages[current] || original;
                previous.disabled = current === 0;
                next.disabled = current === textPages.length - 1;
                status.textContent = 'Page ' + (current + 1) + ' of ' + textPages.length;
                pager.hidden = textPages.length < 2;
            }
            function move(delta) {
                current = Math.max(0, Math.min(textPages.length - 1, current + delta));
                render();
            }
            previous.addEventListener('click', function () { move(-1); });
            next.addEventListener('click', function () { move(1); });
            pager.addEventListener('keydown', function (event) {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault(); event.stopPropagation();
                move(event.key === 'ArrowRight' ? 1 : -1);
            });
            reviewResets.set(slide, function () { current = 0; render(); });
            return function paginate() {
                pager.hidden = false;
                slide.classList.add('has-review-pages');
                textPages = [];
                var start = 0;
                while (start < chunks.length) {
                    var low = start + 1, high = chunks.length, end = start + 1;
                    while (low <= high) {
                        var middle = Math.floor((low + high) / 2);
                        content.textContent = chunks.slice(start, middle).join('');
                        if (content.getBoundingClientRect().height <= body.clientHeight - 2) {
                            end = middle; low = middle + 1;
                        } else high = middle - 1;
                    }
                    textPages.push(chunks.slice(start, end).join(''));
                    start = end;
                }
                current = Math.min(current, Math.max(0, textPages.length - 1));
                render();
            };
        });
        function paginateAll() { pagers.forEach(function (paginate) { paginate(); }); }
        paginateAll();
        if (document.fonts) document.fonts.ready.then(paginateAll);
        var resizeFrame;
        window.addEventListener('resize', function () {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(function () { offset = 0; draw(); paginateAll(); });
        });
    });
})();
