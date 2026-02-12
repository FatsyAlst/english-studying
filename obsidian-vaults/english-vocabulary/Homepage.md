
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
const words = dv.pages('"Vocabulary"').where(p => p.media);
const counts = {};
for (const w of words) {
    let m = w.media?.path ? w.media.path : String(w.media);
    m = m.split("/").pop().replace(/\.md$/i, "").replace(/[\[\]]/g, "");
    counts[m] = (counts[m] || 0) + 1;
}
const headers = Object.keys(counts).sort();
headers.push("Total");
const values = headers.map(h => h === "Total" ? words.length : counts[h]);
dv.table(headers, [values]);
```

---
## 🔤 Recent Words

```dataviewjs
const words = dv.pages('"Vocabulary"')
    .where(p => p.media)
    .sort(p => p.file.ctime, 'desc')
    .limit(10);

const rows = words.map(w => {
    let mediaName = w.media?.path ? w.media.path : String(w.media);
    mediaName = mediaName.split("/").pop().replace(/\.md$/i, "").replace(/[\[\]]/g, "");
    return [w.file.link, `[[${mediaName}]]`];
});

dv.table(["Word", "Source"], rows);
```

---
## 📝 All Words by Media

### 🐉 Dragon Ball Z
```dataviewjs
const PER_PAGE = 7;
const allWords = dv.pages('"Vocabulary/Dragon Ball Z"')
    .where(p => p.media)
    .sort(p => p.file.name, 'asc');
const total = allWords.length;
const totalPages = Math.ceil(total / PER_PAGE);
let page = 1;

const wrapper = dv.el("div", "");

function render() {
    wrapper.empty();
    const start = (page - 1) * PER_PAGE;
    const words = allWords.slice(start, start + PER_PAGE);

    const table = wrapper.createEl("table", { cls: "dataview table-view-table" });
    const thead = table.createEl("thead");
    const hr = thead.createEl("tr");
    const th = hr.createEl("th");
    th.createEl("span", { text: "Word (" + total + ")", cls: "dataview small-text" });
    const tbody = table.createEl("tbody");
    for (const w of words) {
        const row = tbody.createEl("tr");
        const td = row.createEl("td");
        const a = td.createEl("a", {
            text: w.file.name,
            cls: "internal-link",
            attr: { "data-href": w.file.path, href: w.file.path }
        });
    }

    if (totalPages > 1) {
        const nav = wrapper.createEl("div");
        nav.style.cssText = "display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;";
        const prev = nav.createEl("button", { text: "← Prev" });
        prev.style.cssText = "padding:4px 12px;cursor:pointer;border:1px solid var(--background-modifier-border);background:var(--background-secondary);border-radius:4px;color:var(--text-normal);";
        if (page <= 1) prev.disabled = true;
        prev.onclick = () => { page--; render(); };
        nav.createEl("span", { text: "Page " + page + " of " + totalPages }).style.cssText = "font-size:0.85em;color:var(--text-muted);min-width:90px;text-align:center;";
        const next = nav.createEl("button", { text: "Next →" });
        next.style.cssText = "padding:4px 12px;cursor:pointer;border:1px solid var(--background-modifier-border);background:var(--background-secondary);border-radius:4px;color:var(--text-normal);";
        if (page >= totalPages) next.disabled = true;
        next.onclick = () => { page++; render(); };
    }
}
render();
```

### 🏎️ F1
```dataviewjs
const PER_PAGE = 7;
const allWords = dv.pages('"Vocabulary/F1"')
    .where(p => p.media)
    .sort(p => p.file.name, 'asc');
const total = allWords.length;
const totalPages = Math.ceil(total / PER_PAGE);
let page = 1;

const wrapper = dv.el("div", "");

function render() {
    wrapper.empty();
    const start = (page - 1) * PER_PAGE;
    const words = allWords.slice(start, start + PER_PAGE);

    const table = wrapper.createEl("table", { cls: "dataview table-view-table" });
    const thead = table.createEl("thead");
    const hr = thead.createEl("tr");
    const th = hr.createEl("th");
    th.createEl("span", { text: "Word (" + total + ")", cls: "dataview small-text" });
    const tbody = table.createEl("tbody");
    for (const w of words) {
        const row = tbody.createEl("tr");
        const td = row.createEl("td");
        const a = td.createEl("a", {
            text: w.file.name,
            cls: "internal-link",
            attr: { "data-href": w.file.path, href: w.file.path }
        });
    }

    if (totalPages > 1) {
        const nav = wrapper.createEl("div");
        nav.style.cssText = "display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;";
        const prev = nav.createEl("button", { text: "← Prev" });
        prev.style.cssText = "padding:4px 12px;cursor:pointer;border:1px solid var(--background-modifier-border);background:var(--background-secondary);border-radius:4px;color:var(--text-normal);";
        if (page <= 1) prev.disabled = true;
        prev.onclick = () => { page--; render(); };
        nav.createEl("span", { text: "Page " + page + " of " + totalPages }).style.cssText = "font-size:0.85em;color:var(--text-muted);min-width:90px;text-align:center;";
        const next = nav.createEl("button", { text: "Next →" });
        next.style.cssText = "padding:4px 12px;cursor:pointer;border:1px solid var(--background-modifier-border);background:var(--background-secondary);border-radius:4px;color:var(--text-normal);";
        if (page >= totalPages) next.disabled = true;
        next.onclick = () => { page++; render(); };
    }
}
render();
```

### 📗 Jujutsu Kaisen Modulo
```dataviewjs
const PER_PAGE = 7;
const allWords = dv.pages('"Vocabulary/Jujutsu Kaisen Modulo"')
    .where(p => p.media)
    .sort(p => p.file.name, 'asc');
