// Activity calendar + word cards. Shared by the Homepage, every media page and the exercise sets.
//   Homepage:     await dv.view("Views/vocab-explorer", { words, key: "home", mode: "home" })
//   Media page:   await dv.view("Views/vocab-explorer", { words, key: folder })
//   Exercise set: await dv.view("Views/vocab-explorer", { words, key: "review:<set>", mode: "review" })  (no calendar)
//
// Each word note is read once (cached by modification time) for its parts of speech,
// first definition, first example and Portuguese translation. Notes are never modified.
// Translations stay hidden until asked for, like the collapsed callout inside the notes.
// input.container (optional) renders into another element, e.g. a panel inside an exercise set card.
const root = input?.container ?? dv.container;
root.innerHTML = "";

if (!getComputedStyle(document.body).getPropertyValue("--vocab-ui").trim()) {
    root.createEl("div", { text: 'Snippet "vocabulary-theme" is not enabled (Settings > Appearance > CSS snippets).' })
        .style.cssText = "border:1px solid currentColor;padding:6px 10px;margin-bottom:8px;font-size:.85em;";
}

const HOME = input?.mode === "home";
const REVIEW = input?.mode === "review";   // a fixed list of words, e.g. one exercise set
const KEY = String(input?.key ?? dv.current()?.file?.path ?? "default");
const PAGE = HOME ? 12 : 24;   // cards per "Show more"
const STRIP = 6;               // cards on the Homepage until you search or pick a day
const WEEKS = 53;              // calendar columns (one year)

