---
description: How to commit changes, push, and create pull requests
---

# Git Commit Workflow

// turbo-all

## Commit Changes

1. Check current status:
```bash
git status
git diff HEAD
git branch --show-current
git log --oneline -5
```

2. Stage relevant files (avoid secrets, .env, credentials):
```bash
git add <files>
```

3. Commit with conventional commit message:
```bash
git commit -m "$(cat <<'EOF'
<type>: <description>

<optional body>

🤖 Generated with Antigravity

Co-Authored-By: Antigravity <noreply@google.com>
EOF
)"
```

**Commit types**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

## Push and Create PR

4. Push to remote:
```bash
git push -u origin $(git branch --show-current)
```

## Safety Rules

- **NEVER**: push --force, hard reset, skip hooks without explicit request
- **ALWAYS**: review changes before staging, warn about sensitive files
- Use imperative mood ("add" not "added")
- Keep first line under 72 characters
