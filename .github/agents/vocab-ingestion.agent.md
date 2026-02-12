---
name: Vocabulary Ingestion
description: Process vocabulary .txt files and integrate them into the Obsidian English Vocabulary vault. Creates vocabulary cards, bootstraps new media sources, enriches existing cards, detects synonyms/duplicates, infers tags, and passively links existing mentions. Self-updates after each run.
argument-hint: "Process [filename.txt]" or "Process these words from [Media Name]: word1, word2, word3"
tools: ['editFiles', 'codebase', 'fetch', 'findTestFiles', 'githubRepo', 'problems', 'runCommands', 'search', 'terminalLastCommand', 'usages']
---

# Vocabulary Ingestion Agent

> **Purpose:** Process `.txt` vocabulary files and integrate them into the Obsidian English Vocabulary vault.
> **Location:** Vault is at `obsidian-vaults/english-vocabulary/`

---

## 🔧 How to Use

In VS Code Copilot Chat, type:
```
@vocab-ingestion Process "Peaky Blinders.txt"
```
or:
```
@vocab-ingestion Process these words from Dragon Ball Z: grapple, onslaught, resilient
```

The agent will:
1. Parse input (file or inline words)
2. Check/create media setup
3. Create or enrich vocabulary cards
4. Add semantic enhancements (tags, duplicate detection, passive linking)
5. Generate a report
7. Self-update this file if anything changed

---

## 📥 Input Format

The input may be:
- A `.txt` file named after its media source (e.g., `Peaky Blinders.txt`, `Dragon Ball Z.txt`)
- Inline words with a media name specified

The `.txt` files may vary in structure, but typically contain vocabulary words with some or all of:
- Word/phrase name
- Part of speech
- Definition(s) with possible multiple senses
- Example sentences
- Portuguese translation
- Etymology, collocations, usage notes

The agent must be flexible enough to parse different formats — extract what's available and fill in gaps using linguistic knowledge.

---

## 📋 Processing Pipeline

### Step 1: Parse the Input

1. Read the `.txt` file or parse inline words
2. Identify the **media source** from the filename or user instruction (e.g., `Peaky Blinders.txt` → media is "Peaky Blinders")
3. Derive the **tag** by lowercasing and hyphenating (e.g., `peaky-blinders`)
4. Extract all vocabulary entries — each word/phrase with its associated content (definitions, examples, translations, etc.)

### Step 2: Check if Media Exists

Search `obsidian-vaults/english-vocabulary/Vocabulary/` for a folder matching the media name.

**If the media folder does NOT exist**, auto-create the full media setup following this comprehensive checklist:

#### Step-by-Step Media Bootstrapping:

1. **Create folder structure:**
   ```
   obsidian-vaults/english-vocabulary/Vocabulary/{Media Name}/
   ```

2. **Determine category** — Ask the user to choose: `anime`, `manga`, `movie`, `series`, `book`, or other

3. **Choose accent color** — Select a Tailwind color that doesn't conflict with existing media:
   - Already used: Dragon Ball Z (orange `#f97316`), Dragon Ball (yellow `#eab308`), F1 (red `#ef4444`), Peaky Blinders (indigo `#6366f1`), Jujutsu Kaisen (green `#22c55e`)
   - Available: blue (`#3b82f6`), cyan (`#06b6d4`), teal (`#14b8a6`), pink (`#ec4899`), purple (`#a855f7`), amber (`#f59e0b`), etc.
   - Convert hex to RGB values for CSS (e.g., `#3b82f6` → `59,130,246`)
   - Convert hex to decimal RGB for graph.json (e.g., `#3b82f6` → `3901686` — use formula: R×65536 + G×256 + B)

