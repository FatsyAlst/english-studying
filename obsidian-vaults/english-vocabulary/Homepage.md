
# 📚 English Vocabulary Tracker

> *Learn English vocabulary through the media you love.*

---

## 🎬 Media Sources

```dataviewjs
const media = dv.pages('"Vocabulary"')
    .where(p => p.tags && p.tags.includes("media") && p.category)
    .sort(p => p.file.name, 'asc');

// Clear any default content and set grid on the dataview container itself
const root = dv.container;
root.innerHTML = "";
root.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;padding:8px 0;";

for (const m of media) {
    const folder = m.file.folder;
    const wordCount = dv.pages(`"${folder}"`)
        .where(p => p.media).length;

    const card = document.createElement("div");
    card.className = "media-card";
    const mediaColors = {
        "Dragon Ball Z": "#f97316", "F1": "#ef4444",
        "Peaky Blinders": "#6366f1", "Jujutsu Kaisen Modulo": "#22c55e"
    };
    const mediaColor = mediaColors[m.file.name] || "#e09f3e";
    card.style.cssText = `display:flex;flex-direction:column;border-radius:8px;overflow:hidden;border:1px solid var(--background-modifier-border);background:var(--background-secondary);text-decoration:none;transition:all 0.2s ease;cursor:pointer;--card-accent:${mediaColor};`;
    
    card.addEventListener("mouseenter", () => { card.style.borderColor = mediaColor; card.style.transform = "translateY(-3px)"; card.style.boxShadow = `0 8px 24px rgba(0,0,0,0.2)`; });
    card.addEventListener("mouseleave", () => { card.style.borderColor = "var(--background-modifier-border)"; card.style.transform = "none"; card.style.boxShadow = "none"; });
    
    // Navigate on click
    card.addEventListener("click", () => {
        app.workspace.openLinkText(m.file.path, "");
    });

    // Cover image
    const imgWrap = document.createElement("div");
    imgWrap.style.cssText = "width:100%;aspect-ratio:2/3;background:var(--background-secondary-alt);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;";

    if (m.cover && m.cover !== "") {
        const img = document.createElement("img");
        img.src = app.vault.adapter.getResourcePath(m.cover);
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        imgWrap.appendChild(img);
    } else {
        const placeholder = document.createElement("div");
        placeholder.style.cssText = "font-size:3em;opacity:0.3;";
        const icons = { anime: "🐉", movie: "🎬", series: "📺", manga: "📖" };
        placeholder.textContent = icons[m.category] || "📚";
        imgWrap.appendChild(placeholder);
    }

    // Category badge
    const catColors = {
        anime: "#f59e0b", manga: "#a855f7", movie: "#ef4444",
        series: "#3b82f6", book: "#22c55e"
    };
    const badgeColor = catColors[m.category] || "#e09f3e";
    const badge = document.createElement("span");
    badge.textContent = (m.category || "media").toUpperCase();
    badge.style.cssText = `position:absolute;top:8px;right:8px;background:${badgeColor};color:#fff;font-size:0.65em;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.05em;`;
    imgWrap.appendChild(badge);

    card.appendChild(imgWrap);

    // Info area
    const info = document.createElement("div");
    info.style.cssText = "padding:10px 12px;";

    const title = document.createElement("div");
    title.textContent = m.file.name;
    title.style.cssText = "font-weight:600;font-size:0.95em;color:var(--text-normal);margin-bottom:4px;";
    info.appendChild(title);

    const count = document.createElement("div");
    count.textContent = wordCount + (wordCount === 1 ? " word" : " words");
    count.style.cssText = "font-size:0.8em;color:var(--text-muted);";
    info.appendChild(count);

    card.appendChild(info);
    root.appendChild(card);
}
```

---
## 📊 Statistics

```dataviewjs
const root = dv.container;
root.innerHTML = "";

const allWords = dv.pages('"Vocabulary"').where(p => p.media);
const media = dv.pages('"Vocabulary"')
    .where(p => p.tags && p.tags.includes("media") && p.category)
    .sort(p => p.file.name, 'asc');

