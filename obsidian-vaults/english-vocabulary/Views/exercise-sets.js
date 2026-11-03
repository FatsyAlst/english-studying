// Exercise sets: one card per folder in Exercises/, newest first.
// Usage: await dv.view("Views/exercise-sets", { folder: "Exercises", about: { "<set folder>": "your own description" } })
//
// Everything comes from the sets themselves: the exercise sheet and answer key PDFs, and the .tex
// source for the title, the intro sentence, the number of exercises and the words the set covers.
// "Review words" opens the set's words as cards right inside its card (Views/vocab-explorer.js, review mode).
// Files are only read, never changed.
const root = dv.container;
root.innerHTML = "";

const FOLDER = String(input?.folder ?? "Exercises").replace(/\/+$/, "");
const ABOUT = input?.about ?? {};
const SHOW = 4;   // sets shown before "Show all"
const adapter = app.vault.adapter;

// ── Helpers ──
const pad = n => String(n).padStart(2, "0");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = ms => { const d = new Date(ms); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const plural = (n, w, ws) => `${n} ${n === 1 ? w : (ws ?? w + "s")}`;
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[‘’]/g, "'").toLowerCase();
const tokens = s => norm(s).split(/[^a-z0-9']+/).filter(Boolean);
const sentenceCase = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
const titleCase = s => s.toLowerCase().replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
const list = (arr, max) => arr.length <= max ? arr.join(", ") : `${arr.slice(0, max - 1).join(", ")} +${arr.length - max + 1} more`;

// LaTeX to plain text, good enough for titles and sentences
const plainTex = s => String(s ?? "")
    .replace(/(^|[^\\])%.*$/gm, "$1")
    .replace(/\\ /g, " ").replace(/~/g, " ")
    .replace(/\\(?:textcolor|color)\{[^{}]*\}/g, " ")
    .replace(/\\&/g, "&").replace(/\\(?:ldots|dots)\b/g, "…")
    .replace(/---/g, "—").replace(/--/g, "–")
    .replace(/\\[a-zA-Z@]+\*?(\[[^\]]*\])?/g, " ")
    .replace(/[{}$]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// ── The vault's words (to link a set's words to their notes) ──
const vault = new Map();
for (const p of dv.pages('"Vocabulary"').where(p => p.media)) {
    const raw = p.media?.path ?? String(p.media ?? "");
    vault.set(tokens(p.file.name).join(" "), {
        name: p.file.name, path: p.file.path,
        media: raw.split("|")[0].split("/").pop().replace(/\.md$/i, "").replace(/[\[\]"]/g, "").trim()
    });
}
const maxGram = Math.max(1, ...[...vault.keys()].map(k => k.split(" ").length));

// A declared word ("ensue") may be stored in another form ("ensued")
function lookup(word) {
    const k = tokens(word).join(" ");
    if (vault.has(k)) return vault.get(k);
    if (k.length < 4) return null;
    for (const [n, v] of vault) {
        if (Math.abs(n.length - k.length) <= 3 && (n.startsWith(k) || k.startsWith(n)) && Math.min(n.length, k.length) >= 4) return v;
    }
    return null;
}

// Vault words that appear anywhere in the exercise sheet or the answer key
function mentioned(text) {
    const t = tokens(plainTex(text));
    const grams = new Set();
    for (let i = 0; i < t.length; i++) {
        let g = "";
        for (let n = 0; n < maxGram && i + n < t.length; n++) { g += (n ? " " : "") + t[i + n]; grams.add(g); }
    }
    return [...vault.keys()].filter(k => grams.has(k)).map(k => vault.get(k));
}

// ── Reading one set ──
function parseSheet(ex) {
    const i = ex.indexOf("\\begin{document}");
    const body = i >= 0 ? ex.slice(i) : ex;
    const head = body.slice(0, 5000);
    const out = { title: "", kicker: "", tagline: "", desc: "", exercises: 0, parts: [], declared: null };

    // Title: a big headline in a TikZ title block, or the {\Large ...} subtitle
    const hero = [...head.matchAll(/\\node\[([^\]]*)\][^;{]*\{([^{}]{2,48})\}\s*;/g)]
        .find(m => Number((m[1].match(/fontsize\{(\d+)\}/) || [])[1]) >= 28);
    if (hero) out.title = plainTex(hero[2]);
    if (!out.title) {
        const large = head.match(/\{\\Large\s+([^{}]+)\}/);
        if (large) out.title = plainTex(large[1]).replace(/\s*[—–-]+\s*(Vocabulary\s+)?Practice\s+Set\s*\d+\s*$/i, "");
    }
    if (out.title && out.title === out.title.toUpperCase()) out.title = titleCase(out.title);

    // Kicker: the last part of a "VAULT · 925 CARDS · COMEBACK REVIEW" style header line
    const kick = head.match(/\\node\[[^\]]*\][^;{]*\{([^;]*?\\mdot[^;]*)\}\s*;/);
    if (kick) {
        const seg = kick[1].split(/\\mdot(?:\{\})?/).map(plainTex).filter(Boolean).pop();
        if (seg && !/practice set/i.test(seg)) out.kicker = sentenceCase(seg);
    }

    // Tagline: a short sentence set in \large inside the title block
    const tag = head.match(/\\node\[[^\]]*\\large[^\]]*\][^;{]*\{([^{}]{12,160}\.)\}\s*;/);
    if (tag) out.tagline = plainTex(tag[1]);

    // Intro: the overview sentence, or the first real paragraph after the title
    const ov = body.match(/\\section\*\{Vocabulary Overview\}\s*\\textit\{([^{}]+)\}/);
    if (ov) out.desc = plainTex(ov[1]);
    else {
        let depth = 0;
        for (const line of body.split(/\r?\n/)) {
            if (/\\begin\{tikzpicture\}/.test(line)) depth++;
            if (depth) { if (/\\end\{tikzpicture\}/.test(line)) depth--; continue; }
            const t = plainTex(line);
            if (/^[A-Za-z]/.test(t) && t.split(" ").length >= 12) { out.desc = t; break; }
        }
    }

    out.exercises = (body.match(/\\section\{/g) || []).length + (body.match(/\\exhead\b/g) || []).length;
    out.parts = [...body.matchAll(/\\partbanner\{[^}]*\}\{([^}]*)\}/g)].map(m => sentenceCase(plainTex(m[1])));

    // Words the set declares in its overview table ("Dragon Ball Z & word, word, ...")
    const sec = body.match(/\\section\*\{Vocabulary Overview\}([\s\S]*?)\\section/);
    if (sec) {
        const words = [];
        for (const r of sec[1].matchAll(/\\textbf\{[^&]*\}\s*&\s*([^\\]+)\\\\/g)) {
            for (const w of r[1].split(",")) {
                const k = plainTex(w);
                if (k && !words.some(x => norm(x) === norm(k))) words.push(k);
            }
        }
        if (words.length) out.declared = words;
    }
    return out;
}

const CACHE = (window.__exerciseSetsCache ??= new Map());
async function readSet(dir) {
    const { files } = await adapter.list(dir);
    const base = f => f.split("/").pop();
    const pick = (re, ext) => files.find(f => re.test(base(f)) && f.toLowerCase().endsWith(ext)) ?? null;
    const s = {
        dir, name: base(dir),
        num: Number((base(dir).match(/(\d+)\D*$/) || [])[1]) || null,
        exPdf: pick(/exerc/i, ".pdf"), anPdf: pick(/answer|key|solution/i, ".pdf"),
        exTex: pick(/exerc/i, ".tex"), anTex: pick(/answer|key|solution/i, ".tex")
    };
    if (!s.exPdf && !s.exTex) return null;

    const stats = (await Promise.all(files.filter(f => /\.(pdf|tex)$/i.test(f)).map(f => adapter.stat(f)))).filter(Boolean);
    s.date = stats.length ? Math.min(...stats.map(x => x.mtime)) : null;     // when the set was made

    // Bump PARSER when parseSheet changes, so results cached in this Obsidian session are re-read
    const PARSER = 2;
    const stamp = PARSER + "|" + stats.map(x => x.mtime).join(",") + "|" + vault.size;
    const hit = CACHE.get(dir);
    if (hit && hit.stamp === stamp) return Object.assign(s, hit.data);

    const ex = s.exTex ? await adapter.read(s.exTex) : "";
    const an = s.anTex ? await adapter.read(s.anTex) : "";
    const info = parseSheet(ex);
    let words, missing = [];
    if (info.declared) {
        words = [];
        for (const w of info.declared) {
            const v = lookup(w);
            if (v && !words.includes(v)) words.push(v); else if (!v) missing.push(w);
        }
    } else {
        words = mentioned(ex + "\n" + an);
    }
    const data = { info, words, missing, declared: Boolean(info.declared) };
    CACHE.set(dir, { stamp, data });
    return Object.assign(s, data);
}

// ── Opening files ──
const fileAt = p => p ? app.vault.getAbstractFileByPath(p) : null;
async function sideBySide(s) {
    const ex = fileAt(s.exPdf), an = fileAt(s.anPdf);
    if (!ex || !an) return;
    const left = app.workspace.getLeaf("tab");
    await left.openFile(ex);
    const right = app.workspace.createLeafBySplit(left, "vertical");
    await right.openFile(an);
}

// "Review words": the set's word cards open right inside its card, with the same Study, Shuffle,
// filters and Translation as everywhere else. Nothing navigates, and only one set is open at a time.
function closeReview(card) {
    card.classList.remove("is-reviewing");
    card.querySelector(".xs-review")?.remove();
    const b = card.querySelector(".xs-review-btn");
    if (b) { b.setText(b.dataset.label); b.setAttribute("aria-expanded", "false"); }
}

async function toggleReview(s, card) {
    const wasOpen = card.classList.contains("is-reviewing");
    wrap.querySelectorAll(".xs-set.is-reviewing").forEach(closeReview);
    if (wasOpen) return;

    card.classList.add("is-reviewing");
    const btn = card.querySelector(".xs-review-btn");
    btn.setText("Hide words");
    btn.setAttribute("aria-expanded", "true");

    const panel = card.createEl("div", { cls: "xs-review" });
    const head = panel.createEl("div", { cls: "xs-review-head" });
    head.createEl("span", { cls: "xs-review-title", text: `Words in practice set ${s.num ?? s.name}` });
    const close = head.createEl("button", { text: "Close", cls: "xs-btn", attr: { type: "button" } });
    close.onclick = () => closeReview(card);
    const host = panel.createEl("div");

    const keep = new Set(s.words.map(w => w.path));
    const pages = dv.pages('"Vocabulary"').where(p => keep.has(p.file.path)).array();
    await dv.view("Views/vocab-explorer", { container: host, words: pages, key: `review:${s.name}`, mode: "review" });
    if (panel.isConnected) panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Cards ──
function addCard(parent, s, latest) {
    const c = parent.createEl("div", { cls: "xs-set" + (latest ? " is-latest" : "") });
    c.createEl("div", { cls: "xs-num", text: s.num != null ? pad(s.num) : "•" });
    const main = c.createEl("div", { cls: "xs-main" });

    const top = main.createEl("div", { cls: "xs-top" });
    top.createEl("span", { cls: "xs-kicker", text: [s.num != null ? `Practice set ${s.num}` : s.name, s.info.kicker].filter(Boolean).join(" · ") });
    if (s.date) top.createEl("span", { cls: "xs-date", text: fmtDate(s.date) });

    main.createEl("div", { cls: "xs-title", text: s.info.title || `Practice set ${s.num ?? ""}`.trim() });
    if (s.info.tagline) main.createEl("div", { cls: "xs-tagline", text: s.info.tagline });
    const desc = ABOUT[s.name] || s.info.desc;
    if (desc) main.createEl("div", { cls: "xs-desc", text: desc, attr: { title: desc } });

    // What it contains, and what it is built from
    const media = [];
    for (const w of s.words) if (w.media && !media.includes(w.media)) media.push(w.media);
    const counts = Object.fromEntries(media.map(m => [m, s.words.filter(w => w.media === m).length]));
    media.sort((a, b) => counts[b] - counts[a]);
    const facts = [];
    if (s.info.parts.length) facts.push(plural(s.info.parts.length, "part"));
    if (s.info.exercises) facts.push(plural(s.info.exercises, "exercise"));
    if (s.words.length) facts.push(`${plural(s.words.length, s.declared ? "word" : "vault word")}`);
    if (media.length) facts.push(list(media, 3));
    if (facts.length) main.createEl("div", { cls: "xs-facts", text: facts.join(" · ") });
    if (s.info.parts.length) main.createEl("div", { cls: "xs-parts", text: s.info.parts.join(" · ") });

    const actions = main.createEl("div", { cls: "xs-actions" });
    const link = (path, text, cls) => actions.createEl("a", { text, cls: "internal-link xs-btn " + cls, attr: { "data-href": path, href: path } });
    if (s.exPdf) link(s.exPdf, "Exercises", "is-primary");
    if (s.anPdf) link(s.anPdf, "Answer key", "");
    if (s.exPdf && s.anPdf) {
        const b = actions.createEl("button", { text: "Side by side", cls: "xs-btn", attr: { type: "button", title: "Open the exercises and the answer key next to each other" } });
        b.onclick = () => sideBySide(s);
    }
    if (s.words.length) {
        const label = `Review ${plural(s.words.length, "word")}`;
        const b = actions.createEl("button", {
            text: label, cls: "xs-btn xs-review-btn",
            attr: { type: "button", "aria-expanded": "false", "data-label": label, title: "Open this set's words as cards, right here" }
        });
        b.onclick = () => toggleReview(s, c);
    }
    if (!s.exPdf) actions.createEl("span", { cls: "xs-note", text: "No PDF yet: compile the .tex to open it here" });
}

// ── Render ──
const wrap = root.createEl("div", { cls: "xs" });
wrap.createEl("p", { cls: "vocab-hint", text: "Reading exercise sets…" });

let sets = [];
try {
    if (await adapter.exists(FOLDER)) {
        const { folders } = await adapter.list(FOLDER);
        sets = (await Promise.all(folders.map(readSet))).filter(Boolean);
    }
} catch (e) {
    wrap.innerHTML = "";
    wrap.createEl("p", { cls: "vocab-hint", text: `Could not read ${FOLDER}/: ${e.message}` });
    return;
}
sets.sort((a, b) => (b.num ?? 0) - (a.num ?? 0) || (b.date ?? 0) - (a.date ?? 0));

wrap.innerHTML = "";
if (sets.length === 0) {
    wrap.createEl("p", { cls: "vocab-hint", text: `No exercise sets in ${FOLDER}/ yet.` });
    return;
}
const listEl = wrap.createEl("div", { cls: "xs-list" });
sets.slice(0, SHOW).forEach((s, i) => addCard(listEl, s, i === 0));
if (sets.length > SHOW) {
    const more = wrap.createEl("button", { cls: "xs-more", text: `Show all ${sets.length} sets`, attr: { type: "button" } });
    more.onclick = () => { sets.slice(SHOW).forEach(s => addCard(listEl, s, false)); more.remove(); };
}
