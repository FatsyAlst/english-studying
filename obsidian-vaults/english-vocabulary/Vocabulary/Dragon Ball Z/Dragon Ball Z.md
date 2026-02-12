---
cssclasses:
  - dragon-ball-z
tags:
  - media
  - dragon-ball-z
category: anime
cover: media/covers/dragon-ball-z-cover.jpg
banner: media/banners/dbz.jpg
banner-height: 610
pixel-banner-flag-color: orange
banner-x: 24
banner-y: 23
content-start: 591
---

```dataviewjs
const folder = dv.current().file.folder;
const words = dv.pages(`"${folder}"`)
    .where(p => p.media)
    .sort(p => p.created, 'desc');

const totalWords = words.length;

// ─── Word Count ───
dv.paragraph(`**📊 ${totalWords} words learned**`);

// ─── Learning Progress Chart ───
// Group words by date
const dateCounts = {};
for (const w of words) {
    const d = w.created?.toString().substring(0, 10) || "unknown";
    dateCounts[d] = (dateCounts[d] || 0) + 1;
}

// Sort dates and build cumulative data
const sortedDates = Object.keys(dateCounts).sort();
const dailyCounts = sortedDates.map(d => dateCounts[d]);
let cumulative = 0;
const cumulativeCounts = sortedDates.map(d => {
    cumulative += dateCounts[d];
    return cumulative;
});

// Format labels as shorter dates
const labels = sortedDates.map(d => {
    const parts = d.split("-");
    return `${parts[2]}/${parts[1]}`;
});

const chartData = {
    type: 'line',
    data: {
        labels: labels,
        datasets: [
            {
                label: 'Total Words',
                data: cumulativeCounts,
                borderColor: 'rgba(249, 115, 22, 1)',
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: 'rgba(249, 115, 22, 1)',
                borderWidth: 2
            },
            {
                label: 'Words Added',
                data: dailyCounts,
                borderColor: 'rgba(249, 115, 22, 0.5)',
                backgroundColor: 'rgba(249, 115, 22, 0.25)',
                type: 'bar',
                borderWidth: 1,
                borderRadius: 4
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                labels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 11 } }
            }
        },
        scales: {
            x: {
                ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
                ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                beginAtZero: true
            }
        }
    }
};

window.renderChart(chartData, this.container);

// ─── Recent Words ───
dv.header(4, "🕐 Recently Added");
dv.table(
    ["Word", "Date"],
    words.slice(0, 5).map(w => [w.file.link, w.created])
);

// ─── All Words ───
dv.header(4, "📖 All Words");
dv.table(
    ["Word", "Date"],
    words.sort(p => p.file.name, 'asc').map(w => [w.file.link, w.created])
);
```