const mediaColors = {
    "Dragon Ball Z": "#f97316", "Dragon Ball": "#eab308", "F1": "#ef4444",
    "Peaky Blinders": "#6366f1", "Jujutsu Kaisen Modulo": "#22c55e"
};
const catIcons = { anime: "\uD83D\uDC32", manga: "\uD83D\uDCD6", movie: "\uD83C\uDFAC", series: "\uD83D\uDCFA", book: "\uD83D\uDCDA" };

// Hero card
const hero = root.createEl("div", { cls: "vocab-stat-hero" });
hero.createEl("div", { text: String(allWords.length), cls: "stat-number" });
hero.createEl("div", { text: "Words Learned", cls: "stat-label" });

// Media mini-cards grid
const grid = root.createEl("div", { cls: "vocab-stat-grid" });
for (const m of media) {
    const folder = m.file.folder;
    const count = dv.pages(`"${folder}"`).where(p => p.media).length;
    const color = mediaColors[m.file.name] || "#e09f3e";
    const icon = catIcons[m.category] || "\uD83D\uDCDA";

    const card = grid.createEl("div", { cls: "vocab-stat-card" });
    card.style.borderLeft = `3px solid ${color}`;
    card.createEl("div", { text: icon, cls: "stat-icon" });
    card.createEl("div", { text: String(count), cls: "stat-number" });
    card.style.setProperty("--stat-color", color);
    card.querySelector(".stat-number").style.color = color;
    card.createEl("div", { text: m.file.name, cls: "stat-label" });
    card.onclick = () => app.workspace.openLinkText(m.file.path, "");
}
```

---
## 🔤 Recent Words

```dataviewjs
const root = dv.container;
root.innerHTML = "";

const mediaTags = ["dragon-ball-z", "dragon-ball", "f1", "peaky-blinders", "jujutsu-kaisen", "media"];
const tagColors = {
    emotion: "#c084fc", emotions: "#c084fc", action: "#f87171", combat: "#f87171",
    slang: "#fb923c", informal: "#fb923c", formal: "#60a5fa", nature: "#4ade80",
    food: "#facc15", body: "#f472b6", idiom: "#a78bfa", "phrasal-verb": "#38bdf8"
};
const defaultTagColor = "rgba(var(--vocab-accent-rgb), 0.7)";

const words = dv.pages('"Vocabulary"')
    .where(p => p.media)
    .sort(p => p.file.ctime, 'desc')
    .limit(10);

const table = root.createEl("table", { cls: "dataview table-view-table" });
const thead = table.createEl("thead");
const hr = thead.createEl("tr");
hr.createEl("th", { text: "Word" });
hr.createEl("th", { text: "Source" });
hr.createEl("th", { text: "Tags" });

const tbody = table.createEl("tbody");
for (const w of words) {
    let mediaName = w.media?.path ? w.media.path : String(w.media);
    mediaName = mediaName.split("/").pop().replace(/\.md$/i, "").replace(/[\[\]]/g, "");

    const row = tbody.createEl("tr");

    // Word link
    const tdWord = row.createEl("td");
    tdWord.createEl("a", {
        text: w.file.name, cls: "internal-link",
        attr: { "data-href": w.file.path, href: w.file.path }
    });

    // Source link
    const tdSource = row.createEl("td");
    const mediaPath = `Vocabulary/${mediaName}/${mediaName}`;
    tdSource.createEl("a", {
        text: mediaName, cls: "internal-link",
        attr: { "data-href": mediaPath, href: mediaPath }
    });

    // Tags as pills
    const tdTags = row.createEl("td");
    const tags = (w.tags || []).filter(t => !mediaTags.includes(t));
    for (const t of tags.slice(0, 3)) {
        const pill = tdTags.createEl("span", { text: t, cls: "vocab-tag-pill" });
        const c = tagColors[t] || defaultTagColor;
        pill.style.cssText = `background:${c}20;color:${c};border-color:${c}30;`;
    }
}
```

---
## 📝 All Words

```dataviewjs
const root = dv.container;
root.innerHTML = "";