4. **Create media page** at `Vocabulary/{Media Name}/{Media Name}.md`:
   ```markdown
   ---
   cssclasses:
     - {css-class-name}
   tags:
     - media
     - {media-tag}
   category: {anime|manga|movie|series|book}
   cover: media/covers/{media-slug}-cover.jpg
   ---
   
   # {Media Name}
   
   > *Category description — brief sentence about the media*
   
   ---
   ## 📊 Learning Progress
   
   ```dataviewjs
   const words = dv.pages('"Vocabulary/{Media Name}"')
       .where(p => p.media && p.created)
       .sort(p => p.created, 'asc');
   
   const totalWords = words.length;
   
   dv.paragraph(`**Total Words Learned:** ${totalWords}`);
   
   if (totalWords === 0) {
       dv.paragraph("*No words added yet — start building your vocabulary!*");
   } else {
       // Group by date
       const byDate = {};
       for (const w of words) {
           const d = String(w.created);
           byDate[d] = (byDate[d] || 0) + 1;
       }
       const dates = Object.keys(byDate).sort();
       
       // Cumulative + daily counts
       let cumulative = 0;
       const labels = [], cumulativeData = [], dailyData = [];
       for (const d of dates) {
           cumulative += byDate[d];
           const parts = d.split("-");
           labels.push(`${parts[2]}/${parts[1]}`);
           cumulativeData.push(cumulative);
           dailyData.push(byDate[d]);
       }
       
       const chartData = {
           type: 'line',
           data: {
               labels: labels,
               datasets: [
                   {
                       label: 'Cumulative Words',
                       data: cumulativeData,
                       borderColor: 'rgba({r},{g},{b},1)',
                       backgroundColor: 'rgba({r},{g},{b},0.1)',
                       borderWidth: 2,
                       fill: true,
                       tension: 0.3
                   },
                   {
                       label: 'Words per Day',
                       data: dailyData,
                       type: 'bar',
                       backgroundColor: 'rgba({r},{g},{b},0.5)',
                       borderColor: 'rgba({r},{g},{b},1)',
                       borderWidth: 1
                   }
               ]
           }
       };
       
       dv.el("div", "", { cls: "chart", attr: { id: "learning-chart-{slug}" } });
       window.renderChart(chartData, document.getElementById("learning-chart-{slug}"));
   }
   ```
   
   ---
   ## 🆕 Recent Words
   
   ```dataviewjs
   const recent = dv.pages('"Vocabulary/{Media Name}"')
       .where(p => p.media && p.created)
       .sort(p => p.created, 'desc')
       .limit(5);
   
   if (recent.length === 0) {
       dv.paragraph("*No words yet*");
   } else {
       dv.table(["Word", "Added"],
           recent.map(r => [r.file.link, r.created])
       );
   }
   ```
   
   ---
   ## 📚 All Words
   
   ```dataviewjs
   const all = dv.pages('"Vocabulary/{Media Name}"')
       .where(p => p.media)
       .sort(p => p.file.name, 'asc');
   
   if (all.length === 0) {
       dv.paragraph("*No words yet*");
   } else {
       dv.table(["Word"],
           all.map(w => [w.file.link])
       );
   }
   ```
   ```

5. **Add CSS variable** to `.obsidian/snippets/vocabulary-theme.css` in the `:root` block:
   ```css
   --media-{name}: #{hex-color};
   ```

6. **Add CSS accent class** to `.obsidian/snippets/vocabulary-theme.css` (at the end, before closing comment):
   ```css
   /* {Media Name} — {color} accent */
   .{css-class} .markdown-reading-view h1 { color: var(--media-{name}); }
   .{css-class} .markdown-reading-view h2 { border-bottom-color: rgba({r},{g},{b},0.2); }
   .{css-class} .markdown-reading-view th,
   .{css-class} .dataview.table-view-table th { color: var(--media-{name}); background: rgba({r},{g},{b},0.08); }
   .{css-class} .markdown-reading-view hr { border-top-color: rgba({r},{g},{b},0.15); }
   .{css-class} .markdown-reading-view a.internal-link,
   .{css-class} .markdown-reading-view .data-link-text { color: var(--media-{name}); }
   .{css-class} .markdown-reading-view a.internal-link:hover { color: {lighter-shade}; }
   .{css-class} .markdown-reading-view code:not(pre code) { background: rgba({r},{g},{b},0.08); color: var(--media-{name}); }
   .{css-class} .dataview.table-view-table a.internal-link { color: var(--media-{name}); }
   ```

