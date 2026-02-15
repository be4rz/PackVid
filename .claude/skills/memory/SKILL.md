---
name: memory
description: Source code IS memory. Store knowledge as inline docs, header comments, and README files. Retrieve via grep/find. USE PROACTIVELY - (1) before exploring, grep for existing docs, (2) after discovering, write findings into code. Triggers on "remember", "recall", "what do you know", "document", "README", "where is", "how does X work".
---

# Memory

**Principle: Source code is the memory store. No external databases.**

The filesystem already solves memory. Write docs as memory storage, use grep/find for retrieval.

## Core Concept

| Action | Method |
|--------|--------|
| **Store** | Write inline docs, header comments, README files |
| **Retrieve** | `python3 .claude/skills/memory/scripts/memory.py retrieve <topic>` |
| **Update** | Edit existing docs when knowledge changes |
| **Validate** | `python3 .claude/skills/memory/scripts/memory.py validate <path>` |

## Staleness Detection (Git-based)

The memory script detects outdated docs by parsing dependencies and comparing git timestamps.

**Detection strategy (in order):**
1. **Explicit deps**: Parse `## Depends` section or `@depends` tag
2. **Inline refs**: Parse file references like `service.ts:functionName`
3. **Fallback**: Check code files in same directory

```bash
# Search docs with freshness status
python3 .claude/skills/memory/scripts/memory.py retrieve "auth"

# Output: Status, Source (explicit/directory), Updated, Path
# ✓ Fresh        explicit   2024-01-15   ./src/auth/auth.README.md
# ⚠ STALE(8d)   explicit   2024-01-10   ./src/api/api.README.md
# ? Error        -          N/A          ./untracked/file.md

# Validate specific doc (shows which deps were checked)
python3 .claude/skills/memory/scripts/memory.py validate ./src/auth.README.md

# Validate all docs in directory
python3 .claude/skills/memory/scripts/memory.py validate --dir ./src
```

**Exit codes** (for CI integration):
- `0` - All docs fresh
- `1` - Stale docs found
- `2` - Error occurred

When docs are stale: Review and update them to reflect recent code changes.

## Retrieval (Before Exploring)

Always check existing docs before launching explore agents or answering questions.

```bash
# Primary: Use memory script (shows freshness status)
python3 .claude/skills/memory/scripts/memory.py retrieve "topic"

# Fallback: Direct grep for specific searches
grep -ri "topic" --include="*.md" -B 2 -A 5 .
grep -r "@description.*topic" --include="*.ts" -A 3 .
```

### Quick Retrieval Patterns

```bash
# "Where is X?" - find file locations
grep -r "ClassName\|functionName" --include="*.ts" -l .

# "How does X work?" - use memory script
python3 .claude/skills/memory/scripts/memory.py retrieve "X"

# "What uses X?" - find integration points
grep -r "import.*X\|Used by:" --include="*.ts" --include="*.md" .
```

## Storage (After Discovering)

After exploration, write findings into the codebase as docs.

### Storage Format Decision

| Scope | Format | Location |
|-------|--------|----------|
| Single function | JSDoc/docstring | Above function |
| Single file | Header comment | Top of file |
| Module (2-3 files) | Header in each file | Top of each file |
| Module (4+ files) | README file | `{module}.README.md` |
| Feature/System | Architecture doc | `docs/` or root README |

### Writing Header Comments

For files under 100 lines or single-purpose files:

```typescript
/**
 * Auth Session Handler
 *
 * Validates JWT tokens and retrieves user sessions.
 *
 * @depends ./types.ts, ./utils.ts, ../db/supabase.ts
 * @usedby ../api/auth.ts, ../middleware.ts
 */
```

**Required**: `@depends` with relative file paths (comma-separated). Script uses this for staleness detection.

### Writing Module READMEs

For modules with 4+ files, create `{module-name}.README.md`:

```markdown
# [Module Name]

[1-2 sentence purpose]

## Depends

- `./index.ts`
- `./types.ts`
- `./service.ts`
- `../shared/utils.ts`

## Key Logic

| What | Where |
|------|-------|
| Token validation | `service.ts:validateToken` |
| User lookup | `service.ts:getUser` |
```

**Required**: `## Depends` section with file paths. Script parses this for staleness detection.

### Writing Function Docs

For complex or non-obvious functions:

```typescript
/**
 * Validates access token and returns decoded payload.
 *
 * @param token - JWT access token from Authorization header
 * @returns Decoded token payload with user ID and roles
 * @throws {TokenExpiredError} When token has expired
 * @throws {InvalidTokenError} When token signature is invalid
 *
 * Note: Checks against revocation list in Redis before returning.
 */
```

## Proactive Workflow

### Before Any Exploration

```bash
# 1. Check for existing docs (with freshness status)
python3 .claude/skills/memory/scripts/memory.py retrieve "topic"

# 2. If found and fresh → use existing knowledge, skip exploration
# 3. If found but stale → verify/update after exploring
# 4. If not found → proceed with exploration
```

### After Any Exploration

1. Identify what was learned
2. Choose appropriate storage format (see table above)
3. Write docs in the codebase
4. Commit with the feature/fix (docs travel with code)

## Rules

1. **Check before exploring** - Grep for existing docs first
2. **Write after discovering** - Future sessions benefit from today's findings
3. **Keep docs SHORT** - Max 50 lines README, 10 lines header
4. **Link to code** - Use `file.ts:functionName` format
5. **No duplication** - Don't repeat what code says
6. **Commit together** - Docs travel with the code they describe

## What to Document

- Purpose (1-2 sentences max)
- Integration points (used by, depends on)
- Complex logic locations
- Non-obvious decisions

## What NOT to Document

- API signatures (code is self-documenting)
- Step-by-step implementation details
- Tutorials or guides
- Information that changes frequently

## Why This Works

From [LlamaIndex research](https://www.llamaindex.ai/blog/did-filesystem-tools-kill-vector-search):
- Filesystem tools provide **higher accuracy** than vector search (8.4 vs 6.4)
- Complete file contents beat context-limited chunks
- For codebases, grep/find outperforms RAG systems
- The filesystem IS the database - no external storage needed

Memory stored as docs:
- Version controlled with the code
- Staleness detected via git (script compares doc vs code timestamps)
- Discoverable by any tool (not locked in proprietary format)
- Human-readable (developers benefit too)
