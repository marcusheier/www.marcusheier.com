const colorNames = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const prismPalettes = [["#5272ff", "#9979ef", "#cf93c3", "#69c9c3", "#4fc9f3", "#ff7dbf", "#e785cc", "#ffa6c4", "#f5b9b9", "#e5e7a3", "#ffb2b5", "#5377ff"]];
const studioSettings = { width: 1080, height: 1350, angle: 135, backgroundMode: "prism", colors: [...prismPalettes[0]], softness: 72, glow: 100, textSize: 24, padding: 54 };

const art = document.querySelector("#testimonial-art");
const artCard = document.querySelector(".testimonial-art-card");
const quote = document.querySelector("#art-quote");
const avatar = document.querySelector("#art-avatar");
const status = document.querySelector("#studio-status");
let cachedPortrait = null;
let cachedPortraitSource = "";

let previewVersion = 0;
const graphicDates = new Map();
let activeGraphicId = "";
async function renderStudio() {
    const version = ++previewVersion;
    document.querySelector("#background-style").value = studioSettings.backgroundMode;
    colorNames.forEach((name,index) => { document.querySelector(`#color-${name}`).value = studioSettings.colors[index]; });
    const previewScale = art.getBoundingClientRect().width / studioSettings.width;
    art.style.aspectRatio = `${studioSettings.width} / ${studioSettings.height}`;
    const canvases = await makeCanvases();
    if (version !== previewVersion) return;
    artCard.style.display = "none";
    art.style.backgroundImage = `url(${canvases[0].toDataURL()})`;
    art.style.backgroundSize = "100% 100%";
    document.querySelector(".prism-stops").style.background = `linear-gradient(90deg, ${studioSettings.colors.join(",")})`;
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
colorNames.forEach((name, index) => document.querySelector(`#color-${name}`).addEventListener("input", (event) => { studioSettings.colors[index] = event.target.value; studioSettings.backgroundMode = "prism"; document.querySelector("#background-style").value = "prism"; renderStudio(); }));
document.querySelector("#shuffle-gradient").addEventListener("click", () => {
    const palette = [...studioSettings.colors];
    for (let i = palette.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [palette[i], palette[j]] = [palette[j], palette[i]]; }
    studioSettings.colors = palette;
    studioSettings.backgroundMode = "prism";

    document.querySelector("#background-style").value = studioSettings.backgroundMode;
    colorNames.forEach((name, index) => { document.querySelector(`#color-${name}`).value = palette[index]; });
    studioSettings.angle = Math.floor(Math.random() * 361);
    document.querySelector("#gradient-angle").value = studioSettings.angle;
    renderStudio();
});

document.querySelector("#studio-image").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => { avatar.src = reader.result; cachedPortrait = null; cachedPortraitSource = ""; renderStudio(); });
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
    const base = ctx.createLinearGradient(0,0,width,height);
    base.addColorStop(0,"#536d9b"); base.addColorStop(1,"#676f9c");
    ctx.fillStyle = base; ctx.fillRect(0,0,width,height);
    const colors = studioSettings.colors;
    const points = [[.30,.02,.08,.32],[.30,.28,.10,.27],[.39,.36,.08,.14],
        [.27,.56,.08,.20],[.30,.78,.09,.25],[.43,.71,.06,.06],
        [.03,.79,.10,.12],[.12,.91,.10,.13],[.29,1.01,.16,.08],
        [.43,.92,.06,.15],[.44,1,.07,.12],[.93,.86,.05,.10]];
    const spread = .7 + studioSettings.softness / 180;
    points.forEach(([x,y,rx,ry],i) => {
        ctx.save();
        ctx.translate(x*width,y*height); ctx.scale(rx*width*spread,ry*height*spread);
        const light = ctx.createRadialGradient(0,0,0,0,0,1);
        light.addColorStop(0,colorWithAlpha(colors[i],Math.min(.95,studioSettings.glow/100)));
        light.addColorStop(.35,colorWithAlpha(colors[i],.55*studioSettings.glow/100));
        light.addColorStop(1,colorWithAlpha(colors[i],0));
        ctx.fillStyle=light; ctx.fillRect(-1,-1,2,2); ctx.restore();
    });
}

