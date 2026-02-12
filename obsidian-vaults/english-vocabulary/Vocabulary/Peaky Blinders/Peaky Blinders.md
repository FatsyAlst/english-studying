---
cssclasses:
  - peaky-blinders
tags:
  - media
  - peaky-blinders
category: series
cover: "media/covers/peaky-blinders-cover.jpg"
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
const dateCounts = {};
for (const w of words) {
    const d = w.created?.toString().substring(0, 10) || "unknown";
    dateCounts[d] = (dateCounts[d] || 0) + 1;
}

const sortedDates = Object.keys(dateCounts).sort();
const dailyCounts = sortedDates.map(d => dateCounts[d]);
let cumulative = 0;
const cumulativeCounts = sortedDates.map(d => {
    cumulative += dateCounts[d];
    return cumulative;
});

const labels = sortedDates.map(d => {
    const parts = d.split("-");
    return `${parts[2]}/${parts[1]}`;
});

if (totalWords > 0) {
    const chartData = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Words',
                    data: cumulativeCounts,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Words Added',
                    data: dailyCounts,
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    backgroundColor: 'rgba(99, 102, 241, 0.25)',
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
}

// ─── Recent Words ───
dv.header(4, "🕐 Recently Added");
if (totalWords > 0) {
    dv.table(
        ["Word", "Date"],
        words.slice(0, 5).map(w => [w.file.link, w.created])
    );
} else {
    dv.paragraph("*No words added yet.*");
}

// ─── All Words ───
dv.header(4, "📖 All Words");
if (totalWords > 0) {
    dv.table(
        ["Word", "Date"],
        words.sort(p => p.file.name, 'asc').map(w => [w.file.link, w.created])
    );
} else {
    dv.paragraph("*Start adding vocabulary words from this media!*");
}
```
