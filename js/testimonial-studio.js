const studioSettings = { width: 1080, height: 1350, angle: 135, colorOne: "#2d162c", colorTwo: "#59466b", textSize: 24, padding: 54 };
const TESTIMONIALS_ENDPOINT = "https://script.google.com/macros/s/AKfycbzDGwS8xoUJIM3jfhtPDRpojHDXM_hVZrJj6pckZdtY_jUVi7ggO8lC1So9wbk0wyJR/exec";
const art = document.querySelector("#testimonial-art");
const artCard = document.querySelector(".testimonial-art-card");
const quote = document.querySelector("#art-quote");
const avatar = document.querySelector("#art-avatar");
const status = document.querySelector("#studio-status");
let cachedPortrait = null;
let cachedPortraitSource = "";

function renderStudio() {
    const previewScale = art.getBoundingClientRect().width / studioSettings.width;
    art.style.background = `linear-gradient(${studioSettings.angle}deg, ${studioSettings.colorOne}, ${studioSettings.colorTwo})`;
    art.style.aspectRatio = `${studioSettings.width} / ${studioSettings.height}`;
    artCard.style.padding = `${studioSettings.padding * previewScale}px`;
    quote.style.fontSize = `${studioSettings.textSize * previewScale}px`;
    document.querySelector("#gradient-angle-value").textContent = `${studioSettings.angle}°`;
    document.querySelector("#text-size-value").textContent = `${studioSettings.textSize}px`;
    document.querySelector("#card-padding-value").textContent = `${studioSettings.padding}px`;
}

function bindRange(id, key) {
    document.querySelector(`#${id}`).addEventListener("input", (event) => {
        studioSettings[key] = Number(event.target.value);
        renderStudio();
    });
}

document.querySelectorAll(".preset-button").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".preset-button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    studioSettings.width = Number(button.dataset.width);
    studioSettings.height = Number(button.dataset.height);
    renderStudio();
}));
document.querySelector("#color-one").addEventListener("input", (event) => { studioSettings.colorOne = event.target.value; renderStudio(); });
document.querySelector("#color-two").addEventListener("input", (event) => { studioSettings.colorTwo = event.target.value; renderStudio(); });
bindRange("gradient-angle", "angle");
bindRange("text-size", "textSize");
bindRange("card-padding", "padding");
document.querySelector("#show-stars").addEventListener("change", (event) => { document.querySelector(".testimonial-art-stars").hidden = !event.target.checked; });

document.querySelector("#shuffle-gradient").addEventListener("click", () => {
    const palettes = [["#2d162c", "#59466b"], ["#0e0c24", "#59466b"], ["#452843", "#d8b98e"], ["#28233f", "#3c3153"], ["#533551", "#acabb0"], ["#1f2638", "#806b8e"]];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    [studioSettings.colorOne, studioSettings.colorTwo] = palette;
    document.querySelector("#color-one").value = palette[0];
    document.querySelector("#color-two").value = palette[1];
    renderStudio();
});

document.querySelector("#studio-image").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => { avatar.src = reader.result; cachedPortrait = null; cachedPortraitSource = ""; });
    reader.readAsDataURL(file);
});