// ── Helpers ──
const pad = n => String(n).padStart(2, "0");
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fmtDay = s => { const d = parseISO(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDayLong = s => `${WEEKDAYS[parseISO(s).getDay()]}, ${fmtDay(s)}`;
const fmtShort = s => { const d = parseISO(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}` + (d.getFullYear() === new Date().getFullYear() ? "" : ` ${d.getFullYear()}`); };
const plural = (n, w, ws) => `${n} ${n === 1 ? w : (ws ?? w + "s")}`;
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const coll = new Intl.Collator("en", { sensitivity: "base", numeric: true });
const byName = (a, b) => coll.compare(a.name, b.name);
const letterOf = n => { const c = norm(n).charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : "#"; };
const toArray = v => Array.isArray(v) ? v : (v?.array ? v.array() : (v == null ? [] : [v]));

// Stable shuffle: every word gets a fixed hash, mixed with a seed that changes on "Shuffle"
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mix = (h, seed) => {
    h = Math.imul(h ^ seed, 0x9e3779b1); h ^= h >>> 15;
    h = Math.imul(h, 0x85ebca77); h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae3d); h ^= h >>> 16;
    return h >>> 0;
};
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

const dateOf = p => {
    const c = p.created ?? p.file.ctime;
    if (!c) return "";
    const s = c.toISODate ? c.toISODate() : String(c).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
};
const mediaOf = p => {
    const raw = p.media?.path ?? String(p.media ?? "");
    return raw.split("|")[0].split("/").pop().replace(/\.md$/i, "").replace(/[\[\]"]/g, "").trim();
};

const today = isoOf(new Date());
const ago = s => {
    const n = Math.round((parseISO(today) - parseISO(s)) / 864e5);
    if (n <= 0) return "today";
    if (n === 1) return "yesterday";
    if (n < 45) return `${n} days ago`;
    return `on ${fmtDay(s)}`;
};

// ── Words ──
const items = Array.from(input?.words ?? [])
    .filter(p => p?.file?.path)
    .map(p => ({
        name: p.file.name,
        path: p.file.path,
        key: norm(p.file.name),
        date: dateOf(p),
        media: mediaOf(p),
        tags: toArray(p.tags).map(t => norm(String(t).replace(/^#/, ""))),
        h0: fnv(p.file.path),
        info: null, cats: ["other"], labels: [], defKey: "", trKey: ""
    }));

if (items.length === 0) {
    root.createEl("p", { text: "No words yet.", cls: "vocab-hint" });
    return;
}

// ── Reading the notes: senses (part of speech, definition, example) and translation ──
const strip = s => String(s ?? "")
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
    .replace(/[*_`]/g, "")
    .replace(/^[-+]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
const isPosLine = l => /^\*[^*]+\*\s*([—–-].*|\(.*\))?\s*$/.test(l);

function parseNote(text) {
    const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---[^\n]*\n/, "");
    const defMatch = body.match(/^##[^\n]*Definition[^\n]*\n([\s\S]*?)(?=^---\s*$|^## )/m);
    const senses = [];
    let cur = null;
    for (const raw of (defMatch ? defMatch[1] : "").split(/\r?\n/)) {
        const l = raw.trim();
        if (!l) continue;
        if (l.startsWith("###")) {                       // "### Sense 2 — *verb* (Common)"
            const h = l.match(/^###\s*(?:Sense\s*\d*)?\s*[—–-]*\s*(?:\*([^*]+)\*)?/);
            cur = { pos: h?.[1] ?? "", def: "", ex: "" };
            senses.push(cur);
            continue;
        }
        if (isPosLine(l)) {                              // "*noun* — (Common)" in single-meaning notes
            const p = l.match(/^\*([^*]+)\*/)[1];
            if (cur && !cur.pos && !cur.def) cur.pos = p;
            else { cur = { pos: p, def: "", ex: "" }; senses.push(cur); }
            continue;
        }
        if (!cur) { cur = { pos: "", def: "", ex: "" }; senses.push(cur); }
        if (l.startsWith(">")) {
            const e = l.match(/^>\s*-\s+(.*)/);
            if (e && !cur.ex) cur.ex = e[1];
            continue;
        }
        if (l.startsWith("#")) continue;
        if (!cur.def) cur.def = l;
    }
    const tr = body.match(/\*\*Tradu[^*\n]*\*\*:?\s*([^\n]+)/);
    return {
        senses: senses.map(s => ({ pos: strip(s.pos), def: strip(s.def), ex: strip(s.ex) })),
        tr: tr ? strip(tr[1]) : ""
    };
}

const CACHE = (window.__vocabIndexV2 ??= new Map());
async function loadIndex() {
    const todo = [];
    for (const it of items) {
        const f = app.vault.getAbstractFileByPath(it.path);
        if (!f) continue;
        const hit = CACHE.get(it.path);
        if (hit && hit.mtime === f.stat.mtime) it.info = hit;
        else todo.push([it, f]);
    }
    for (let i = 0; i < todo.length; i += 64) {
        await Promise.all(todo.slice(i, i + 64).map(async ([it, f]) => {
            try {
                const info = { mtime: f.stat.mtime, ...parseNote(await app.vault.cachedRead(f)) };
                CACHE.set(it.path, info);
                it.info = info;
            } catch (e) { /* unreadable note: the card still shows, without details */ }
        }));
    }
}

// Parts of speech: every sense counts, so "haul" is both a verb and a noun
const CATS = {
    noun: "Nouns", verb: "Verbs", adjective: "Adjectives", adverb: "Adverbs",
    phrasal: "Phrasal verbs", idiom: "Idioms & phrases", other: "Other"
};
function posInfo(it) {
    const basic = [], special = [];
    let idiomLabel = null;
    for (const s of it.info?.senses ?? []) {
        const p = norm(s.pos);
        if (!p) continue;
        if (p.includes("phrasal") && !special.includes("phrasal")) special.push("phrasal");
        if (/idiom|expression|saying|proverb|phrase/.test(p)) {
            if (!special.includes("idiom")) special.push("idiom");
            if (p.includes("idiom")) idiomLabel = "idiom";
            else idiomLabel ??= "phrase";
        }
        const core = p.replace(/phrasal verbs?/g, " ")
            .replace(/\b(noun|verb|adjective|adverb|prepositional|adjectival|adverbial)\s+phrases?\b/g, " ");
        for (const m of core.matchAll(/\b(noun|verb|adjective|adverb)s?\b/g)) {
            if (!basic.includes(m[1])) basic.push(m[1]);
        }
    }
    if (it.tags.includes("phrasal-verb") && !special.includes("phrasal")) special.push("phrasal");
    if (it.tags.includes("idiom") && !special.includes("idiom")) { special.push("idiom"); idiomLabel ??= "idiom"; }
    const cats = [...basic, ...special];
    const label = { noun: "noun", verb: "verb", adjective: "adjective", adverb: "adverb", phrasal: "phrasal verb", idiom: idiomLabel ?? "idiom" };
    return { cats: cats.length ? cats : ["other"], labels: cats.map(c => label[c]) };
}

// ── Activity per day ──
const byDay = new Map();
for (const it of items) {
    if (!it.date) continue;
    let d = byDay.get(it.date);
    if (!d) byDay.set(it.date, d = { n: 0, media: new Map() });
    d.n++;
    if (it.media) d.media.set(it.media, (d.media.get(it.media) ?? 0) + 1);
}
const days = [...byDay.keys()].sort();
const maxN = Math.max(1, ...[...byDay.values()].map(d => d.n));
// Square-root scale, so a 10-word day is still visible next to a 400-word day
const levelOf = n => n ? Math.min(4, Math.max(1, Math.ceil(4 * Math.sqrt(n / maxN)))) : 0;
const topMedia = info => [...info.media.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);

// ── State (kept in memory, so a Dataview refresh does not reset what you were doing) ──
const STATES = (window.__vocabExplorerV2 ??= {});
const st = (STATES[KEY] ??= {
    q: "", sort: REVIEW ? "az" : "recent", cat: "all", day: null, limit: PAGE, page: 0,
    seed: newSeed(), revealed: new Set(), trOpen: new Set()
});
if (st.day && !byDay.has(st.day)) st.day = null;
if (REVIEW) st.day = null;
delete st.only;   // left over from the earlier "Review words" hand-off
if (HOME && st.sort === "az") st.sort = "recent";
let study = false;
try { study = localStorage.getItem("vocab-explorer-study:" + KEY) === "1"; } catch (e) { /* storage unavailable */ }
let ready = false;

// ── Layout ──
const wrap = root.createEl("div", { cls: "vx" + (HOME ? " is-home" : "") + (REVIEW ? " is-review" : "") });

const cal = wrap.createEl("div", { cls: "vx-cal" });
const calHead = cal.createEl("div", { cls: "vx-cal-head" });
const calRange = calHead.createEl("span", { cls: "vx-cal-range" });
const calNav = calHead.createEl("span", { cls: "vx-cal-nav" });
const prevBtn = calNav.createEl("button", { text: "‹", attr: { type: "button", "aria-label": "Previous year" } });
const nextBtn = calNav.createEl("button", { text: "›", attr: { type: "button", "aria-label": "Next year" } });
const monthRow = cal.createEl("div", { cls: "vx-cal-months" });
const grid = cal.createEl("div", { cls: "vx-cal-grid" });
const caption = cal.createEl("div", { cls: "vx-cal-caption" });
if (REVIEW) cal.remove();

const tools = wrap.createEl("div", { cls: "vx-toolbar" });
const search = tools.createEl("input", {
    cls: "vx-search",
    attr: { type: "text", placeholder: `Search ${plural(items.length, "word")}…`, "aria-label": "Search words", spellcheck: "false" }
});
search.value = st.q;
const seg = tools.createEl("div", { cls: "vx-seg", attr: { role: "group", "aria-label": "Order" } });
const SORTS = HOME
    ? [["recent", "Recent"], ["shuffle", "Shuffle"]]
    : [["recent", "Recent"], ["az", "A–Z"], ["shuffle", "Shuffle"]];
const sortBtns = {};
for (const [k, label] of SORTS) {
    const b = seg.createEl("button", { text: label, cls: "vx-btn", attr: { type: "button" } });
    b.onclick = () => {
        if (k === "shuffle" && st.sort === "shuffle") st.seed = newSeed();   // click again to reshuffle
        st.sort = k;
        st.limit = PAGE;
        syncTools();
        renderResults();
    };
    sortBtns[k] = b;
}
const studyBtn = tools.createEl("button", {
    text: "Study", cls: "vx-btn vx-btn-box",
    attr: { type: "button", title: "Hide definitions and examples. Recall the meaning, then click a card to check." }
});

const chips = HOME ? null : wrap.createEl("div", { cls: "vx-chips" });
const status = wrap.createEl("div", { cls: "vx-status" });
const results = wrap.createEl("div", { cls: "vx-results" });
const more = wrap.createEl("button", { cls: "vx-more", attr: { type: "button" } });

// ── Calendar ──
function dayText(s) {
    const info = byDay.get(s);
    if (!info) return `${fmtDayLong(s)} · no words`;
    let t = `${fmtDayLong(s)} · ${plural(info.n, "word")}`;
    if (HOME && info.media.size) {
        const m = topMedia(info);
        t += " · " + m.slice(0, 3).join(", ") + (m.length > 3 ? ` +${m.length - 3}` : "");
    }
    return t;
}
function defaultCaption() {
    if (st.day) return `${dayText(st.day)} · click the day again to show all`;
    if (days.length === 0) return plural(items.length, "word");
    return `${plural(items.length, "word")} · ${plural(days.length, "study day")} · last added ${ago(days[days.length - 1])}`;
}

function renderCal() {
    if (REVIEW) return;
    monthRow.innerHTML = "";
    grid.innerHTML = "";
    const now = parseISO(today);
    const end = addDays(now, 6 - now.getDay() - st.page * WEEKS * 7);   // Saturday closing the last column
    const start = addDays(end, -(WEEKS * 7 - 1));                         // Sunday opening the first column
    calRange.setText(`${MONTHS[start.getMonth()]} ${start.getFullYear()} – ${MONTHS[end.getMonth()]} ${end.getFullYear()}`);
    prevBtn.disabled = !(days.length && days[0] < isoOf(start));
    nextBtn.disabled = st.page === 0;

    for (let w = 0; w < WEEKS; w++) {
        const weekStart = addDays(start, w * 7);
        for (let i = 0; i < 7; i++) {
            const d = addDays(weekStart, i);
            if (d.getDate() === 1 && w < WEEKS - 2) {
                const m = monthRow.createEl("span", { text: MONTHS[d.getMonth()] });
                m.style.gridColumn = String(w + 1);
            }
            const s = isoOf(d);
            const n = byDay.get(s)?.n ?? 0;
            const cell = grid.createEl("div", { cls: "vx-day" });
            cell.dataset.date = s;
            cell.dataset.level = String(levelOf(n));
            if (s > today) cell.classList.add("is-future");
            if (s === today) cell.classList.add("is-today");
            if (s === st.day) cell.classList.add("is-selected");
            if (n) {
                cell.tabIndex = 0;
                cell.setAttribute("role", "button");
                cell.setAttribute("aria-label", `${fmtDayLong(s)}: ${plural(n, "word")}`);
            }
        }
    }
    caption.setText(defaultCaption());
}

const pickDay = cell => {
    if (!cell || !byDay.has(cell.dataset.date)) return;
    st.day = st.day === cell.dataset.date ? null : cell.dataset.date;
    st.limit = PAGE;
    renderCal();
    renderResults();
};
grid.addEventListener("mouseover", e => {
    const c = e.target.closest(".vx-day");
    if (c && !c.classList.contains("is-future")) caption.setText(dayText(c.dataset.date));
});
grid.addEventListener("mouseleave", () => caption.setText(defaultCaption()));
grid.addEventListener("click", e => pickDay(e.target.closest(".vx-day")));
grid.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickDay(e.target.closest(".vx-day")); }
});
prevBtn.onclick = () => { st.page++; renderCal(); };
nextBtn.onclick = () => { st.page = Math.max(0, st.page - 1); renderCal(); };