const total = allWords.length;
const totalPages = Math.ceil(total / PER_PAGE);
let page = 1;

const wrapper = dv.el("div", "");

function render() {
    wrapper.empty();
    const start = (page - 1) * PER_PAGE;
    const words = allWords.slice(start, start + PER_PAGE);

    const table = wrapper.createEl("table", { cls: "dataview table-view-table" });
    const thead = table.createEl("thead");
    const hr = thead.createEl("tr");
    const th = hr.createEl("th");
    th.createEl("span", { text: "Word (" + total + ")", cls: "dataview small-text" });
    const tbody = table.createEl("tbody");
    for (const w of words) {
        const row = tbody.createEl("tr");
        const td = row.createEl("td");
        const a = td.createEl("a", {
            text: w.file.name,
            cls: "internal-link",
            attr: { "data-href": w.file.path, href: w.file.path }
        });
    }

    if (totalPages > 1) {
        const nav = wrapper.createEl("div");
        nav.style.cssText = "display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;";
        const prev = nav.createEl("button", { text: "← Prev" });
        prev.style.cssText = "padding:4px 12px;cursor:pointer;border:1px solid var(--background-modifier-border);background:var(--background-secondary);border-radius:4px;color:var(--text-normal);";
        if (page <= 1) prev.disabled = true;
        prev.onclick = () => { page--; render(); };
        nav.createEl("span", { text: "Page " + page + " of " + totalPages }).style.cssText = "font-size:0.85em;color:var(--text-muted);min-width:90px;text-align:center;";
        const next = nav.createEl("button", { text: "Next →" });
        next.style.cssText = "padding:4px 12px;cursor:pointer;border:1px solid var(--background-modifier-border);background:var(--background-secondary);border-radius:4px;color:var(--text-normal);";
        if (page >= totalPages) next.disabled = true;
        next.onclick = () => { page++; render(); };
    }
}
render();
```

### 🎩 Peaky Blinders
```dataviewjs
const PER_PAGE = 7;
const allWords = dv.pages('"Vocabulary/Peaky Blinders"')
    .where(p => p.media)
    .sort(p => p.file.name, 'asc');
const total = allWords.length;
const totalPages = Math.ceil(total / PER_PAGE);
let page = 1;

const wrapper = dv.el("div", "");

function render() {
    wrapper.empty();
    const start = (page - 1) * PER_PAGE;
    const words = allWords.slice(start, start + PER_PAGE);

    const table = wrapper.createEl("table", { cls: "dataview table-view-table" });
    const thead = table.createEl("thead");
    const hr = thead.createEl("tr");
    const th = hr.createEl("th");
    th.createEl("span", { text: "Word (" + total + ")", cls: "dataview small-text" });
    const tbody = table.createEl("tbody");
    for (const w of words) {
        const row = tbody.createEl("tr");
        const td = row.createEl("td");
        const a = td.createEl("a", {
            text: w.file.name,
            cls: "internal-link",
            attr: { "data-href": w.file.path, href: w.file.path }
        });
    }

    if (totalPages > 1) {
        const nav = wrapper.createEl("div");
        nav.style.cssText = "display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;";
        const prev = nav.createEl("button", { text: "← Prev" });
        prev.style.cssText = "padding:4px 12px;cursor:pointer;border:1px solid var(--background-modifier-border);background:var(--background-secondary);border-radius:4px;color:var(--text-normal);";
        if (page <= 1) prev.disabled = true;
        prev.onclick = () => { page--; render(); };
        nav.createEl("span", { text: "Page " + page + " of " + totalPages }).style.cssText = "font-size:0.85em;color:var(--text-muted);min-width:90px;text-align:center;";
        const next = nav.createEl("button", { text: "Next →" });
        next.style.cssText = "padding:4px 12px;cursor:pointer;border:1px solid var(--background-modifier-border);background:var(--background-secondary);border-radius:4px;color:var(--text-normal);";
        if (page >= totalPages) next.disabled = true;
        next.onclick = () => { page++; render(); };
    }
}
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

| Practice Set | Exercises                      | Answer Sheet                 |
| :----------- | :----------------------------- | :--------------------------- |
| **Set 1**    | [[vocabulary-exercises-1.pdf]] | [[vocabulary-answers-1.pdf]] |
| **Set 2**    | [[vocabulary-exercises-2.pdf]] | [[vocabulary-answers-2.pdf]] |
| **Set 3**    | [[vocabulary-exercises-3.pdf]] | [[vocabulary-answers-3.pdf]] |

---
## 📚 Resources

- 📝 [[Vocabulary To-Do List]] — Track words you want to learn next
- 🤖 [[Vocabulary Learning Prompt]] — AI prompt for deep vocabulary exploration

---
> [!quote] Philosophy
> Traditional vocabulary learning feels disconnected from real language. But when you learn words from content you genuinely enjoy, context becomes memorable, emotional connections stick, and you see natural usage — not just dictionary definitions.