async function makeCanvases() {
    const scale = studioSettings.width / 1080;
    const portrait = await loadPortrait();
    const margin = studioSettings.width * .08;
    const cardX = margin; const cardW = studioSettings.width - margin * 2; const maxCardH = studioSettings.height - margin * 2;
    const padding = studioSettings.padding * scale; const avatarSize = 68 * scale;
    const measureCanvas = document.createElement("canvas"); const measure = measureCanvas.getContext("2d");
    measure.font = `400 ${studioSettings.textSize * scale}px Arial`;
    const lines = wrapText(measure, getText("#art-quote") || " ", cardW - padding * 2);
    const lineHeight = studioSettings.textSize * scale * 1.45;
    const headerHeight = (portrait ? 68 : 40) * scale + 32 * scale;
    const continuationHeaderHeight = 72 * scale;
    const footerHeight = 52 * scale;
    const textHeight = Math.max(lineHeight, maxCardH - padding * 2 - headerHeight - footerHeight);
    const linesPerSlide = Math.max(1, Math.floor(textHeight / lineHeight));
    const continuationTextHeight = Math.max(lineHeight, maxCardH - padding * 2 - continuationHeaderHeight - footerHeight);
    const continuationLinesPerSlide = Math.max(1, Math.floor(continuationTextHeight / lineHeight));
    const chunks = [];
    chunks.push(lines.slice(0, linesPerSlide));
    for (let index = linesPerSlide; index < lines.length; index += continuationLinesPerSlide) chunks.push(lines.slice(index, index + continuationLinesPerSlide));
    const canvases = [];
    for (let page = 0; page < chunks.length; page += 1) {
        const canvas = document.createElement("canvas"); canvas.width = studioSettings.width; canvas.height = studioSettings.height;
        const ctx = canvas.getContext("2d");
        drawBackground(ctx, canvas.width, canvas.height);
        const cardH = Math.min(maxCardH, padding * 2 + (page === 0 ? headerHeight : continuationHeaderHeight) + chunks[page].length * lineHeight + footerHeight);
        const cardY = (studioSettings.height - cardH) / 2;
        ctx.fillStyle = "rgba(255,255,255,.96)"; ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 20 * scale); ctx.fill();
        let y = cardY + padding;
        const isFirstSlide = page === 0;
        if (isFirstSlide && portrait) { ctx.save(); ctx.beginPath(); ctx.arc(cardX + padding + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(portrait, cardX + padding, y, avatarSize, avatarSize); ctx.restore(); }
        ctx.fillStyle = "#30384a"; ctx.font = `700 ${32 * scale}px Arial`; ctx.fillText(getText("#art-name"), isFirstSlide && portrait ? cardX + padding + avatarSize + 24 * scale : cardX + padding, y + (isFirstSlide && portrait ? avatarSize * .62 : 32 * scale)); y += isFirstSlide ? headerHeight : continuationHeaderHeight;

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
document.querySelector("#reset-settings").addEventListener("click", () => { Object.assign(studioSettings, { width: 1080, height: 1350, angle: 135, backgroundMode: "prism", colors: [...prismPalettes[0]], softness: 72, glow: 100, textSize: 24, padding: 54 }); document.querySelector("#background-style").value = studioSettings.backgroundMode; colorNames.forEach((name, index) => { document.querySelector(`#color-${name}`).value = studioSettings.colors[index]; }); document.querySelector("#gradient-angle").value = 135; document.querySelector("#background-softness").value = 72; document.querySelector("#background-glow").value = 100; document.querySelector("#text-size").value = 24; document.querySelector("#card-padding").value = 54;
    document.querySelectorAll(".preset-button").forEach((button) => {
        button.classList.toggle("is-active", Number(button.dataset.width) === studioSettings.width && Number(button.dataset.height) === studioSettings.height);
    });
    renderStudio();
});

function formatGraphicDate(value) {
    if (!value) return "";
    const text = String(value);
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Europe/Stockholm"}).format(date);
}
function validGraphicDate(value) {
    if (!value) return true;
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const d = new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
    return d.getFullYear() === Number(m[3]) && d.getMonth() === Number(m[2])-1 && d.getDate() === Number(m[1]);
}
document.querySelector("#graphic-date").addEventListener("input", event => {
    const value = event.target.value.trim();
    const valid = validGraphicDate(value);
    event.target.setCustomValidity(valid ? "" : "Use a valid date in dd/mm/yyyy format.");
    if (!valid) { status.textContent = "Use a valid date in dd/mm/yyyy format."; return; }
    graphicDates.set(activeGraphicId, value);
    document.querySelector("#art-date").textContent = value;
    status.textContent = "";
    renderStudio();
});

window.applyStudioGraphic = function (review, portrait) {
    document.querySelector("#art-name").textContent = review.displayName || review.name;
    document.querySelector("#art-quote").textContent = review.excerpt || review.testimonial;
    activeGraphicId = review.id || review.name;
    const date = graphicDates.has(activeGraphicId) ? graphicDates.get(activeGraphicId) : formatGraphicDate(review.date);
    document.querySelector("#graphic-date").value = date;
    document.querySelector("#art-date").textContent = date;
    if (portrait) avatar.src = portrait; else avatar.removeAttribute("src");
    cachedPortrait = null; cachedPortraitSource = "";
    renderStudio();
};
window.addEventListener("resize", renderStudio);
renderStudio();