function getText(selector) { return document.querySelector(selector).textContent.trim(); }
function loadPortrait() {
    if (!avatar.src) return Promise.resolve(null);
    if (cachedPortrait && cachedPortraitSource === avatar.src) return Promise.resolve(cachedPortrait);
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => { cachedPortrait = image; cachedPortraitSource = avatar.src; resolve(image); };
        image.onerror = () => resolve(null);
        image.src = avatar.src;
    });
}
function wrapText(context, text, maxWidth) {
    const words = text.split(/\s+/); const lines = []; let line = "";
    words.forEach((word) => { const next = line ? `${line} ${word}` : word; if (context.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next; });
    if (line) lines.push(line); return lines;
}

async function makeCanvases() {
    const scale = studioSettings.width / 1080;
    const portrait = await loadPortrait();
    const margin = studioSettings.width * .08;
    const cardX = margin; const cardY = margin; const cardW = studioSettings.width - margin * 2; const cardH = studioSettings.height - margin * 2;
    const padding = studioSettings.padding * scale; const avatarSize = 68 * scale;
    const measureCanvas = document.createElement("canvas"); const measure = measureCanvas.getContext("2d");
    measure.font = `400 ${studioSettings.textSize * scale}px Arial`;
    const lines = wrapText(measure, getText("#art-quote") || " ", cardW - padding * 2);
    const lineHeight = studioSettings.textSize * scale * 1.45;
    const headerHeight = avatarSize + 70 * scale + (document.querySelector("#show-stars").checked ? 78 * scale : 0);
    const continuationHeaderHeight = 100 * scale;
    const textHeight = Math.max(lineHeight, cardH - padding * 2 - headerHeight - 34 * scale);
    const linesPerSlide = Math.max(1, Math.floor(textHeight / lineHeight));
    const continuationTextHeight = Math.max(lineHeight, cardH - padding * 2 - continuationHeaderHeight - 34 * scale);
    const continuationLinesPerSlide = Math.max(1, Math.floor(continuationTextHeight / lineHeight));
    const chunks = [];
    chunks.push(lines.slice(0, linesPerSlide));
    for (let index = linesPerSlide; index < lines.length; index += continuationLinesPerSlide) chunks.push(lines.slice(index, index + continuationLinesPerSlide));
    const canvases = [];
    for (let page = 0; page < chunks.length; page += 1) {
        const canvas = document.createElement("canvas"); canvas.width = studioSettings.width; canvas.height = studioSettings.height;
        const ctx = canvas.getContext("2d"); const gradient = ctx.createLinearGradient(0, 0, studioSettings.width, studioSettings.height);
        gradient.addColorStop(0, studioSettings.colorOne); gradient.addColorStop(1, studioSettings.colorTwo); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255,255,255,.96)"; ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 20 * scale); ctx.fill();
        let y = cardY + padding;
        const isFirstSlide = page === 0;
        if (isFirstSlide && portrait) { ctx.save(); ctx.beginPath(); ctx.arc(cardX + padding + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(portrait, cardX + padding, y, avatarSize, avatarSize); ctx.restore(); }
        ctx.fillStyle = "#30384a"; ctx.font = `700 ${32 * scale}px Arial`; ctx.fillText(getText("#art-name"), isFirstSlide ? cardX + padding + avatarSize + 24 * scale : cardX + padding, y + (isFirstSlide ? avatarSize * .62 : 32 * scale)); y += isFirstSlide ? avatarSize + 70 * scale : continuationHeaderHeight;
        if (isFirstSlide && document.querySelector("#show-stars").checked) { ctx.fillStyle = "#ffb51b"; ctx.font = `${42 * scale}px Arial`; ctx.fillText("★★★★★", cardX + padding, y); y += 78 * scale; }
        ctx.fillStyle = "#30384a"; ctx.font = `400 ${studioSettings.textSize * scale}px Arial`; chunks[page].forEach((line) => { ctx.fillText(line, cardX + padding, y); y += lineHeight; });
        ctx.fillStyle = "#8791a4"; ctx.font = `700 ${20 * scale}px Arial`; ctx.fillText(getText("#art-date"), cardX + padding, cardY + cardH - padding);
        if (chunks.length > 1) { ctx.textAlign = "right"; ctx.font = `600 ${16 * scale}px Arial`; ctx.fillText(`${page + 1} / ${chunks.length}`, cardX + cardW - padding, cardY + cardH - padding); ctx.textAlign = "left"; }
        canvases.push(canvas);
    }
    return canvases;
}

function canvasToBlob(canvas) { return new Promise((resolve) => canvas.toBlob(resolve, "image/png")); }
async function downloadCanvas(canvas, filename) { const blob = await canvasToBlob(canvas); const link = document.createElement("a"); link.download = filename; link.href = URL.createObjectURL(blob); link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }

document.querySelector("#download-png").addEventListener("click", async () => { status.textContent = "Preparing PNG…"; const canvases = await makeCanvases(); await downloadCanvas(canvases[0], "marcus-heier-testimonial.png"); status.textContent = canvases.length > 1 ? "First slide downloaded. Use Download carousel for the full testimonial." : "PNG downloaded."; });
document.querySelector("#download-carousel").addEventListener("click", async () => { status.textContent = "Preparing carousel…"; const canvases = await makeCanvases(); for (let index = 0; index < canvases.length; index += 1) await downloadCanvas(canvases[index], `marcus-heier-testimonial-slide-${index + 1}.png`); status.textContent = `${canvases.length}-slide carousel downloaded.`; });
document.querySelector("#save-drive").addEventListener("click", async () => {
    if (!TESTIMONIALS_ENDPOINT) { status.textContent = "Drive saving will be activated when the Google Apps Script URL is connected."; return; }
    status.textContent = "Saving PNG to Drive…";
    const canvases = await makeCanvases();
    for (let index = 0; index < canvases.length; index += 1) {
        status.textContent = `Saving slide ${index + 1} of ${canvases.length} to Drive…`;
        const response = await fetch(TESTIMONIALS_ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "saveGraphic", name: getText("#art-name"), imageData: canvases[index].toDataURL("image/png"), slideNumber: index + 1, slideCount: canvases.length }) });
        if (!response.ok) { status.textContent = "Could not save the PNG to Drive."; return; }
    }
    status.textContent = canvases.length > 1 ? `${canvases.length} slides saved to Google Drive.` : "PNG saved to Google Drive.";
});
document.querySelector("#reset-settings").addEventListener("click", () => { Object.assign(studioSettings, { width: 1080, height: 1350, angle: 135, colorOne: "#2d162c", colorTwo: "#59466b", textSize: 24, padding: 54 }); document.querySelector("#color-one").value = studioSettings.colorOne; document.querySelector("#color-two").value = studioSettings.colorTwo; document.querySelector("#gradient-angle").value = 135; document.querySelector("#text-size").value = 24; document.querySelector("#card-padding").value = 54; renderStudio(); });

