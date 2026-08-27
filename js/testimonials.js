/* Testimonial intake. Set the Apps Script URL after deployment. */
const TESTIMONIALS_ENDPOINT = "https://script.google.com/macros/s/AKfycbzGMAts4gx9jUtH7LeCb3lJcyHAfbJkwUo_hLa7Njl_HLZfEozKU4tgSoUiIRYLKwgz/exec";
const testimonialForm = document.querySelector("#testimonial-form");
const testimonialText = document.querySelector("#testimonial-text");
const testimonialCount = document.querySelector("#testimonial-count");
const imageInput = document.querySelector("#testimonial-image");
const imagePreview = document.querySelector("#image-preview");
const imagePreviewImage = document.querySelector("#image-preview-image");
const imagePlaceholder = document.querySelector("#image-placeholder");
const formStatus = document.querySelector("#form-status");
const startedAt = Date.now();

function setError(field, message = "") {
    const target = document.querySelector(`[data-error-for="${field}"]`);
    if (target) target.textContent = message;
}

function setFormStatus(message, success = false) {
    formStatus.textContent = message;
    formStatus.classList.toggle("is-success", success);
}

testimonialText?.addEventListener("input", () => {
    testimonialCount.textContent = `${testimonialText.value.length} / 1800`;
});

imageInput?.addEventListener("change", () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        setError("image", "Please choose an image smaller than 5 MB.");
        imageInput.value = "";
        imagePreview.hidden = true;
        imagePlaceholder.hidden = false;
        return;
    }
    setError("image");
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        imagePreviewImage.src = reader.result;
        imagePreview.hidden = false;
        imagePlaceholder.hidden = true;
    });
    reader.readAsDataURL(file);
});

document.querySelector("#remove-image")?.addEventListener("click", () => {
    imageInput.value = "";
    imagePreview.hidden = true;
    imagePlaceholder.hidden = false;
    imagePreviewImage.removeAttribute("src");
});

testimonialForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    ["name", "testimonial", "image"].forEach((field) => setError(field));
    setFormStatus();
    const name = document.querySelector("#testimonial-name").value.trim();
    const testimonial = testimonialText.value.trim();
    let valid = true;
    if (!name) { setError("name", "Please add the name you would like displayed."); valid = false; }
    if (!testimonial) { setError("testimonial", "Please add your testimonial."); valid = false; }
    if (imageInput.files?.[0]?.size > 5 * 1024 * 1024) { setError("image", "Please choose an image smaller than 5 MB."); valid = false; }
    if (!valid) return;
    if (document.querySelector("#website").value || Date.now() - startedAt < 1800) {
        setFormStatus("Thank you — your testimonial has been received.", true);
        testimonialForm.reset();
        imagePreview.hidden = true;
        imagePlaceholder.hidden = false;
        return;
    }
    if (!TESTIMONIALS_ENDPOINT) {
        setFormStatus("The form is ready. The Google connection still needs to be activated.");
        return;
    }
    const submitButton = testimonialForm.querySelector("button[type=submit]");
    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    try {
        const image = imageInput.files?.[0];
        const imageData = image ? await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(reader.result));
            reader.addEventListener("error", reject);
            reader.readAsDataURL(image);
        }) : "";
        const payload = { name, testimonial, website: "", imageData, imageMimeType: image?.type || "" };
        const response = await fetch(TESTIMONIALS_ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error("Submission failed");
        setFormStatus("Thank you — your testimonial has been received.", true);
        testimonialForm.reset();
        imagePreview.hidden = true;
        testimonialCount.textContent = "0 / 1800";
    } catch (error) {
        setFormStatus("Something went wrong. Please try again in a moment.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Send testimonial";
    }
});