// ── Search and order ──
function scoreOf(it, q) {
    if (it.key === q) return 0;
    if (it.key.startsWith(q)) return 1;
    if (it.key.includes(" " + q)) return 2;
    if (it.key.includes(q)) return 3;
    if (q.length < 3) return -1;
    if (it.defKey.includes(q)) return 4;     // English definitions: "dwelling" finds abode
    if (it.trKey.includes(q)) return 5;      // Portuguese: "moradia" finds abode
    return -1;
}

// Day + search + order, before the part-of-speech filter (so the filter counts stay honest)
function baseList() {
    const q = norm(st.q.trim());
    const out = st.day ? items.filter(it => it.date === st.day) : items.slice();
    const trHits = new Set();
    if (q) {
        const scored = [];
        for (const it of out) {
            const s = scoreOf(it, q);
            if (s < 0) continue;
            scored.push([it, s]);
            if (s === 5) trHits.add(it);      // you searched in Portuguese, so that card shows its translation
        }
        scored.sort((a, b) => a[1] - b[1] || byName(a[0], b[0]));
        return { list: scored.map(x => x[0]), trHits };
    }
    if (st.sort === "az") out.sort(byName);
    else if (st.sort === "shuffle") out.sort((a, b) => mix(a.h0, st.seed) - mix(b.h0, st.seed));
    else out.sort((a, b) => b.date.localeCompare(a.date) || byName(a, b));
    return { list: out, trHits };
}
const visibleList = () => {
    const { list } = baseList();
    return st.cat === "all" ? list : list.filter(it => it.cats.includes(st.cat));
};

