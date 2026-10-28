/* Public Apps Script endpoint; private credentials must never go here. */
(function () {
    'use strict';
    var webAppUrl = 'https://script.google.com/macros/s/AKfycbzO9nbkeNY5gp4ZsKexfys0b1S_VdTPPgYP5Bg_zyfhBbOPDv6e6jBj2RhR_ocW663e/exec';
    var form = document.querySelector('[data-event-enquiry]');
    if (!form) return;
    var feedback = document.getElementById('enquiry-feedback');
    var button = form.querySelector('button[type="submit"]');
    var idInput = form.elements.namedItem('submission-id');
    var previousPayload = '';
    var previousId = '';
    var lastSubmit = 0;

    function showFeedback(message) {
        feedback.textContent = message;
        feedback.hidden = false;
    }

    function newId() {
        if (window.crypto.randomUUID) return window.crypto.randomUUID();
        var bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 15) | 64;
        bytes[8] = (bytes[8] & 63) | 128;
        var hex = Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    }

    var configured = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(webAppUrl);
    if (!configured) {
        showFeedback('Online enquiries are not available yet. Please email info@marcusheier.com.');
    } else {
        form.action = webAppUrl;
        button.disabled = false;
    }

    form.addEventListener('submit', function (event) {
        if (!configured || !form.reportValidity()) {
            event.preventDefault();
            return;
        }
        if (Date.now() - lastSubmit < 10000) {
            event.preventDefault();
            showFeedback('Please check the receipt tab before trying again.');
            return;
        }
        // Keep the same ID for a retry of unchanged details. No contact data
        // is written to browser storage. Server-side locking prevents duplicates.
        var fields = Array.from(new FormData(form).entries()).filter(function (entry) {
            return entry[0] !== 'submission-id';
        });
        var payload = JSON.stringify(fields);
        if (payload !== previousPayload || !previousId) {
            previousId = newId();
            previousPayload = payload;
        }
        idInput.value = previousId;
        lastSubmit = Date.now();
        showFeedback('Your enquiry is being sent. Check the new tab for confirmation. If it does not open, check your browser’s popup settings.');
        // Native POST to Apps Script: do not claim success or clear the form here.
    });
})();
