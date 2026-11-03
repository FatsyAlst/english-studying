
# 📚 English Vocabulary Tracker

> *Learn English vocabulary through the media you love.*

---

## Media Sources

```dataviewjs
const root = dv.container;
root.innerHTML = "";

// created date (falls back to file creation time), as ISO yyyy-mm-dd
const dateOf = p => {
    const c = p.created ?? p.file.ctime;
    if (!c) return "";
    return c.toISODate ? c.toISODate() : String(c).slice(0, 10);
};

// Fail loudly if the CSS snippet is off, instead of silently showing an unstyled page
if (!getComputedStyle(document.body).getPropertyValue("--vocab-ui").trim()) {
    root.createEl("div", { text: 'Snippet "vocabulary-theme" is not enabled (Settings > Appearance > CSS snippets).', cls: "vocab-warn" })
        .style.cssText = "border:1px solid currentColor;padding:6px 10px;margin-bottom:8px;font-size:.85em;";
}

const all = dv.pages('"Vocabulary"');
const words = all.where(p => p.media);
const sources = all
    .where(p => (p.tags ?? []).includes("media") && p.category)
    .sort(p => p.file.name, "asc");

// Words per media: same scope as before (the media folder and its subfolders)
const countFor = folder => words.where(w => w.file.folder === folder || w.file.folder.startsWith(folder + "/")).length;

// One quiet summary line (replaces the Statistics section)
const now = new Date();
const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const thisMonth = words.where(w => dateOf(w).startsWith(ym)).length;
root.createEl("div", {
    cls: "vocab-summary",
    text: `${words.length} words \u00B7 ${sources.length} sources \u00B7 ${thisMonth} this month`
});

if (sources.length === 0) {
    root.createEl("p", { text: "No media pages found (need tags: media and a category).", cls: "vocab-hint" });
}

// Same emoji placeholders as the original gallery (unicode escapes: dragon, film, TV, book, seedling for "personal", books)
const icons = { anime: "\uD83D\uDC09", movie: "\uD83C\uDFAC", series: "\uD83D\uDCFA", manga: "\uD83D\uDCD6", personal: "\uD83C\uDF31" };

const grid = root.createEl("div", { cls: "media-grid" });
for (const m of sources) {
    const n = countFor(m.file.folder);
    const open = (newTab) => app.workspace.openLinkText(m.file.path, "", newTab);

    const card = grid.createEl("div", {
        cls: "media-card",
        attr: { role: "link", tabindex: "0", "aria-label": `${m.file.name}, ${n} words` }
    });
    card.addEventListener("click", e => open(e.ctrlKey || e.metaKey));
    card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(false); }
    });

    // Cover
    const cover = card.createEl("div", { cls: "media-cover" });
    const placeholder = () => cover.createEl("div", { cls: "media-placeholder", text: icons[m.category] || "\uD83D\uDCDA" });
    const coverPath = typeof m.cover === "string" ? m.cover : m.cover?.path;
    const coverFile = coverPath ? app.vault.getAbstractFileByPath(coverPath) : null;
    const src = coverFile
        ? app.vault.getResourcePath(coverFile)
        : (coverPath ? app.vault.adapter.getResourcePath(coverPath) : null);
    if (src) {
        const img = cover.createEl("img", { attr: { src, alt: "", loading: "lazy", draggable: "false" } });
        img.style.pointerEvents = "none";   // clicks go to the card, so Obsidian image zoom never opens
        img.addEventListener("error", () => { img.remove(); placeholder(); });
    } else {
        placeholder();
    }

    // The one standard badge (styled in the snippet; same for every category)
    cover.createEl("span", { cls: "media-badge", text: String(m.category ?? "media").toUpperCase() });

    // Title + count
    const info = card.createEl("div", { cls: "media-info" });
    info.createEl("div", { cls: "media-title", text: m.file.name });
    info.createEl("div", { cls: "media-count", text: n + (n === 1 ? " word" : " words") });
}
```

## Words

```dataviewjs
await dv.view("Views/vocab-explorer", {
    words: dv.pages('"Vocabulary"').where(p => p.media).array(),
    key: "home",
    mode: "home"
});
```