const openNote = (path, newTab) => app.workspace.openLinkText(path, "", newTab);

function syncTools() {
    for (const [k, b] of Object.entries(sortBtns)) {
        const on = st.sort === k;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
        if (k === "shuffle") {
            b.setText(on ? "Shuffle ↻" : "Shuffle");
            b.title = on ? "Click again to reshuffle" : "Show the words in random order";
        }
    }
    studyBtn.classList.toggle("is-active", study);
    studyBtn.setAttribute("aria-pressed", String(study));
    wrap.classList.toggle("is-study", study);
}

// ── Cards ──
function addCard(gridEl, it, showTr, showDate) {
    const inf = it.info ?? { senses: [], tr: "" };
    const first = inf.senses.find(s => s.def) ?? inf.senses[0] ?? {};
    const c = gridEl.createEl("div", { cls: "vx-card", attr: { tabindex: "0" } });
    if (st.revealed.has(it.path)) c.classList.add("is-revealed");

    const pos = it.labels.slice(0, 3).join(" · ") + (it.labels.length > 3 ? ` +${it.labels.length - 3}` : "");
    c.createEl("div", { text: pos, cls: "vx-card-pos" });
    c.createEl("a", { text: it.name, cls: "internal-link vx-card-word", attr: { "data-href": it.path, href: it.path } });

    const body = c.createEl("div", { cls: "vx-card-body" });
    if (first.def) body.createEl("div", { text: first.def, cls: "vx-card-def", attr: { title: first.def } });
    if (first.ex) body.createEl("div", { text: first.ex, cls: "vx-card-ex" });

    let trBtn = null;
    if (inf.tr) c.createEl("div", { text: inf.tr, cls: "vx-card-tr" });
    const foot = c.createEl("div", { cls: "vx-card-foot" });
    const meta = [];
    if (HOME || REVIEW) {
        if (it.media) meta.push(it.media);
    } else {
        if (inf.senses.length > 1) meta.push(`${inf.senses.length} senses`);
        if (showDate && it.date) meta.push(fmtShort(it.date));
    }
    foot.createEl("span", { text: meta.join(" · "), cls: "vx-card-meta" });
    if (inf.tr) {
        trBtn = foot.createEl("button", {
            text: "Translation", cls: "vx-card-trbtn",
            attr: { type: "button", title: "Show the Portuguese translation", "aria-expanded": "false" }
        });
        trBtn.onclick = e => {
            e.stopPropagation();
            const open = !c.classList.contains("is-tr-open");
            c.classList.toggle("is-tr-open", open);
            trBtn.setAttribute("aria-expanded", String(open));
            if (open) st.trOpen.add(it.path); else st.trOpen.delete(it.path);
        };
        if (showTr || st.trOpen.has(it.path)) {
            c.classList.add("is-tr-open");
            trBtn.setAttribute("aria-expanded", "true");
        }
    }

    const reveal = () => {
        const on = !c.classList.contains("is-revealed");
        c.classList.toggle("is-revealed", on);
        if (on) st.revealed.add(it.path); else st.revealed.delete(it.path);
    };
    c.addEventListener("click", e => {
        if (e.target.closest("a, button")) return;
        if (study) reveal();
        else openNote(it.path, e.ctrlKey || e.metaKey);
    });
    c.addEventListener("keydown", e => {
        if (e.target !== c || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        if (study) reveal();
        else openNote(it.path, e.ctrlKey || e.metaKey);
    });
}

function groupHead(g, n) {
    const h = results.createEl("div", { cls: "vx-group" });
    h.createEl("span", { text: st.sort === "az" ? g : (g ? fmtDay(g) : "No date"), cls: "vx-group-label" });
    h.createEl("span", { text: plural(n, "word"), cls: "vx-group-meta" });
}

// Homepage before any search: six cards, the latest ones or a random handful
function renderStrip(list) {
    const head = results.createEl("div", { cls: "vx-group" });
    if (st.sort === "shuffle") {
        head.createEl("span", { text: "Random selection", cls: "vx-group-label" });
        const again = head.createEl("button", { text: "Shuffle again", cls: "vx-link", attr: { type: "button" } });
        again.onclick = () => { st.seed = newSeed(); renderResults(); };
    } else {
        const d = list[0]?.date;
        head.createEl("span", { text: d ? `Latest · ${fmtDay(d)}` : "Latest", cls: "vx-group-label" });
        const n = d ? (byDay.get(d)?.n ?? 0) : 0;
        if (n > STRIP) {
            const all = head.createEl("button", { text: `Show all ${n} from that day`, cls: "vx-link", attr: { type: "button" } });
            all.onclick = () => { st.day = d; st.limit = PAGE; renderCal(); renderResults(); };
        }
    }
    const g = results.createEl("div", { cls: "vx-grid" });
    for (const it of list.slice(0, STRIP)) addCard(g, it, false, false);
}

function renderResults() {
    if (!ready) return;
    const q = st.q.trim();
    const { list: base, trHits } = baseList();

    // Part-of-speech filter (media pages); a word counts in every category it has
    if (chips) {
        const counts = {};
        for (const it of base) for (const c of it.cats) counts[c] = (counts[c] ?? 0) + 1;
        chips.innerHTML = "";
        const chip = (k, label, n) => {
            const on = st.cat === k;
            const c = chips.createEl("button", { cls: "vx-chip" + (on ? " is-active" : ""), attr: { type: "button", "aria-pressed": String(on) } });
            c.createEl("span", { text: label });
            c.createEl("span", { text: String(n), cls: "vx-chip-n" });
            c.onclick = () => { st.cat = (on && k !== "all") ? "all" : k; st.limit = PAGE; renderResults(); };
        };
        chip("all", "All", base.length);
        for (const k of Object.keys(CATS)) if (counts[k] || st.cat === k) chip(k, CATS[k], counts[k] ?? 0);
    }
    const shown = st.cat === "all" ? base : base.filter(it => it.cats.includes(st.cat));

    // Status line: active filters and the study hint
    status.innerHTML = "";
    const filtered = Boolean(q || st.day || st.cat !== "all");
    if (filtered) {
        let text = q ? plural(shown.length, "match", "matches") : plural(shown.length, "word");
        if (st.cat !== "all") text += ` · ${CATS[st.cat].toLowerCase()}`;
        if (st.day) text += ` · added on ${fmtDay(st.day)}`;
        status.createEl("span", { text });
        const clear = status.createEl("button", { text: "Clear", cls: "vx-link", attr: { type: "button" } });
        clear.onclick = () => {
            st.q = ""; search.value = ""; st.day = null; st.cat = "all"; st.limit = PAGE;
            renderCal(); renderResults();
        };
    }
    if (study) status.createEl("span", { text: "Study: recall the meaning, then click a card to check", cls: "vx-status-hint" });
    status.style.display = (filtered || study) ? "" : "none";

    results.innerHTML = "";
    more.style.display = "none";
    if (HOME && !filtered) { renderStrip(base); return; }
    if (shown.length === 0) {
        results.createEl("p", { text: "No words match.", cls: "vx-empty" });
        return;
    }

    // Media pages group by day (Recent) or letter (A-Z); search, Shuffle, the Homepage and review panels stay flat
    const grouped = !HOME && !REVIEW && !q && st.sort !== "shuffle";
    const groupOf = it => st.sort === "az" ? letterOf(it.name) : it.date;
    const groupCounts = new Map();
    if (grouped) for (const it of shown) groupCounts.set(groupOf(it), (groupCounts.get(groupOf(it)) ?? 0) + 1);
    const showDate = !(grouped && st.sort === "recent") && !(HOME && st.day);
    let last, g = null;
    for (const it of shown.slice(0, st.limit)) {
        if (grouped && groupOf(it) !== last) { last = groupOf(it); groupHead(last, groupCounts.get(last)); g = null; }
        if (!g) g = results.createEl("div", { cls: "vx-grid" });
        addCard(g, it, trHits.has(it), showDate);
    }
    const left = shown.length - st.limit;
    if (left > 0) {
        more.style.display = "";
        more.setText(`Show ${Math.min(left, PAGE)} more · ${left} left`);
    }
}

// ── Events ──
let timer = null;
search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => { st.q = search.value; st.limit = PAGE; renderResults(); }, 90);
});
search.addEventListener("keydown", e => {
    if (e.key === "Escape" && search.value) {
        e.preventDefault(); e.stopPropagation();
        search.value = ""; st.q = ""; st.limit = PAGE; renderResults();
    } else if (e.key === "Enter") {
        const first = visibleList()[0];
        if (first) openNote(first.path, e.ctrlKey || e.metaKey);
    }
});
studyBtn.onclick = () => {
    study = !study;
    st.revealed.clear();
    try { localStorage.setItem("vocab-explorer-study:" + KEY, study ? "1" : "0"); } catch (e) { /* storage unavailable */ }
    syncTools();
    renderResults();
};
more.onclick = () => { st.limit += PAGE; renderResults(); };

// The earlier version listened for "Review words" from the exercise sets; drop that listener if this session still has it
const OLD = window.__vocabExplorerHandlers;
if (OLD?.[KEY]) { window.removeEventListener("vocab-explorer:show", OLD[KEY]); delete OLD[KEY]; }

// ── First render: calendar now, cards once the notes are read ──
syncTools();
renderCal();
more.style.display = "none";
status.style.display = "none";
results.createEl("p", { text: "Reading notes…", cls: "vx-empty" });
await loadIndex();
for (const it of items) {
    Object.assign(it, posInfo(it));
    it.defKey = norm((it.info?.senses ?? []).map(s => s.def).join(" "));
    it.trKey = norm(it.info?.tr);
}
ready = true;
renderResults();
