(function () {
    'use strict';

    // Paste the public /exec URL of the Events feed deployment here before upload.
    const feedUrl = '';
    const cards = document.getElementById('events-cards');
    const status = document.getElementById('events-status');
    const banners = Array.from(document.querySelectorAll('a.event-banner'));
    const fallbackCards = cards ? Array.from(cards.children, card => card.cloneNode(true)) : [];
    if ((!banners.length && !cards) || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(feedUrl)) return;

    const cardTemplate = document.getElementById('event-card-template');
    const callback = 'receiveMarcusEventsV1';
    const labels = new Map([
        ['ready', 'Booking not open'], ['enabled', 'Upcoming event'],
        ['sold_out', 'Sold out'], ['paused', 'Booking paused'],
        ['postponed', 'Postponed'], ['cancelled', 'Cancelled']
    ]);
    const fullDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const script = document.createElement('script');
    let settled = false;

    function putText(parent, selector, value) {
        const element = parent.querySelector(selector);
        if (value) element.textContent = value;
        else element.remove();
    }

    function putDate(element, date, label) {
        element.dateTime = date;
        element.textContent = label;
    }

    function normalize(event) {
        if (!event || !labels.has(event.status) || !/^[A-Za-z0-9_-]{1,100}$/.test(event.id) ||
            typeof event.id !== 'string' || typeof event.name !== 'string' || !event.name.trim() ||
            typeof event.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(event.date) ||
            typeof event.timezone !== 'string' || !event.timezone) return null;
        const day = new Date(event.date + 'T00:00:00Z');
        if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== event.date) return null;

        let parts;
        try {
            parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: event.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
            }).formatToParts(new Date());
        } catch (_) {
            return null;
        }
        const part = type => parts.find(item => item.type === type).value;
        const today = part('year') + '-' + part('month') + '-' + part('day');
        const now = today + 'T' + part('hour') + ':' + part('minute');
        const validTime = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
        if ((event.start && !validTime(event.start)) ||
            (event.end && (!validTime(event.end) || !event.start || event.end <= event.start)) ||
            event.date < today || (event.end && event.date + 'T' + event.end <= now)) return null;

        const sitePage = /^https:\/\/(?:www\.)?marcusheier\.com\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+(?:\.html|\/)?$/i;
        const stripeLink = /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/;
        const bookingUrl = event.status === 'enabled' && typeof event.bookingUrl === 'string' &&
            event.bookingUrl.length <= 2048 && (sitePage.test(event.bookingUrl) || stripeLink.test(event.bookingUrl))
            ? event.bookingUrl : '';
        return { ...event, day, bookingUrl };
    }

    function render(events) {
        const fragment = document.createDocumentFragment();
        const fallbackIds = new Set(fallbackCards.map(card => card.dataset.eventId).filter(Boolean));
        const ids = new Set();
        const valid = events.map(normalize).filter(event => {
            if (!event || ids.has(event.id) || fallbackIds.has(event.id)) return false;
            ids.add(event.id);
            return true;
        });
        const next = valid.find(event => event.bookingUrl);

        fallbackCards.forEach(card => fragment.append(card.cloneNode(true)));

        valid.forEach(event => {
            const card = cardTemplate.content.firstElementChild.cloneNode(true);
            const heading = card.querySelector('h2');
            heading.id = 'event-' + event.id;
            heading.textContent = event.name;
            card.setAttribute('aria-labelledby', heading.id);
            putText(card, '.event-date span', event.date.slice(-2));
            putDate(card.querySelector('.event-date time'), event.date, monthYear.format(event.day));
            putDate(card.querySelector('.event-full-date'), event.date, fullDate.format(event.day));
            putText(card, '.eyebrow', event === next ? 'Next Event' :
                event.status === 'enabled' && !event.bookingUrl ? 'Booking unavailable' : labels.get(event.status));
            const zone = event.timezone.replace(/_/g, ' ');
            putText(card, '.event-time', event.start
                ? ' · ' + event.start + (event.end ? '–' + event.end : '') + ' (' + zone + ')' : '');
            putText(card, '.event-location', typeof event.venue === 'string' ? event.venue : '');
            putText(card, '.event-description', typeof event.description === 'string' ? event.description : '');

            const link = card.querySelector('.event-card-link');
            if (event.bookingUrl) {
                link.href = event.bookingUrl;
                link.setAttribute('aria-label', 'Read more and book ' + event.name + ', ' + fullDate.format(event.day));
            } else link.remove();
            fragment.append(card);
        });

        cards.replaceChildren(fragment);
        return cards.children.length ? '' : 'No upcoming events are listed right now. Please check back soon.';
    }

    function restoreFallbackCards() {
        if (!cards) return;
        cards.replaceChildren(...fallbackCards.map(card => card.cloneNode(true)));
    }

    function renderBanner(announcement) {
        if (typeof announcement?.text !== 'string' || !announcement.text.trim()) return;

        banners.forEach(banner => {
            const text = banner.querySelector('.event-banner-text');
            const date = banner.querySelector('.event-banner-date');
            if (!text || !date) return;

            text.textContent = announcement.text;
            if (typeof announcement.dateText === 'string' && announcement.dateText.trim()) {
                date.textContent = announcement.dateText;
                date.hidden = false;
            } else {
                date.textContent = '';
                date.hidden = true;
            }

            const link = announcement.link;
            if (typeof link !== 'string' || /[\\\s]/.test(link) ||
                !/^(?:https:\/\/|\/(?!\/))/i.test(link)) return;
            try {
                const destination = new URL(link, banner.href);
                const allowed = link.startsWith('/')
                    ? destination.origin === location.origin
                    : destination.protocol === 'https:';
                if (allowed && !destination.username && !destination.password) {
                    banner.href = destination.href;
                }
            } catch (_) {
                // Keep the page's Events fallback link when the cell is not a valid URL.
            }
        });
    }

    function finish(payload) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        // A script that arrives after the timeout must be harmless.
        window[callback] = function () {};
        script.remove();
        if (payload?.version === 1) renderBanner(payload.banner);
        if (!cards || !status) return;
        let message = 'Upcoming events are temporarily unavailable. Please try again later.';
        if (payload && payload.version === 1 && Array.isArray(payload.events)) {
            message = render(payload.events);
        } else {
            restoreFallbackCards();
            if (cards.children.length) message = '';
        }
        status.textContent = message;
        status.hidden = !message;
        cards.setAttribute('aria-busy', 'false');
    }

    // Google redirects Content Service responses to googleusercontent.com.
    // The fixed JSONP callback works across origins without a proxy or credentials.
    if (cards && status) {
        status.textContent = 'Loading upcoming events…';
        cards.setAttribute('aria-busy', 'true');
    }
    const timeout = window.setTimeout(finish, 10000);
    window[callback] = finish;
    script.src = feedUrl + '?format=jsonp&_=' + Date.now();
    script.async = true;
    script.onerror = script.onload = () => finish();
    document.head.append(script);
})();