const allWords = dv.pages('"Vocabulary"')
    .where(p => p.media)
    .sort(p => p.file.name, 'asc');

// Group by first letter
const groups = {};
for (const w of allWords) {
    const letter = w.file.name[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(w);
}
const letters = Object.keys(groups).sort();
let activeFilter = null;
let searchTerm = "";

// Search input
const search = root.createEl("input", {
    type: "text",
    placeholder: `Search ${allWords.length} words...`,
    cls: "vocab-search"
});

// Letter bar
const bar = root.createEl("div", { cls: "vocab-letter-bar" });
const showAllBtn = bar.createEl("button", { text: "All", cls: "vocab-letter-btn show-all active" });
const letterBtns = {};
for (const L of letters) {
    const btn = bar.createEl("button", { text: L, cls: "vocab-letter-btn" });
    letterBtns[L] = btn;
}

// Sections container
const sections = root.createEl("div");

function render() {
    sections.innerHTML = "";
    const term = searchTerm.toLowerCase();

    for (const L of letters) {
        if (activeFilter && activeFilter !== L) continue;

        const filtered = groups[L].filter(w =>
            term === "" || w.file.name.toLowerCase().includes(term)
        );
        if (filtered.length === 0) continue;

        const header = sections.createEl("div", { cls: "vocab-letter-header" });
        header.createEl("span", { text: L });
        header.createEl("span", { text: `${filtered.length} word${filtered.length !== 1 ? "s" : ""}`, cls: "letter-count" });

        const grid = sections.createEl("div", { cls: "vocab-word-grid" });
        for (const w of filtered) {
            const chip = grid.createEl("a", {
                text: w.file.name,
                cls: "vocab-word-chip internal-link",
                attr: { "data-href": w.file.path, href: w.file.path }
            });
        }
    }

    if (sections.childElementCount === 0) {
        sections.createEl("p", { text: "No words match your search." }).style.cssText = "color:var(--text-muted);text-align:center;padding:20px;";
    }
}

// Events
showAllBtn.onclick = () => {
    activeFilter = null;
    showAllBtn.classList.add("active");
    Object.values(letterBtns).forEach(b => b.classList.remove("active"));
    render();
};

for (const L of letters) {
    letterBtns[L].onclick = () => {
        activeFilter = (activeFilter === L) ? null : L;
        showAllBtn.classList.toggle("active", !activeFilter);
        Object.entries(letterBtns).forEach(([k, b]) => b.classList.toggle("active", k === activeFilter));
        render();
    };
}

search.addEventListener("input", () => { searchTerm = search.value; render(); });

render();
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
## 📋 Practice Sets

```dataviewjs
const root = dv.container;
root.innerHTML = "";

const sets = [
    { num: 1, exercises: "vocabulary-exercises-1.pdf", answers: "vocabulary-answers-1.pdf" },
    { num: 2, exercises: "vocabulary-exercises-2.pdf", answers: "vocabulary-answers-2.pdf" },
    { num: 3, exercises: "vocabulary-exercises-3.pdf", answers: "vocabulary-answers-3.pdf" }
];

const grid = root.createEl("div", { cls: "vocab-practice-grid" });
for (const s of sets) {
    const card = grid.createEl("div", { cls: "vocab-practice-card" });
    card.createEl("div", { text: `Set ${s.num}`, cls: "card-title" });
    const links = card.createEl("div", { cls: "card-links" });
    const ex = links.createEl("a", {
        text: "Exercises", cls: "card-link internal-link",
        attr: { "data-href": s.exercises, href: s.exercises }
    });
    const ans = links.createEl("a", {
        text: "Answers", cls: "card-link internal-link",
        attr: { "data-href": s.answers, href: s.answers }
    });
}
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