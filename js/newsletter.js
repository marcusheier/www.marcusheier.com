/* Keep MailerLite's submission handler and its supplied success callback. */
function ml_webform_success_47616393() {
    var $ = window.ml_jQuery || window.jQuery;
    $('.ml-subscribe-form-47616393 .row-success').show();
    $('.ml-subscribe-form-47616393 .row-form').hide();
    document.querySelector('.footer-newsletter .row-success').focus();
}

(function () {
    var container = document.querySelector('.footer-newsletter');
    if (!container) return;
    var form = container.querySelector('form');
    var email = form.querySelector('input[type="email"]');
    var feedback = container.querySelector('#newsletter-feedback');
    var pendingTimer;

    function showFeedback(message) {
        feedback.textContent = message;
        feedback.hidden = false;
    }

    // Feedback only: MailerLite still owns validation, transport and response handling.
    email.addEventListener('invalid', function () {
        showFeedback('Please enter a valid email address.');
    });
    email.addEventListener('input', function () {
        feedback.hidden = true;
    });
    form.addEventListener('submit', function () {
        feedback.hidden = true;
        window.clearTimeout(pendingTimer);
        pendingTimer = window.setTimeout(function () {
            if (container.querySelector('.row-success').style.display === 'none') {
                showFeedback('We could not confirm your signup yet. Please check your inbox and connection, then try again if needed.');
            }
        }, 15000);
    });

    // Original MailerLite form-view request; its failure must not break the page.
    fetch('https://assets.mailerlite.com/jsonp/2724032/forms/202396785029678594/takel').catch(function () {});
})();