const params = new URLSearchParams(window.location.search);
function loadImageById(imageId) {
    fetch(`${TESTIMONIALS_ENDPOINT}?action=image&id=${encodeURIComponent(imageId)}`)
        .then((response) => response.json())
        .then((payload) => { if (payload.ok && payload.imageData) { avatar.src = `data:${payload.mimeType};base64,${payload.imageData}`; cachedPortrait = null; cachedPortraitSource = ""; } })
        .catch(() => { status.textContent = "The portrait could not be loaded; you can choose it manually below."; });
}
function applySubmission(payload) {
    document.querySelector("#art-name").textContent = payload.name || "";
    document.querySelector("#art-quote").textContent = payload.testimonial || "";
    document.querySelector("#art-date").textContent = payload.date || "";
    if (payload.testimonial) { document.querySelector("#show-stars").checked = true; document.querySelector(".testimonial-art-stars").hidden = false; }
    if (payload.imageId) loadImageById(payload.imageId);
    renderStudio();
}
if (params.get("id")) {
    status.textContent = "Loading testimonial…";
    fetch(`${TESTIMONIALS_ENDPOINT}?action=submission&id=${encodeURIComponent(params.get("id"))}`)
        .then((response) => response.json())
        .then((payload) => { if (payload.ok) { applySubmission(payload); status.textContent = ""; } else status.textContent = "This testimonial could not be found."; })
        .catch(() => { status.textContent = "This testimonial could not be loaded."; });
} else {
    if (params.get("name")) document.querySelector("#art-name").textContent = params.get("name");
    if (params.get("testimonial")) document.querySelector("#art-quote").textContent = params.get("testimonial");
    if (params.get("date")) document.querySelector("#art-date").textContent = params.get("date");
    const imageId = params.get("imageId") || (params.get("image")?.match(/\/file\/d\/([^/]+)/)?.[1] || "");
    if (imageId) loadImageById(imageId);
}
if (!params.get("testimonial") && !params.get("id")) {
    document.querySelector("#show-stars").checked = false;
    document.querySelector(".testimonial-art-stars").hidden = true;
}
renderStudio();
