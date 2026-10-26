const prismPalettes = [
    ["#28496b", "#75dbe8", "#f5f2ff", "#f255cf", "#4979bd", "#4c7eb8", "#7bd6d5", "#263b63"],
    ["#1f304f", "#56d7cf", "#fff5df", "#ff7dbb", "#6958d9", "#557dc4", "#8fe5d2", "#202e4c"],
    ["#25344d", "#8ce7f2", "#e5d8ff", "#e95fca", "#3c6db2", "#5969c9", "#82d5c5", "#263a64"],
    ["#263d5d", "#72c9ed", "#fff1f4", "#e76cff", "#4e8d9e", "#6c82d8", "#89d5b1", "#263b63"]
];
const studioSettings = { width: 1080, height: 1350, angle: 135, backgroundMode: "prism", colors: [...prismPalettes[0]], softness: 72, glow: 100, textSize: 24, padding: 54 };

const art = document.querySelector("#testimonial-art");
const artCard = document.querySelector(".testimonial-art-card");
const quote = document.querySelector("#art-quote");
const avatar = document.querySelector("#art-avatar");
const status = document.querySelector("#studio-status");
let cachedPortrait = null;
let cachedPortraitSource = "";

function renderStudio() {
    const previewScale = art.getBoundingClientRect().width / studioSettings.width;
    art.style.background = previewBackground();
    art.style.aspectRatio = `${studioSettings.width} / ${studioSettings.height}`;
    artCard.style.padding = `${studioSettings.padding * previewScale}px`;
    quote.style.fontSize = `${studioSettings.textSize * previewScale}px`;
    document.querySelector("#gradient-angle-value").textContent = `${studioSettings.angle}°`;
    document.querySelector("#background-softness-value").textContent = `${studioSettings.softness}`;
    document.querySelector("#background-glow-value").textContent = `${studioSettings.glow}%`;
    document.querySelector("#text-size-value").textContent = `${studioSettings.textSize}px`;
    document.querySelector("#card-padding-value").textContent = `${studioSettings.padding}px`;
}