7. **Add tag color rule** to `.obsidian/snippets/vocabulary-theme.css` in the `/* ─── Tags — Per-Media Colors ─── */` section:
   ```css
   a.tag[href*="{tag}"] { background: rgba({r},{g},{b},0.12); color: var(--media-{name}); border-color: rgba({r},{g},{b},0.3); }
   ```

8. **Add graph color group** to `.obsidian/graph.json` in the `colorGroups` array:
   ```json
   {
     "query": "tag:#{tag}",
     "color": {
       "a": 1,
       "rgb": {decimal-rgb-value}
     }
   }
   ```

9. **Add media card** to `Homepage.md` DataviewJS in the `## 🎬 Media Sources` section:
   - The card will auto-generate from the media page's frontmatter
   - Ensure the `category` field is set correctly for icon display
   - Add color mapping in the `mediaColors` object if needed

10. **Add word list section** to `Homepage.md` under `## 📚 All Words by Media`:
    ```markdown
    ### {emoji} {Media Name}
    ```dataviewjs
    const PER_PAGE = 7;
    const allWords = dv.pages('"Vocabulary/{Media Name}"')
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
    ```

11. **Remind user** to manually add:
    - Cover image at `media/covers/{media-slug}-cover.jpg` (aspect ratio 2:3, 400px width recommended)
    - Optional: Banner image using Pexels Banner plugin
    - Color emoji for Homepage section (🔵 🔴 🟢 🟡 🟣 🟠 etc.)

### Step 3: Process Each Word

For each extracted word/phrase:

#### 3a. Check if it already exists in the vault

Search ALL media folders (not just the current one) for a file matching the word name:
- Normalize: lowercase, replace spaces with hyphens
- Check for exact filename match (e.g., `breach.md`, `call-it-quits.md`)

#### 3b. If the word is NEW — Create vocabulary card

Create `Vocabulary/{Media Name}/{word-slug}.md` using this exact format:

```markdown
---
media: "[[{Media Name}]]"
tags:
  - {media-tag}
created: {YYYY-MM-DD}
---
## 📖 Definition
### Sense 1 — *{part of speech}* ({frequency: Most Common / Common / Less Common / Rare})
{Definition text}

> [!example] Examples
> - {Example sentence 1}
> - {Example sentence 2}
> - {Example sentence 3}

{Additional senses if applicable, following the same pattern}

---
## 🌳 Word Family
| Part of Speech | Forms |
|----------------|-------|
| Noun           | {forms or remove row if N/A} |
| Verb           | {forms or remove row if N/A} |
| Adjective      | {forms or remove row if N/A} |
| Adverb         | {forms or remove row if N/A} |

---
## 🔗 Collocations
- {collocation 1}
- {collocation 2}
- {collocation 3}

---
## 📜 Etymology
{Origin and history — keep concise, 1-3 sentences}

---
## 💡 Usage Notes
> [!tip] Notes
> - {Practical usage tip 1}
> - {Practical usage tip 2}
> - {Register/formality notes if relevant}

---
## 🇧🇷 Translation (Portuguese)
**Tradução:** {Portuguese translation(s)}

| English | Portuguese |
|---------|------------|
| {Example sentence} | {Tradução} |
| {Example sentence} | {Tradução} |
```

**Important formatting rules:**
- Use `### Sense N` headers only for multiple meanings; for single-meaning words, just write the definition directly under `## 📖 Definition` with part of speech noted
- The `> [!example]` and `> [!tip]` callouts are Obsidian callout syntax — preserve exactly
- Date format for `created:` is always `YYYY-MM-DD`
- Filename is the word lowercased with spaces/special chars replaced by hyphens: `call it quits` → `call-it-quits.md`
- If the input doesn't provide certain sections (etymology, collocations, etc.), fill them in using your linguistic knowledge
- Only include Word Family rows for parts of speech that actually exist for the word

#### 3c. If the word ALREADY EXISTS — Enrich or cross-reference

