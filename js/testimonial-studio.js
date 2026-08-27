const studioSettings = { width: 1080, height: 1350, angle: 135, colorOne: "#2d162c", colorTwo: "#59466b", textSize: 42, padding: 54 };
const TESTIMONIALS_ENDPOINT = "https://script.google.com/macros/s/AKfycbzGMAts4gx9jUtH7LeCb3lJcyHAfbJkwUo_hLa7Njl_HLZfEozKU4tgSoUiIRYLKwgz/exec";
const art = document.querySelector("#testimonial-art");
const artCard = document.querySelector(".testimonial-art-card");
const quote = document.querySelector("#art-quote");
const avatar = document.querySelector("#art-avatar");
const status = document.querySelector("#studio-status");

function renderStudio() {
    art.style.background = `linear-gradient(${studioSettings.angle}deg, ${studioSettings.colorOne}, ${studioSettings.colorTwo})`;
    art.style.aspectRatio = `${studioSettings.width} / ${studioSettings.height}`;
    artCard.style.padding = `${studioSettings.padding}px`;
    quote.style.fontSize = `${studioSettings.textSize}px`;
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
    reader.addEventListener("load", () => { avatar.src = reader.result; });
    reader.readAsDataURL(file);
});

function getText(selector) { return document.querySelector(selector).textContent.trim(); }
function wrapText(context, text, maxWidth) {
    const words = text.split(/\s+/); const lines = []; let line = "";
    words.forEach((word) => { const next = line ? `${line} ${word}` : word; if (context.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next; });
    if (line) lines.push(line); return lines;
}

async function makePng() {
    const scale = studioSettings.width / 1080; const canvas = document.createElement("canvas");
    canvas.width = studioSettings.width; canvas.height = studioSettings.height;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, studioSettings.width, studioSettings.height);
    gradient.addColorStop(0, studioSettings.colorOne); gradient.addColorStop(1, studioSettings.colorTwo); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const margin = canvas.width * .08; const cardX = margin; const cardY = margin; const cardW = canvas.width - margin * 2; const cardH = canvas.height - margin * 2;
    ctx.fillStyle = "rgba(255,255,255,.96)"; ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 20 * scale); ctx.fill();
    const padding = studioSettings.padding * scale; let y = cardY + padding; const avatarSize = 68 * scale;
    if (avatar.src) { const image = new Image(); image.src = avatar.src; await new Promise((resolve) => { image.onload = resolve; image.onerror = resolve; }); ctx.save(); ctx.beginPath(); ctx.arc(cardX + padding + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(image, cardX + padding, y, avatarSize, avatarSize); ctx.restore(); }
    ctx.fillStyle = "#30384a"; ctx.font = `700 ${32 * scale}px Arial`; ctx.fillText(getText("#art-name"), cardX + padding + avatarSize + 24 * scale, y + avatarSize * .62); y += avatarSize + 70 * scale;
    if (!document.querySelector("#show-stars").checked) y -= 38 * scale; else { ctx.fillStyle = "#ffb51b"; ctx.font = `${42 * scale}px Arial`; ctx.fillText("★★★★★", cardX + padding, y); y += 78 * scale; }
    ctx.fillStyle = "#30384a"; ctx.font = `700 ${studioSettings.textSize * scale}px Arial`; const lines = wrapText(ctx, getText("#art-quote"), cardW - padding * 2); const lineHeight = studioSettings.textSize * scale * 1.28; lines.forEach((line) => { ctx.fillText(line, cardX + padding, y); y += lineHeight; });
    ctx.fillStyle = "#8791a4"; ctx.font = `700 ${20 * scale}px Arial`; ctx.fillText(getText("#art-date"), cardX + padding, cardY + cardH - padding);
    return canvas.toDataURL("image/png");
}

document.querySelector("#download-png").addEventListener("click", async () => { status.textContent = "Preparing PNG…"; const dataUrl = await makePng(); const link = document.createElement("a"); link.download = "marcus-heier-testimonial.png"; link.href = dataUrl; link.click(); status.textContent = "PNG downloaded."; });
document.querySelector("#save-drive").addEventListener("click", async () => {
    if (!TESTIMONIALS_ENDPOINT) { status.textContent = "Drive saving will be activated when the Google Apps Script URL is connected."; return; }
    status.textContent = "Saving PNG to Drive…";
    const dataUrl = await makePng();
    const response = await fetch(TESTIMONIALS_ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "saveGraphic", name: getText("#art-name"), imageData: dataUrl }) });
    status.textContent = response.ok ? "PNG saved to Google Drive." : "Could not save the PNG to Drive.";
});
document.querySelector("#reset-settings").addEventListener("click", () => { Object.assign(studioSettings, { width: 1080, height: 1350, angle: 135, colorOne: "#2d162c", colorTwo: "#59466b", textSize: 42, padding: 54 }); document.querySelector("#color-one").value = studioSettings.colorOne; document.querySelector("#color-two").value = studioSettings.colorTwo; document.querySelector("#gradient-angle").value = 135; document.querySelector("#text-size").value = 42; document.querySelector("#card-padding").value = 54; renderStudio(); });

const params = new URLSearchParams(window.location.search);
if (params.get("name")) document.querySelector("#art-name").textContent = params.get("name");
if (params.get("testimonial")) document.querySelector("#art-quote").textContent = params.get("testimonial");
if (params.get("date")) document.querySelector("#art-date").textContent = params.get("date");
if (params.get("image")) avatar.src = params.get("image");
if (!params.get("testimonial")) {
    document.querySelector("#show-stars").checked = false;
    document.querySelector(".testimonial-art-stars").hidden = true;
}
renderStudio();