function colorWithAlpha(hex, alpha) {
    const value = String(hex).replace("#", "");
    const r = parseInt(value.slice(0, 2), 16), g = parseInt(value.slice(2, 4), 16), b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function previewBackground() {
    const colors = studioSettings.colors;
    const base = colors[0], edge = colors[colors.length - 1];
    const alpha = studioSettings.glow / 100;
    if (studioSettings.backgroundMode === "classic") return `linear-gradient(${studioSettings.angle}deg, ${base}, ${edge})`;
    const softness = Math.round(25 + studioSettings.softness * .12);
    const spread = `${softness}%`;
    const positions = studioSettings.backgroundMode === "aurora"
        ? [["12%", "10%"], ["30%", "30%"], ["54%", "12%"], ["78%", "18%"], ["38%", "55%"], ["66%", "62%"], ["82%", "88%"]]
        : [["50%", "-8%"], ["22%", "18%"], ["42%", "38%"], ["56%", "56%"], ["75%", "36%"], ["28%", "78%"], ["76%", "88%"]];
    return colors.slice(1).map((color, index) => `radial-gradient(circle at ${positions[index][0]} ${positions[index][1]}, ${colorWithAlpha(color, (.48 + (index % 3) * .12) * alpha)} 0%, ${colorWithAlpha(color, .04 * alpha)} ${spread}, transparent ${Math.min(100, softness + 28)}%)`).concat(`linear-gradient(${studioSettings.angle}deg, ${base}, ${edge})`).join(", ");
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
bindRange("gradient-angle", "angle");
bindRange("background-softness", "softness");
bindRange("background-glow", "glow");
bindRange("text-size", "textSize");
bindRange("card-padding", "padding");

document.querySelector("#background-style").addEventListener("change", (event) => { studioSettings.backgroundMode = event.target.value; renderStudio(); });
["one", "two", "three", "four", "five", "six", "seven", "eight"].forEach((name, index) => document.querySelector(`#color-${name}`).addEventListener("input", (event) => { studioSettings.colors[index] = event.target.value; renderStudio(); }));
document.querySelector("#shuffle-gradient").addEventListener("click", () => {
    const palette = prismPalettes[Math.floor(Math.random() * prismPalettes.length)].map(color => color);
    studioSettings.colors = palette;
    studioSettings.backgroundMode = Math.random() > .5 ? "prism" : "aurora";
    document.querySelector("#background-style").value = studioSettings.backgroundMode;
    ["one", "two", "three", "four", "five", "six", "seven", "eight"].forEach((name, index) => { document.querySelector(`#color-${name}`).value = palette[index]; });
    studioSettings.angle = Math.floor(Math.random() * 361);
    document.querySelector("#gradient-angle").value = studioSettings.angle;
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

function drawBackground(ctx, width, height) {
    const colors = studioSettings.colors;
    const base = colors[0], edge = colors[colors.length - 1];
    if (studioSettings.backgroundMode === "classic") {
        const radians = (studioSettings.angle - 90) * Math.PI / 180;
        const dx = Math.cos(radians), dy = Math.sin(radians);
        const extent = (Math.abs(dx) * width + Math.abs(dy) * height) / 2;
        const gradient = ctx.createLinearGradient(width / 2 - dx * extent, height / 2 - dy * extent, width / 2 + dx * extent, height / 2 + dy * extent);
        gradient.addColorStop(0, base); gradient.addColorStop(1, edge);
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height); return;
    }
    ctx.fillStyle = base; ctx.fillRect(0, 0, width, height);
    const aurora = studioSettings.backgroundMode === "aurora";
    const positions = aurora
        ? [[.12, .10], [.30, .30], [.54, .12], [.78, .18], [.38, .55], [.66, .62], [.82, .88]]
        : [[.50, -.08], [.22, .18], [.42, .38], [.56, .56], [.75, .36], [.28, .78], [.76, .88]];
    const points = colors.slice(1).map((color, index) => [positions[index][0], positions[index][1], color]);
    const radius = (0.28 + studioSettings.softness / 260) * Math.max(width, height);
    const intensity = studioSettings.glow / 100;
    ctx.globalCompositeOperation = "screen";
    points.forEach(([x, y, color]) => {
        const gradient = ctx.createRadialGradient(x * width, y * height, 0, x * width, y * height, radius);
        gradient.addColorStop(0, colorWithAlpha(color, .82 * intensity));
        gradient.addColorStop(.3, colorWithAlpha(color, .42 * intensity));
        gradient.addColorStop(.7, colorWithAlpha(color, .12 * intensity));
        gradient.addColorStop(1, colorWithAlpha(color, 0));
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    });
    ctx.globalCompositeOperation = "source-over";
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
    const headerHeight = avatarSize + 70 * scale;
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
        const ctx = canvas.getContext("2d");
        drawBackground(ctx, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255,255,255,.96)"; ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 20 * scale); ctx.fill();
        let y = cardY + padding;
        const isFirstSlide = page === 0;
        if (isFirstSlide && portrait) { ctx.save(); ctx.beginPath(); ctx.arc(cardX + padding + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(portrait, cardX + padding, y, avatarSize, avatarSize); ctx.restore(); }
        ctx.fillStyle = "#30384a"; ctx.font = `700 ${32 * scale}px Arial`; ctx.fillText(getText("#art-name"), isFirstSlide ? cardX + padding + avatarSize + 24 * scale : cardX + padding, y + (isFirstSlide ? avatarSize * .62 : 32 * scale)); y += isFirstSlide ? avatarSize + 70 * scale : continuationHeaderHeight;

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
    try {
        status.textContent = "Saving graphics…";
        const canvases = await makeCanvases();
        for (const canvas of canvases) await window.studioRpc("graphic", { imageData: canvas.toDataURL("image/png") });
        status.textContent = `${canvases.length} graphic(s) saved to Drive.`;
    } catch (error) { status.textContent = error.message; }
});
document.querySelector("#reset-settings").addEventListener("click", () => { Object.assign(studioSettings, { width: 1080, height: 1350, angle: 135, backgroundMode: "prism", colors: [...prismPalettes[0]], softness: 72, glow: 100, textSize: 24, padding: 54 }); document.querySelector("#background-style").value = studioSettings.backgroundMode; ["one", "two", "three", "four", "five", "six", "seven", "eight"].forEach((name, index) => { document.querySelector(`#color-${name}`).value = studioSettings.colors[index]; }); document.querySelector("#gradient-angle").value = 135; document.querySelector("#background-softness").value = 72; document.querySelector("#background-glow").value = 100; document.querySelector("#text-size").value = 24; document.querySelector("#card-padding").value = 54;
    document.querySelectorAll(".preset-button").forEach((button) => {
        button.classList.toggle("is-active", Number(button.dataset.width) === studioSettings.width && Number(button.dataset.height) === studioSettings.height);
    });
    renderStudio();
});

window.applyStudioGraphic = function (review, portrait) {
    document.querySelector("#art-name").textContent = review.displayName || review.name;
    document.querySelector("#art-quote").textContent = review.excerpt || review.testimonial;
    document.querySelector("#art-date").textContent = review.date ? new Date(review.date).toLocaleDateString() : "";
    if (portrait) avatar.src = portrait; else avatar.removeAttribute("src");
    cachedPortrait = null; cachedPortraitSource = "";
    renderStudio();
};
window.addEventListener("resize", renderStudio);
renderStudio();
