---
type: homepage
tags:
  - dashboard
cssclasses:
  - wide
---

# IELTS Prep

**Target score:** 6.5 - 7.0 (Academic)
**Purpose:** International bachelor program applications
**Current score:** ⏳ Awaiting results (Attempt #1)

---

## Score Progression

```chart
type: line
labels: [Attempt 1]
series:
  - title: Overall
    data: [null]
  - title: Listening
    data: [null]
  - title: Reading
    data: [null]
  - title: Writing
    data: [null]
  - title: Speaking
    data: [null]
tension: 0.2
width: 90%
labelColors: true
fill: false
beginAtZero: false
spanGaps: true
yMin: 0
yMax: 9
```

> Update: add new attempt labels and band scores to the arrays above after each official test.

---

## Skill Breakdown — Latest Attempt

```advanced-chart
{
  "type": "bar",
  "data": {
    "labels": ["Listening", "Reading", "Writing", "Speaking"],
    "datasets": [{
      "label": "Attempt 1 (Band Score)",
      "data": [0, 0, 0, 0],
      "backgroundColor": ["rgba(255,182,193,0.55)", "rgba(173,216,230,0.55)", "rgba(255,228,181,0.55)", "rgba(178,223,219,0.55)"],
      "borderColor": ["rgba(255,150,170,1)", "rgba(130,190,220,1)", "rgba(240,200,140,1)", "rgba(130,200,195,1)"],
      "borderWidth": 1
    }]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "legend": {
        "labels": { "color": "rgba(0,0,0,0.7)", "font": { "size": 11 } }
      }
    },
    "scales": {
      "y": {
        "beginAtZero": true,
        "max": 9,
        "grid": { "color": "rgba(0,0,0,0.08)" },
        "ticks": { "color": "rgba(0,0,0,0.5)", "stepSize": 0.5 }
      },
      "x": {
        "grid": { "display": false },
        "ticks": { "color": "rgba(0,0,0,0.5)" }
      }
    }
  }
}
```

---

## Skill Radar

```dataviewjs
const tests = dv.pages('"Scores"')
    .where(p => p.type === "score-entry")
    .sort(p => p.date, 'asc');

if (tests.length > 0) {
    const skills = ['Listening', 'Reading', 'Writing', 'Speaking'];
    const keys = ['listening', 'reading', 'writing', 'speaking'];

    const latest = tests.last();
    const prev = tests.length > 1 ? tests[tests.length - 2] : null;

    const datasets = [];

    if (prev) {
        datasets.push({
            label: prev.test + ' (Band)',
            data: keys.map(k => prev[k] || 0),
            borderColor: 'rgba(0, 0, 0, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            pointBackgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderWidth: 1,
            pointRadius: 3
        });
    }

    datasets.push({
        label: latest.test + ' (Band)',
        data: keys.map(k => latest[k] || 0),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.15)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointRadius: 5
    });

    const chartData = {
        type: 'radar',
        data: {
            labels: skills,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: 'rgba(0, 0, 0, 0.7)', font: { size: 11 } }
                }
            },
            scales: {
                r: {
                    min: 0, max: 9,
                    ticks: { display: false, stepSize: 1 },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: { color: 'rgba(0, 0, 0, 0.7)', font: { size: 12 } },
                    angleLines: { color: 'rgba(0, 0, 0, 0.1)' }
                }
            }
        }
    };

    window.renderChart(chartData, this.container);
} else {
    dv.paragraph("*No test scores recorded yet.*");
}
```

---

## Feedback & Analysis

*Updated after each official attempt.*

---

## Study Notes

### Listening (4 sections — 40 questions — 30 min)
- *Notes will be added here as you study*

### Speaking (3 parts — 11-14 min)
- *Notes will be added here as you study*

### Academic
#### Reading (3 passages — 40 questions — 60 min)
- *Notes will be added here as you study*

#### Writing (2 tasks — 60 min)
- *Notes will be added here as you study*

### General Training
#### Reading (3 sections — 40 questions — 60 min)
- *Notes will be added here as you study*

#### Writing (2 tasks — 60 min)
- *Notes will be added here as you study*

---

## Quick Links

| | |
|---|---|
| [[Score Log]] | All official test scores |
| [[Resources]] | Study materials & links |

---

## Resources

*Add links to videos, websites, and practice materials as you study.*