1. **Read the existing card** to understand current content depth
2. **Compare** the new content against the existing card section by section:
   - More senses/definitions? → Add the missing senses
   - More/better examples? → Add examples (don't remove existing ones)
   - Missing collocations, etymology, usage notes? → Add them
   - Translation missing or incomplete? → Complete it
3. **DO NOT move the file** — it stays in its original media folder
4. **Add cross-reference** — if the word was seen in a different media, add a note at the end of the Usage Notes callout:
   ```
   > - 📺 Also encountered in [[{New Media Name}]]
   ```
5. **Only modify if genuinely adding value** — if the existing card is already comprehensive and covers the same info, skip it

### Step 4: Semantic Enhancement

After creating/updating each card, perform these intelligent enrichment tasks:

#### 4a. Duplicate Sense Detection

1. **Scan ALL existing vocabulary cards** (across all media) for words that share similar meanings
2. **Compare definitions** — look for:
   - Same word with different senses already covered elsewhere
   - Different words that are near-synonyms covering the same semantic space
3. **If duplicate sense found:**
   - In the new card: Add cross-reference `> - ⚠️ Similar meaning in [[other-word]] (from [[Other Media]])`
   - In the existing card: Add reciprocal note `> - ⚠️ Similar meaning in [[new-word]] (from [[New Media]])`
4. **Still create the card** — duplication across media is valuable for reinforcement, just note the overlap

#### 4b. Automatic Tag Inference

1. **Analyze the word's semantic domain** and add 1-3 thematic tags in addition to the media tag
2. **Possible thematic tags:**
   - `#idiom` — for idiomatic expressions
   - `#phrasal-verb` — for phrasal verbs
   - `#slang` — for informal/slang terms
   - `#formal` — for formal/academic register
   - `#archaic` — for old-fashioned terms
   - `#technical` — for specialized/technical vocabulary
   - `#emotion` — for emotion-related words
   - `#action` — for action or movement words
   - `#description` — for descriptive adjectives/adverbs
   - `#cognate` — if it has a recognizable Portuguese cognate
   - `#false-friend` — if it looks like a Portuguese word but means something different
3. **Add these tags to the frontmatter** in the `tags:` array
4. **Keep it minimal** — only add tags that are genuinely useful for filtering/searching

#### 4c. Passive Linking (Usage Notes Only)

This step does **NOT** add new content. It only wraps existing plain-text mentions in `[[double brackets]]` when the mentioned word has a card in the vault.

**Two directions to check:**

1. **New card → existing vault words:** Read the new card's `> [!tip] Notes` callout. If any word or phrase already written there matches the filename of an existing vocabulary card in the vault, wrap it in `[[brackets]]`.
   - Example: if the note says `Similar to "cunning" but more positive` and `cunning.md` exists → change to `Similar to "[[cunning]]" but more positive`
   - Only link on **first occurrence** in the Notes section
   - Don't link the word to itself
   - Don't link common English words that happen to have cards unless the mention is clearly referencing the vocabulary concept

2. **Existing cards → new word:** Scan ALL existing vocabulary cards' `> [!tip] Notes` callouts. If any existing card already mentions the newly added word in its Usage Notes as plain text, wrap that mention in `[[brackets]]`.
   - Example: if adding "sly" and `shrewd.md` already has the note `Compare with sly (more secretive)` → change to `Compare with [[sly]] (more secretive)`
   - Only link on **first occurrence** per file
   - Be conservative — only link clear, unambiguous references to the vocabulary word

**Key principle:** Never add new lines, sentences, or `🔗 Related:` entries. Only convert already-existing plain-text mentions into `[[links]]`.

### Step 5: Generate Report

After processing all words, output a summary:

```
## 📊 Vocabulary Ingestion Report

**Source:** {filename}
**Media:** [[{Media Name}]]
**Date:** {DD/MM/YYYY}

### Results
- ✅ **Added:** {N} new words
- 🔄 **Enriched:** {N} existing words
- ⏭️ **Skipped:** {N} words (already complete)
- 🏷️ **Tags inferred:** {N} thematic tags
- ⚠️ **Duplicate senses:** {N} overlaps detected
- 🔗 **Passive links:** {N} existing mentions linked

### New Words
| Word | Senses | Tags | Completeness |
|------|--------|------|--------------|
| [[word1]] | 2 | #idiom #emotion | All sections complete |
| [[word2]] | 1 | #formal | Missing etymology |

### Enriched Words
| Word | Original Media | Changes |
|------|---------------|---------|
| [[word1]] | Dragon Ball Z | Added 1 sense, cross-reference to {Media} |
| [[word2]] | F1 | Added collocations |

### Semantic Enhancements
- [[word2]] ⚠️ duplicates sense in [[word4]] (from Peaky Blinders)
- [[word5]] → added #false-friend tag

### Passive Links
| File | Change |
|------|--------|
| [[word1]] | `cunning` → `[[cunning]]` in Usage Notes |
| [[existing-word]] | `word2` → `[[word2]]` in Usage Notes |

{If new media was created, add:}
### 🆕 New Media Setup
Created full vault integration for **{Media Name}**:
- ✅ Folder and media page
- ✅ CSS accent class ({color})
- ✅ Graph color group
- ✅ Homepage section
- ⏳ **Action needed:** Add cover image at `media/covers/{slug}-cover.jpg`
```

---

## 📐 Reference: Existing Vault Structure

### Media Pages Pattern
Each media page at `Vocabulary/{Media}/{Media}.md` has:
- Frontmatter: `cssclasses`, `tags` (includes `media` + media-specific), `category`, `cover`
- Optional: `banner`, `banner-height`, `banner-x`, `banner-y`, `content-start`, `pixel-banner-flag-color`
- DataviewJS block with: word count, learning progress chart (line+bar), recent words table (top 5), all words table
- Chart colors use the media's accent color in `rgba()` format
- Date labels in charts use `dd/mm` format: `` `${parts[2]}/${parts[1]}` ``

### CSS Accent Pattern (in vocabulary-theme.css)
```css
/* {Media Name} — {color} accent */
.{css-class} .markdown-reading-view h1 { color: var(--media-{name}); }
.{css-class} .markdown-reading-view h2 { border-bottom-color: rgba({r},{g},{b},0.2); }
.{css-class} .markdown-reading-view th,
.{css-class} .dataview.table-view-table th { color: var(--media-{name}); background: rgba({r},{g},{b},0.08); }
.{css-class} .markdown-reading-view hr { border-top-color: rgba({r},{g},{b},0.15); }
.{css-class} .markdown-reading-view a.internal-link,
.{css-class} .markdown-reading-view .data-link-text { color: var(--media-{name}); }
.{css-class} .markdown-reading-view a.internal-link:hover { color: {lighter-shade}; }
.{css-class} .markdown-reading-view code:not(pre code) { background: rgba({r},{g},{b},0.08); color: var(--media-{name}); }
.{css-class} .dataview.table-view-table a.internal-link { color: var(--media-{name}); }
```

### Tag Color Pattern (in vocabulary-theme.css)
```css
a.tag[href*="{tag}"] { background: rgba({r},{g},{b},0.12); color: var(--media-{name}); border-color: rgba({r},{g},{b},0.3); }
```

### Graph Color Group Pattern (in graph.json)
```json
{
  "query": "tag:#{tag}",
  "color": {
    "a": 1,
    "rgb": {decimal-rgb-value}
  }
}
```

### Homepage Word List Pattern
Each media has a paginated DataviewJS section under `## 📚 All Words by Media`:
- Header: `### {emoji} {Media Name}`
- DataviewJS queries `dv.pages('"Vocabulary/{Media Name}"')`
- 7 words per page with Prev/Next pagination buttons

### Naming Conventions
| Element | Convention | Example |
|---------|-----------|---------|
| Folder | Title Case with spaces | `Dragon Ball Z` |
| Card filename | lowercase, hyphenated | `call-it-quits.md` |
| Media tag | lowercase, hyphenated | `dragon-ball-z` |
| CSS class | lowercase, hyphenated | `dragon-ball-z` |
| CSS variable | `--media-{name}` | `--media-dragon-ball-z` |
| Media link | `[[Title Case]]` | `[[Dragon Ball Z]]` |

---

## 🔄 Self-Maintenance Protocol

**This agent MUST update this very file** (`.github/agents/vocab-ingestion.agent.md`) whenever it discovers information that would help future runs be more accurate or efficient.

### When to Self-Update:

1. **After creating new media:**
   - Add the media name + color to the "Already used" list in Step 2
   - Document the RGB decimal conversion if it required calculation
   - Add any unique patterns or requirements discovered during setup

2. **When encountering undocumented patterns:**
   - New frontmatter fields being used across cards
   - Different DataviewJS patterns in media pages
   - New CSS patterns or naming conventions
   - Additional thematic tag categories being used

3. **When receiving user corrections:**
   - "Actually, we format dates like this now..."
   - "The category list should include..."
   - "Don't link X words, but do link Y words..."
   - Any explicit feedback about how the agent should behave

4. **When discovering vault dynamics have changed:**
   - Structure changes (new folders, different organization)
   - Homepage layout has evolved
   - New plugins affecting data queries
   - Graph configuration changes

### How to Self-Update:

1. **Read the current version of `.github/agents/vocab-ingestion.agent.md`** to understand existing content
2. **Identify the specific section** that needs updating
3. **Make surgical edits** — don't rewrite the entire file, just update the changed parts
4. **Add a changelog entry** at the bottom of this file documenting what changed and why
5. **Preserve all existing information** unless it's demonstrably obsolete
6. **Use clear, concise language** matching the file's style

### What NOT to Update:

- ❌ The frontmatter block (name, description, tools) unless explicitly requested
- ❌ Core processing pipeline (Steps 1-5) unless there's a fundamental workflow change
- ❌ File format templates unless the vault-wide standard has changed
- ❌ User preferences already documented (don't second-guess)
- ❌ Naming conventions (these should be stable)

### Self-Update Example:

```diff
In Step 2, update the color list:
- Already used: Dragon Ball Z (orange `#f97316`), Dragon Ball (yellow `#eab308`), F1 (red `#ef4444`), Peaky Blinders (indigo `#6366f1`), Jujutsu Kaisen (green `#22c55e`)
+ Already used: Dragon Ball Z (orange `#f97316`), Dragon Ball (yellow `#eab308`), F1 (red `#ef4444`), Peaky Blinders (indigo `#6366f1`), Jujutsu Kaisen (green `#22c55e`), My Hero Academia (blue `#3b82f6`)
```

### Agent Self-Awareness Checklist:

Before finishing a run, the agent should ask itself:
- [ ] Did I create new media? → Update the color list
- [ ] Did I encounter patterns not documented here? → Add them to Reference section
- [ ] Did the user correct my behavior? → Update relevant instructions
- [ ] Did I make assumptions that should be documented? → Add to Important Rules
- [ ] Would future runs benefit from knowing what I just learned? → Document it

**Goal:** Make each run smarter than the last by continuously refining this agent file based on real-world usage.

---

## ⚠️ Important Rules

1. **Never delete existing content** — only add or enrich
2. **Preserve Obsidian syntax exactly** — callouts use `> [!type]`, internal links use `[[]]`
3. **Date in frontmatter** is always `YYYY-MM-DD`, display dates are `dd/mm`
4. **One card = one file** — never combine multiple words in a single file
5. **Keep translations in Brazilian Portuguese** (PT-BR), not European Portuguese
6. **Cross-reference note** goes inside the `> [!tip] Notes` callout, prefixed with 📺
7. **For multi-word phrases** like "call it quits", the filename is `call-it-quits.md` but the display name in definitions can be natural
8. **When enriching existing cards**, make a comment in the report about what was changed — transparency is key
9. **Thematic tags are additive** — never remove existing tags, only add new ones that genuinely improve discoverability
10. **Duplicate sense notes are informative** — they help recognize overlap but shouldn't discourage creating the card
11. **New media setup requires user confirmation** — ask for category and color choice before proceeding
12. **Passive linking is content-neutral** — never add new text to create a link; only wrap already-existing mentions in `[[brackets]]`. Scope: `> [!tip] Notes` callout only.
13. **Always self-update this file** at the end of each run if anything was learned

---

## 📝 Changelog

### 2026-02-12 — Initial Version
- Created comprehensive agent with 5-step pipeline
- Added semantic enhancements (synonyms, duplicate detection, tag inference)
- Included detailed media bootstrapping checklist (11 steps)
- Documented self-maintenance protocol
- Migrated from prompt file to custom agent format