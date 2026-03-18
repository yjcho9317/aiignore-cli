# AI Coding Tool Security Reference

Each AI coding tool has a different file-exclusion mechanism with different reliability and known bypass methods. This document summarizes tested behavior as of March 2026.

## Summary

| Tool | Ignore File | Reliability | File Read Blocked | Terminal Bypass | Special Behavior |
|------|------------|-------------|-------------------|-----------------|------------------|
| Cursor | `.cursorignore` | Low | Yes (Ask mode) | Yes (Agent mode) | `@` file reference ignores `.cursorignore` |
| Claude Code | `.claude/settings.json` | Medium | Yes | **No** (Read deny blocks Bash cat too) | `Read()` pattern alone covers both Read tool and Bash |
| Gemini CLI | `.geminiignore` | Low | Yes | Yes | Self-blocks `.env`, `.pem`, `credentials.json` by built-in policy |
| JetBrains AI | `.aiignore` | High | Yes | Yes | AI auto-redacts sensitive-looking content regardless of `.aiignore` |
| Windsurf | `.codeiumignore` | Medium | Yes | Yes | Asks permission before file access |
| Copilot | None | None | N/A | N/A | No ignore file for individual developers |

---

## Cursor

**File:** `.cursorignore` (gitignore syntax)
**Docs:** https://docs.cursor.com/context/ignore-files

| What | Result |
|------|--------|
| Ask mode: read `.env` | Blocked |
| Ask mode: read `server.pem` | Blocked |
| Agent mode: `cat .env` via terminal | **Bypassed** |
| `@.env` file reference in chat | **Not blocked** — `.cursorignore` ignored |
| Ctrl+P quick open | Excluded from results |

**Known CVEs:**
- CVE-2025-59944: case-sensitivity bypass
- CVE-2025-64110: agent rewrite bypass

**Bottom line:** "Best-effort" per official docs. Blocks AI file reads but not agent terminal access or `@` references.

---

## Claude Code

**File:** `.claude/settings.json` → `permissions.deny` array
**Docs:** https://code.claude.com/docs/en/settings

| What | Result |
|------|--------|
| `Read(.env)` deny → Read tool | Blocked |
| `Read(.env)` deny → `Bash(cat .env)` | **Also blocked** |
| `Read(*.pem)` deny → `Bash(cat server.pem)` | **Also blocked** |
| No deny → `cat .env` | Reads fine |
| Non-denied file (`app.js`) | Reads fine |

**Key finding:** `Read()` deny patterns block both the Read tool and Bash cat commands. Separate `Bash(cat:)` patterns are unnecessary.

**Caveat:** `Bash(cat:*.pem)` syntax is invalid — Claude Code rejects `:*` in the middle of a pattern. Only exact filenames work with `Bash(cat:)` format. Since `Read()` covers both, this limitation doesn't matter.

**Known issues:** `permissions.deny` has enforcement bugs ([#6699](https://github.com/anthropics/claude-code/issues/6699), [#6631](https://github.com/anthropics/claude-code/issues/6631), [#8961](https://github.com/anthropics/claude-code/issues/8961))

**Bottom line:** More reliable than expected. `Read()` deny is the most effective single-pattern protection across all tools tested.

---

## Gemini CLI

**File:** `.geminiignore` (gitignore syntax)
**Docs:** https://github.com/google-gemini/gemini-cli

| What | Result |
|------|--------|
| Read `.env` | **Self-blocked by Gemini** (not `.geminiignore`) |
| Read `server.pem` | **Self-blocked by Gemini** |
| Read `credentials.json` | **Self-blocked by Gemini** |
| Read `data.txt` (non-sensitive name) without `.geminiignore` | Reads fine |
| Read `data.txt` with `.geminiignore` | Blocked |
| Terminal: `cat data.txt` | **Bypassed** |

**Special behavior:** Gemini CLI has a built-in policy that refuses to display contents of files with sensitive-looking names (`.env`, `.pem`, `credentials.json`) regardless of `.geminiignore`. This is separate from the ignore file mechanism.

**Known issues:**
- Negation patterns (`!`) are broken
- `list_dir` ignores `.geminiignore` in Antigravity mode

**Bottom line:** Double protection for common sensitive filenames (built-in + `.geminiignore`), but terminal bypass still works.

---

## JetBrains AI

**File:** `.aiignore` (gitignore syntax, native)
**Docs:** https://www.jetbrains.com/help/ai-assistant/disable-ai-assistant.html

| What | Result |
|------|--------|
| Read `.env` without `.aiignore` | Exposed (`SECRET_KEY=super_secret_123`) |
| Read `.env` with `.aiignore` | `SECRET_KEY=[REDACTED]` |
| Read `data.txt` ("TEST TEXT") with `.aiignore` | **"File not found"** — fully blocked |
| Read `data.txt` ("admin_password=...") with `.aiignore` | REDACT instead of block |
| Terminal: `cat data.txt` | **Bypassed** |

**Special behavior:** Two mechanisms overlap:
1. `.aiignore` blocks file access entirely ("file not found") for non-sensitive content
2. AI auto-redacts sensitive-looking values (passwords, keys) regardless of `.aiignore`

When both apply (sensitive file in `.aiignore`), you see REDACT instead of full block.

**Known issues:**
- Not 100% guaranteed ([YouTrack LLM-17544](https://youtrack.jetbrains.com/issue/LLM-17544))
- Claude Agent inside JetBrains may ignore `.aiignore` ([LLM-20693](https://youtrack.jetbrains.com/issue/LLM-20693))

**Bottom line:** Most reliable ignore mechanism tested. Native support with proper file-level blocking.

---

## Windsurf / Codeium

**File:** `.codeiumignore` (gitignore syntax)
**Docs:** https://docs.windsurf.com/context-awareness/windsurf-ignore

| What | Result |
|------|--------|
| Read `.env` without `.codeiumignore` | Reads (asks permission first) |
| Read `.env` with `.codeiumignore` | Blocked |
| Terminal: `cat .env` | **Bypassed** |

**Known issues:**
- Negation (`!`) cannot override `.gitignore` exclusions ([Issue #133](https://github.com/codeiumdev/codeium/issues/133))
- "Allow Cascade to access .gitignore files" toggle doesn't work ([Issue #225](https://github.com/codeiumdev/codeium/issues/225))
- Still uses `.codeiumignore`, not `.windsurfignore`

**Bottom line:** Solid basic protection. Asks permission before reading files, which adds an extra layer.

---

## GitHub Copilot

**File:** None
**Docs:** https://docs.github.com/en/copilot/managing-copilot/configuring-content-exclusions

No `.copilotignore` file exists. The only file-exclusion mechanism is **Content Exclusion**, which:
- Requires Business or Enterprise plan
- Is configured by org admins, not individual developers
- Does NOT work in Agent mode, Edit mode, or Copilot CLI

**Bottom line:** Individual developers have no file-level protection. `aiignore` generates a guide document (`.github/copilot-security-guide.md`) with alternative recommendations.

---

## Common Weakness

All tools share the same fundamental limitation: **agent/terminal modes can bypass ignore files** by executing shell commands (`cat`, `type`, etc.) directly. This is inherent to how AI agents work — they have shell access that operates outside the ignore file system.

The only tool where terminal bypass was NOT observed is **Claude Code**, where `Read()` deny patterns also blocked `Bash(cat ...)` attempts.
