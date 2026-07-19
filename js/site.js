(function () {
    var bookingLinkUrl = 'https://calendar.app.google/EeLUNfc2a21rRc5Z8';
    var schedulingPopupUrl = 'https://calendar.google.com/calendar/appointments/AcZssZ3eLk21mnVxi3UVbpU0W8_37O5pU6m2ySqQVSo=?gv=true';
    var schedulingScriptUrl = 'https://calendar.google.com/calendar/scheduling-button-script.js';
    var schedulingStylesUrl = 'https://calendar.google.com/calendar/scheduling-button-script.css';
    var mobileBookingQuery = window.matchMedia('(max-width: 768px)');
    var schedulerContainer;
    var schedulerTarget;
    var schedulerButtonIsLoading = false;

    function setupNavigation() {
        var navToggle = document.querySelector('.nav-toggle');
        var navMenu = document.querySelector('#site-navigation');

        if (!navToggle || !navMenu) {
            return;
        }

        navToggle.addEventListener('click', function () {
            var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!isOpen));
            navMenu.classList.toggle('is-open', !isOpen);
        });
    }

    function getBookingLinks() {
        return Array.prototype.slice.call(document.querySelectorAll('a[href="' + bookingLinkUrl + '"]'));
    }

    function loadSchedulerStyles() {
        if (document.querySelector('link[href="' + schedulingStylesUrl + '"]')) {
            return;
        }

        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = schedulingStylesUrl;
        document.head.appendChild(link);
    }

    function getSchedulerContainer() {
        if (schedulerContainer) {
            return schedulerContainer;
        }

        schedulerContainer = document.createElement('div');
        schedulerContainer.className = 'booking-scheduler-popup-anchor';
        schedulerContainer.setAttribute('aria-hidden', 'true');
        schedulerTarget = document.createElement('span');
        schedulerContainer.appendChild(schedulerTarget);
        document.body.appendChild(schedulerContainer);
        return schedulerContainer;
    }

    function getSchedulerTarget() {
        getSchedulerContainer();
        return schedulerTarget;
    }

    function loadSchedulerScript(callback) {
        if (window.calendar && window.calendar.schedulingButton) {
            callback();
            return;
        }

        var existingScript = document.querySelector('script[src="' + schedulingScriptUrl + '"]');

        if (existingScript) {
            existingScript.addEventListener('load', callback, { once: true });
            return;
        }

        var script = document.createElement('script');
        script.src = schedulingScriptUrl;
        script.async = true;
        script.addEventListener('load', callback, { once: true });
        document.body.appendChild(script);
    }

    function prepareDesktopSchedulerButton() {
        if (mobileBookingQuery.matches || schedulerButtonIsLoading) {
            return;
        }

        var container = getSchedulerContainer();

        if (container.querySelector('button, a')) {
            return;
        }

        schedulerButtonIsLoading = true;
        loadSchedulerStyles();
        loadSchedulerScript(function () {
            var buttonColor = getComputedStyle(document.documentElement).getPropertyValue('--color-google-button').trim();

            if (window.calendar && window.calendar.schedulingButton) {
                window.calendar.schedulingButton.load({
                    url: schedulingPopupUrl,
                    color: buttonColor,
                    label: 'Book a session',
                    target: getSchedulerTarget()
                });
            }

            schedulerButtonIsLoading = false;
        });
    }

    function openDesktopSchedulerPopup() {
        var container = getSchedulerContainer();
        var schedulerButton = container.querySelector('button, a');

        if (schedulerButton) {
            schedulerButton.click();
            return;
        }

        window.open(
            schedulingPopupUrl,
            'googleCalendarScheduling',
            'width=960,height=760,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes'
        );
    }

    function handleBookingClick(event) {
        if (mobileBookingQuery.matches) {
            return;
        }

        event.preventDefault();
        openDesktopSchedulerPopup();
    }

    function updateBookingLinks() {
        getBookingLinks().forEach(function (link) {
            if (!link.dataset.desktopBookingPopupReady) {
                link.addEventListener('click', handleBookingClick);
                link.dataset.desktopBookingPopupReady = 'true';
            }

            if (mobileBookingQuery.matches) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
                return;
            }

            link.removeAttribute('target');
            link.removeAttribute('rel');
        });

        prepareDesktopSchedulerButton();
    }

    setupNavigation();
    updateBookingLinks();

    if (mobileBookingQuery.addEventListener) {
        mobileBookingQuery.addEventListener('change', updateBookingLinks);
    } else if (mobileBookingQuery.addListener) {
        mobileBookingQuery.addListener(updateBookingLinks);
    }
})();