---
## 📰 Blog

```dataviewjs
const posts = dv.pages('"Blog"')
    .where(p => p.tags && p.tags.includes("blog"))
    .sort(p => p.publishedAt, 'desc');

const root = dv.container;
root.innerHTML = "";

for (const post of posts) {
    const card = root.createEl("div");
    card.style.cssText = "border:1px solid var(--background-modifier-border);border-radius:10px;padding:20px 24px;margin-top:4px;margin-bottom:18px;background:rgba(var(--vocab-accent-rgb),0.02);transition:border-color 0.2s,transform 0.2s;cursor:pointer;";

    // Meta line
    const meta = card.createEl("div");
    meta.style.cssText = "display:flex;gap:8px;align-items:center;font-size:0.8em;color:var(--text-muted);margin-bottom:10px;flex-wrap:wrap;";
    const date = post.publishedAt ? new Date(post.publishedAt.toString()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    if (date) meta.createEl("span", { text: "📅 " + date });
    if (post.readingTime) meta.createEl("span", { text: "· " + post.readingTime + " min read" });
    if (post.categories) {
        const cats = Array.isArray(post.categories) ? post.categories : [post.categories];
        for (const c of cats) {
            const tag = meta.createEl("span", { text: c });
            tag.style.cssText = "background:rgba(var(--vocab-accent-rgb),0.12);color:var(--vocab-accent);padding:1px 8px;border-radius:10px;font-size:0.9em;";
        }
    }

    // Title
    const titleEl = card.createEl("a", {
        text: post.title || post.file.name,
        cls: "internal-link",
        attr: { "data-href": post.file.path, href: post.file.path }
    });
    titleEl.style.cssText = "font-size:1.2em;font-weight:700;color:var(--text-normal);text-decoration:none;display:block;margin-bottom:8px;";

    // "Read more" hint
    const hint = card.createEl("p");
    hint.style.cssText = "color:var(--text-muted);font-size:0.9em;margin:0;line-height:1.5;";
    hint.setText("Click to read →");

    // Make whole card clickable
    card.onclick = (e) => {
        if (e.target.tagName !== 'A') {
            const link = card.querySelector('a.internal-link');
            if (link) link.click();
        }
    };
    card.onmouseenter = () => { card.style.borderColor = "var(--vocab-accent)"; card.style.transform = "translateY(-2px)"; };
    card.onmouseleave = () => { card.style.borderColor = "var(--background-modifier-border)"; card.style.transform = "none"; };
}

if (posts.length === 0) {
    root.createEl("p", { text: "No blog posts yet. Start writing!" }).style.color = "var(--text-muted)";
}
```

---
## 💡 Vocabulary Insights

