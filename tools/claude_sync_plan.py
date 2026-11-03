#!/usr/bin/env python3
"""Work out what changed in the local folder since the last sync.

Used by Claude's monthly sync. Claude can list and copy files on my PC but
cannot run git there, so it clones the repo in the cloud, works out what changed
with this script, copies just those files over, commits and pushes.

Inputs
  --repo DIR        a clone of FatsyAlst/english-studying (with the local
                    .gitignore files already copied into it)
  --since EPOCH_MS  files modified after this time count as changed
  listings...       one or more PREFIX=FILE pairs. FILE is either
                      * the JSON of a recursive device_list_dir call, or
                      * a TSV with one "relative/path<TAB>mtimeMs" per line
                    and PREFIX is the folder it was listed from, relative to
                    the repo root ("" or "." for the root itself).

Output (JSON on stdout)
  stage    Windows paths to copy into the clone (new or changed files),
           in batches of at most 50
  delete   tracked files that were not in any listing (check each one
           before deleting: a listed folder might simply be missing)
  ignored  how many listed files the .gitignore rules skipped
"""
import argparse
import json
import subprocess
import sys

ROOT_WIN = "D:\\english-studying"


def norm_prefix(prefix):
    prefix = prefix.replace("\\", "/").strip("/")
    return "" if prefix in ("", ".") else prefix


def load_listing(prefix, path):
    prefix = norm_prefix(prefix)
    with open(path, encoding="utf-8") as fh:
        raw = fh.read()
    files = {}
    stripped = raw.lstrip()
    if stripped.startswith(("{", "[")):
        data = json.loads(stripped)
        entries = data.get("entries", []) if isinstance(data, dict) else data
        for entry in entries:
            if entry.get("type") != "file":
                continue
            rel = entry["name"].replace("\\", "/")
            files[f"{prefix}/{rel}" if prefix else rel] = entry.get("mtimeMs", 0)
    else:
        for line in raw.splitlines():
            if not line.strip():
                continue
            rel, _, mtime = line.partition("\t")
            rel = rel.strip().replace("\\", "/")
            files[f"{prefix}/{rel}" if prefix else rel] = float(mtime or 0)
    return files


def git(repo, *args, stdin=None, ok=(0,)):
    # check-ignore exits with 1 when nothing is ignored, which is fine
    res = subprocess.run(["git", "-C", repo, "-c", "core.quotepath=off", *args], input=stdin,
                         capture_output=True, text=True)
    if res.returncode not in ok:
        raise RuntimeError(f"git {' '.join(args)} failed: {res.stderr.strip()}")
    return res.stdout


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--since", type=float, required=True)
    ap.add_argument("listings", nargs="+")
    a = ap.parse_args()

    local = {}
    listed_prefixes = []
    for item in a.listings:
        prefix, _, path = item.partition("=")
        listed_prefixes.append(norm_prefix(prefix))
        local.update(load_listing(prefix, path))
    local = {p: m for p, m in local.items() if not p.startswith(".git/")}

    ignored_out = git(a.repo, "check-ignore", "--no-index", "--stdin",
                      stdin="\n".join(local) + "\n", ok=(0, 1)) if local else ""
    ignored = set(ignored_out.splitlines())
    keep = {p: m for p, m in local.items() if p not in ignored}

    tracked = set(git(a.repo, "ls-files").splitlines())
    new = sorted(p for p in keep if p not in tracked)
    changed = sorted(p for p in keep if p in tracked and keep[p] > a.since)

    def covered(p):
        return any(pref == "" or p == pref or p.startswith(pref + "/") for pref in listed_prefixes)
    delete = sorted(p for p in tracked if p not in local and covered(p))

    stage = [ROOT_WIN + "\\" + p.replace("/", "\\") for p in new + changed]
    batches = [stage[i:i + 50] for i in range(0, len(stage), 50)]
    json.dump({"new": len(new), "changed": len(changed), "ignored": len(ignored),
               "stage": batches, "delete": delete}, sys.stdout, indent=1, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
