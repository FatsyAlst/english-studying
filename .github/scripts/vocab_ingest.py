"""
Daily Vocabulary Ingestion Script
Reads the To-Do List, calls Claude to research and create vocabulary cards,
then writes the files to disk. The GitHub Actions workflow handles the commit.
"""

import os
import re
import json
import anthropic
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent
VAULT = REPO_ROOT / "obsidian-vaults" / "english-vocabulary"
TODO_PATH = VAULT / "Resources" / "Vocabulary To-Do List.md"
VOCAB_DIR = VAULT / "Vocabulary"
PROMPT_PATH = REPO_ROOT / "prompts" / "vocabulary-learning-prompt.txt"
MAX_WORDS_PER_RUN = 10


def read_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def build_vault_context() -> str:
    """Read existing cards and CSS to give Claude full vault context."""
    context_parts = []

    # vocabulary-learning-prompt
    context_parts.append(f"=== prompts/vocabulary-learning-prompt.txt ===\n{read_file(PROMPT_PATH)}")

    # To-Do List
    context_parts.append(f"=== Resources/Vocabulary To-Do List.md ===\n{read_file(TODO_PATH)}")

    # CSS theme
    css_path = VAULT / ".obsidian" / "snippets" / "vocabulary-theme.css"
    context_parts.append(f"=== .obsidian/snippets/vocabulary-theme.css ===\n{read_file(css_path)}")

    # Homepage
    homepage_path = VAULT / "Homepage.md"
    context_parts.append(f"=== Homepage.md ===\n{read_file(homepage_path)}")

    # Sample existing cards (up to 3 from different media)
    sample_cards = []
    for media_folder in sorted(VOCAB_DIR.iterdir()):
        if not media_folder.is_dir():
            continue
        cards = [f for f in media_folder.iterdir() if f.suffix == ".md" and f.name != f"{media_folder.name}.md"]
        if cards:
            sample_cards.append(cards[0])
        if len(sample_cards) >= 3:
            break

    for card in sample_cards:
        rel = card.relative_to(REPO_ROOT)
        context_parts.append(f"=== {rel} (existing card — use as format reference) ===\n{read_file(card)}")

    # List all existing word filenames for duplicate detection
    existing_words = []
    for media_folder in sorted(VOCAB_DIR.iterdir()):
        if not media_folder.is_dir():
            continue
        for f in media_folder.iterdir():
            if f.suffix == ".md" and f.name != f"{media_folder.name}.md":
                existing_words.append(f"{media_folder.name}/{f.stem}")
    context_parts.append(f"=== EXISTING WORDS IN VAULT ===\n" + "\n".join(existing_words))

    return "\n\n".join(context_parts)


SYSTEM_PROMPT = """
You are an autonomous English Vocabulary Ingestion Agent for a personal Obsidian vault
stored in a GitHub repository. The vault path is: obsidian-vaults/english-vocabulary/

Your job for this run:

STEP 1 — Read the To-Do List provided in the context. Identify pending words grouped
under each [[Media Name]] section in "## 🆕 To Learn". Select up to {max_words} words
starting from the TOP of the list. Alternate between media if multiple have pending words.

STEP 2 — For each selected word, research it thoroughly following the instructions in
`prompts/vocabulary-learning-prompt.txt` provided in the context. That file is your
complete research and content standard — follow it exactly.

STEP 3 — Check for duplicates using the EXISTING WORDS IN VAULT list in the context.
Normalize: lowercase, spaces → hyphens. If a word already exists, enrich it instead
of duplicating.

STEP 4 — Create each vocabulary card matching the EXACT format of the existing sample
cards provided in the context. The existing cards are the format standard.

Key format rules (confirm against sample cards):
- frontmatter: media, tags, created (YYYY-MM-DD)
- Frequency: Most Common, Common, Less Common, Rare, Archaic
- Single meaning: no ### Sense N headers
- Obsidian callouts: > [!example] and > [!tip]
- Translations: Brazilian Portuguese (PT-BR) only

STEP 5 — Semantic enhancements:
A) Note near-synonyms already in the vault in > [!tip] Notes
B) Add 1-3 thematic tags (#idiom, #phrasal-verb, #formal, #slang, #emotion, #combat)
C) Passive linking: wrap existing vault word mentions in [[brackets]] in Usage Notes only

STEP 6 — Return your output as a single valid JSON object with this exact structure:
{{
  "words_processed": ["word1", "word2"],
  "files": [
    {{
      "path": "obsidian-vaults/english-vocabulary/Vocabulary/Media Name/word-slug.md",
      "content": "full file content here"
    }}
  ],
  "todo_removals": [
    {{
      "media": "Media Name",
      "word": "exact word string as it appears in the To-Do List"
    }}
  ],
  "enriched": [],
  "notes": "brief summary of what was done"
}}

Return ONLY the JSON object. No markdown fences, no explanation outside the JSON.
""".format(max_words=MAX_WORDS_PER_RUN)


def remove_words_from_todo(todo_content: str, removals: list[dict]) -> str:
    """Remove processed words from the To-Do List."""
    lines = todo_content.split("\n")
    words_to_remove = {r["word"].strip().lower() for r in removals}

    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("- "):
            item = stripped[2:].strip().strip('"').strip("'").lower()
            if item in words_to_remove:
                continue
        new_lines.append(line)

    return "\n".join(new_lines)


def main():
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    # Check if To-Do List has any pending words
    todo_content = read_file(TODO_PATH)
    if "## 🆕 To Learn" not in todo_content:
        print("No To-Do List section found. Nothing to process.")
        return

    # Quick check: are there any list items under the To Learn section?
    todo_section = todo_content.split("## 🆕 To Learn")[-1]
    if not re.search(r"^\s*-\s+\S", todo_section, re.MULTILINE):
        print("To-Do List is empty. Nothing to process.")
        return

    print("Building vault context...")
    vault_context = build_vault_context()

    print("Calling Claude...")
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Here is the full vault context:\n\n{vault_context}\n\nProcess the next {MAX_WORDS_PER_RUN} words from the To-Do List."
            }
        ]
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if Claude wrapped them anyway
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)

    print("Parsing response...")
    try:
        result = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"ERROR: Could not parse JSON response: {e}")
        print("Raw response preview:", raw[:500])
        raise

    # Write vocabulary card files
    for file_entry in result.get("files", []):
        file_path = REPO_ROOT / file_entry["path"]
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(file_entry["content"], encoding="utf-8")
        print(f"  Written: {file_entry['path']}")

    # Update To-Do List
    removals = result.get("todo_removals", [])
    if removals:
        updated_todo = remove_words_from_todo(todo_content, removals)
        TODO_PATH.write_text(updated_todo, encoding="utf-8")
        print(f"  Removed {len(removals)} words from To-Do List")

    words = result.get("words_processed", [])
    print(f"\nDone. Processed {len(words)} words: {', '.join(words)}")
    if result.get("notes"):
        print(f"Notes: {result['notes']}")


if __name__ == "__main__":
    main()