```dataviewjs
const catColors = {
    comparison: "#c084fc",
    grammar: "#38bdf8",
    "phrasal-verbs": "#fb923c",
    "fixed-expressions": "#4ade80",
    nuances: "#f472b6",
    patterns: "#facc15"
};

const posts = dv.pages('"Vocabulary Insights"')
    .where(p => p.tags && p.tags.includes("insight"))
    .sort(p => p.publishedAt, 'desc');

const root = dv.container;
root.innerHTML = "";

for (const post of posts) {
    const cat = post.category || "insight";
    const catColor = catColors[cat] || "#c084fc";

    const card = root.createEl("div", { cls: "vocab-insight-card" });
    card.style.borderLeftColor = catColor;
    card.style.background = `${catColor}08`;

    // Top row: category pill + date
    const top = card.createEl("div");
    top.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;";

    const pill = top.createEl("span", { text: cat });
    pill.style.cssText = `background:${catColor}22;color:${catColor};padding:2px 10px;border-radius:10px;font-size:0.72em;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;border:1px solid ${catColor}33;`;

    const date = post.publishedAt
        ? new Date(post.publishedAt.toString()).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
        : '';
    if (date) {
        top.createEl("span", { text: date }).style.cssText = "font-size:0.78em;color:var(--text-faint);";
    }

    // Title
    const titleEl = card.createEl("a", {
        text: post.title || post.file.name,
        cls: "internal-link",
        attr: { "data-href": post.file.path, href: post.file.path }
    });
    titleEl.style.cssText = "font-size:1.15em;font-weight:700;color:var(--text-normal);text-decoration:none;display:block;margin-bottom:6px;";

    // Summary
    if (post.summary) {
        const sum = card.createEl("p", { text: post.summary });
        sum.style.cssText = "color:var(--text-muted);font-size:0.88em;margin:0 0 10px 0;line-height:1.5;font-style:italic;";
    }

    // Related words as small chips
    if (post.relatedWords && post.relatedWords.length > 0) {
        const chipRow = card.createEl("div");
        chipRow.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;";
        for (const rw of post.relatedWords) {
            let wordName = rw.path ? rw.path.split("/").pop() : String(rw).replace(/[\[\]]/g, "");
            wordName = wordName.replace(/\.md$/i, "");
            const chip = chipRow.createEl("a", {
                text: wordName,
                cls: "internal-link",
                attr: { "data-href": wordName, href: wordName }
            });
            chip.style.cssText = `display:inline-block;padding:2px 10px;border-radius:12px;font-size:0.75em;background:${catColor}15;color:${catColor};border:1px solid ${catColor}25;text-decoration:none;`;
        }
    }

    // Clickable whole card
    card.onclick = (e) => {
        if (e.target.tagName !== 'A') {
            const link = card.querySelector('a.internal-link');
            if (link) link.click();
        }
    };

    // Hover uses category color
    card.onmouseenter = () => { card.style.borderColor = catColor; card.style.transform = "translateY(-2px)"; card.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)"; };
    card.onmouseleave = () => { card.style.borderColor = "var(--background-modifier-border)"; card.style.borderLeftColor = catColor; card.style.transform = "none"; card.style.boxShadow = "none"; };
}

if (posts.length === 0) {
    root.createEl("p", { text: "No vocabulary insights yet." }).style.color = "var(--text-muted)";
}
```

---
## 📋 Exercises

```dataviewjs
await dv.view("Views/exercise-sets", {
    folder: "Exercises",
    // Optional: a line in your own words per set (folder name: text).
    // A set without one shows the intro sentence from its own .tex file.
    about: {
        "vocabulary-practice-1": "The first review: every word learned up to then, from Dragon Ball Z, F1 and Peaky Blinders.",
        "vocabulary-practice-2": "The 16 new Dragon Ball Z words that came after Set 1, with exercises going from easy to hard.",
        "vocabulary-practice-3": "The 40 Dragon Ball Z words added after Set 2, plus 5 words from Sets 1–2 brought back for spaced repetition.",
        "vocabulary-practice-4": "A comeback review after seven months away: the words worth keeping from the whole vault (meanings, forgotten senses, phrasal verbs, idioms, register and British English), in three sessions."
    }
});
```

---
## 📚 Resources

```dataviewjs
const root = dv.container;
root.innerHTML = "";

const resources = [
    { icon: "\uD83D\uDCDD", title: "Vocabulary To-Do List", desc: "Track words you want to learn next", path: "Resources/Vocabulary To-Do List" },
    { icon: "\uD83E\uDD16", title: "Vocabulary Learning Prompt", desc: "AI prompt for deep vocabulary exploration", path: "Resources/Vocabulary Learning Prompt" }
];

const grid = root.createEl("div", { cls: "vocab-resource-grid" });
for (const r of resources) {
    const card = grid.createEl("div", { cls: "vocab-resource-card" });
    card.createEl("div", { text: r.icon, cls: "resource-icon" });
    card.createEl("div", { text: r.title, cls: "resource-title" });
    card.createEl("div", { text: r.desc, cls: "resource-desc" });
    card.onclick = () => app.workspace.openLinkText(r.path, "");
}
```

---
> [!quote] Philosophy
> Traditional vocabulary learning feels disconnected from real language. But when you learn words from content you genuinely enjoy, context becomes memorable, emotional connections stick, and you see natural usage — not just dictionary definitions.