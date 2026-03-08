---
cssclasses:
  - dragon-ball
tags:
  - media
  - dragon-ball
category: anime
cover: media/covers/dragon-ball-cover.jpg
banner: media/banners/db.jpg
pixel-banner-flag-color: red-fade-light
---

```dataviewjs
const ACCENT = "234, 179, 8";  // Media accent color (RGB)

const folder = dv.current().file.folder;
const words = dv.pages(`"${folder}"`)
    .where(p => p.media)
    .sort(p => p.created, 'desc');

const totalWords = words.length;

// ─── Dashboard Strip ───
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
const thisMonthCount = words.filter(w => w.created?.toString().substring(0,7) === currentMonth).length;
const latest = words.length > 0 ? words[0] : null;

const strip = dv.el("div", "", { cls: "vocab-dash-strip" });

const b1 = strip.createEl("div", { cls: "vocab-dash-badge" });
b1.createEl("div", { text: String(totalWords), cls: "badge-number" });
b1.createEl("div", { text: "words learned", cls: "badge-label" });

const b2 = strip.createEl("div", { cls: "vocab-dash-badge" });
b2.createEl("div", { text: String(thisMonthCount), cls: "badge-number" });
b2.createEl("div", { text: "this month", cls: "badge-label" });

const b3 = strip.createEl("div", { cls: "vocab-dash-badge" });
if (latest) {
    const link = b3.createEl("a", {
        text: latest.file.name, cls: "internal-link badge-number",
        attr: { "data-href": latest.file.path, href: latest.file.path }
    });
    link.style.cssText = "font-size:1em;font-weight:600;display:block;";
} else {
    b3.createEl("div", { text: "—", cls: "badge-number" });
}
b3.createEl("div", { text: "latest word", cls: "badge-label" });

// ─── Learning Progress Chart ───
if (totalWords > 0) {
    const dateCounts = {};
    for (const w of words) {
        const d = w.created?.toString().substring(0, 10) || "unknown";
        dateCounts[d] = (dateCounts[d] || 0) + 1;
    }

    let sortedKeys = Object.keys(dateCounts).sort();
    let chartLabels, chartCumulative, chartDaily;

    // Weekly aggregation if too many data points
    if (sortedKeys.length > 25) {
        const weekBuckets = {};
        for (const d of sortedKeys) {
            const dt = new Date(d);
            const wk = `${dt.getFullYear()}-W${String(Math.ceil((dt.getDate() + new Date(dt.getFullYear(),dt.getMonth(),1).getDay()) / 7)).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}`;
            weekBuckets[d.substring(0,7) + "-W" + String(Math.ceil(dt.getDate()/7))] =
                (weekBuckets[d.substring(0,7) + "-W" + String(Math.ceil(dt.getDate()/7))] || 0) + dateCounts[d];
        }
        const wKeys = Object.keys(weekBuckets).sort();
        chartLabels = wKeys.map(k => k.replace(/^\d{4}-/, ""));
        chartDaily = wKeys.map(k => weekBuckets[k]);
        let cum = 0;
        chartCumulative = chartDaily.map(v => { cum += v; return cum; });
    } else {
        chartLabels = sortedKeys.map(d => { const p = d.split("-"); return `${p[2]}/${p[1]}`; });
        chartDaily = sortedKeys.map(d => dateCounts[d]);
        let cum = 0;
        chartCumulative = sortedKeys.map(d => { cum += dateCounts[d]; return cum; });
    }

    const chartData = {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Total Words',
                    data: chartCumulative,
                    borderColor: `rgba(${ACCENT}, 1)`,
                    backgroundColor: `rgba(${ACCENT}, 0.15)`,
                    fill: true, tension: 0.3,
                    pointRadius: sortedKeys.length > 25 ? 3 : 5,
                    pointBackgroundColor: `rgba(${ACCENT}, 1)`,
                    borderWidth: 2
                },
                {
                    label: 'Words Added',
                    data: chartDaily,
                    borderColor: `rgba(${ACCENT}, 0.5)`,
                    backgroundColor: `rgba(${ACCENT}, 0.25)`,
                    type: 'bar', borderWidth: 1, borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } } } },
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
            }
        }
    };
    window.renderChart(chartData, this.container);
}

// ─── Recently Added ───
dv.header(4, "\uD83D\uDD50 Recently Added");
if (totalWords > 0) {
    dv.table(["Word", "Date"], words.slice(0, 5).map(w => [w.file.link, w.created]));
} else {
    dv.paragraph("*No words added yet.*");
}

// ─── All Words — Alphabetical Grid ───
dv.header(4, "\uD83D\uDCD6 All Words");

if (totalWords > 0) {
    const sorted = [...words].sort((a, b) => a.file.name.localeCompare(b.file.name));
    const groups = {};
    for (const w of sorted) {
        const L = w.file.name[0].toUpperCase();
        if (!groups[L]) groups[L] = [];
        groups[L].push(w);
    }
    const letters = Object.keys(groups).sort();
    let activeFilter = null;
    let searchTerm = "";

    const search = dv.el("input", "", {
        attr: { type: "text", placeholder: `Search ${totalWords} words...` },
        cls: "vocab-search"
    });

    const bar = dv.el("div", "", { cls: "vocab-letter-bar" });
    const showAllBtn = bar.createEl("button", { text: "All", cls: "vocab-letter-btn show-all active" });
    const letterBtns = {};
    for (const L of letters) {
        letterBtns[L] = bar.createEl("button", { text: L, cls: "vocab-letter-btn" });
    }

    const sections = dv.el("div", "");

    function render() {
        sections.innerHTML = "";
        const term = searchTerm.toLowerCase();
        for (const L of letters) {
            if (activeFilter && activeFilter !== L) continue;
            const filtered = groups[L].filter(w => term === "" || w.file.name.toLowerCase().includes(term));
            if (filtered.length === 0) continue;
            const header = sections.createEl("div", { cls: "vocab-letter-header" });
            header.createEl("span", { text: L });
            header.createEl("span", { text: `${filtered.length}`, cls: "letter-count" });
            const grid = sections.createEl("div", { cls: "vocab-word-grid" });
            for (const w of filtered) {
                grid.createEl("a", {
                    text: w.file.name, cls: "vocab-word-chip internal-link",
                    attr: { "data-href": w.file.path, href: w.file.path }
                });
            }
        }
        if (sections.childElementCount === 0) {
            sections.createEl("p", { text: "No words match your search." }).style.cssText = "color:var(--text-muted);text-align:center;padding:20px;";
        }
    }

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
} else {
    dv.paragraph("*Start adding vocabulary words from this media!*");
}
```
