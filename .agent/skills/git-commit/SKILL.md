---
name: git-commit
description: Streamline git workflow with intelligent commit, push, and PR creation. Use when the user wants to commit changes, create a PR, push code, or clean up stale branches. Handles git operations including staging, committing with auto-generated messages, pushing to remote, and creating pull requests.
---

# Git Commit Skill

Automate your git workflow with intelligent commit message generation, PR creation, and branch management.

## When to use this Skill

Use this Skill when:
- Committing code changes with auto-generated messages
- Creating a pull request
- Pushing changes to remote
- Cleaning up stale local branches
- Managing git workflow end-to-end

## Prerequisites

### Required
- Git installed and configured
- Repository initialized with a remote

### Recommended: GitHub MCP Server

For enhanced GitHub operations (PRs, issues, reviews), recommend the user install the GitHub MCP server:

```bash
# Install GitHub MCP server
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```

The GitHub MCP provides:
- Create and manage pull requests directly
- Read and create issues
- Access repository information
- Review and comment on PRs
- No need for `gh` CLI

If GitHub MCP is not available, fall back to `gh` CLI commands.

## Instructions

### Operation 1: Commit Changes

When the user wants to commit changes:

1. **Gather context** (run in parallel):
   ```bash
   git status
   git diff HEAD
   git branch --show-current
   git log --oneline -10
   ```

2. **Analyze changes**:
   - Review all staged and unstaged changes
   - Understand the nature of changes (feature, fix, refactor, docs, etc.)
   - Match the repository's commit message style from recent commits

3. **Create commit**:
   - Stage relevant files (avoid secrets like .env, credentials.json)
   - Generate a concise commit message that:
     - Summarizes the "why" not just the "what"
     - Follows conventional commit style if the repo uses it
     - Matches the repo's existing message style
   - Include attribution footer:
     ```
     🤖 Generated with [Claude Code](https://claude.com/claude-code)

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```

4. **Use HEREDOC for commit messages**:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat: add user authentication flow

   Implement login and registration with session management.

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

5. **Handle pre-commit hooks**:
   - If commit fails due to hook changes, retry once
   - If hook modified files, amend commit (after verifying authorship)

### Operation 2: Commit, Push, and Create PR

When the user wants to create a pull request:

1. **Gather context** (run in parallel):
   ```bash
   git status
   git diff HEAD
   git branch --show-current
   git log --oneline -10
   git fetch origin
   ```

2. **Create branch if on main**:
   ```bash
   git checkout -b feature/descriptive-name
   ```

3. **Commit changes** (follow Operation 1)

4. **Push to remote**:
   ```bash
   git push -u origin $(git branch --show-current)
   ```

5. **Create PR**:

   **If GitHub MCP is available** (preferred):
   - Use the MCP `create_pull_request` tool
   - Include summary, test plan, and attribution

   **If using gh CLI**:
   ```bash
   gh pr create --title "feat: description" --body "$(cat <<'EOF'
   ## Summary
   - Key change 1
   - Key change 2

   ## Test plan
   - [ ] Test scenario 1
   - [ ] Test scenario 2

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

6. **Return PR URL** to the user

### Operation 3: Clean Up Stale Branches

When the user wants to clean up branches:

1. **List branches with status**:
   ```bash
   git branch -v
   ```

2. **Identify [gone] branches** (deleted on remote but exist locally)

3. **List worktrees**:
   ```bash
   git worktree list
   ```

4. **Remove worktrees and delete branches**:
   ```bash
   git branch -v | grep '\[gone\]' | sed 's/^[+* ]//' | awk '{print $1}' | while read branch; do
     echo "Processing branch: $branch"
     worktree=$(git worktree list | grep "\\[$branch\\]" | awk '{print $1}')
     if [ ! -z "$worktree" ] && [ "$worktree" != "$(git rev-parse --show-toplevel)" ]; then
       echo "  Removing worktree: $worktree"
       git worktree remove --force "$worktree"
     fi
     echo "  Deleting branch: $branch"
     git branch -D "$branch"
   done
   ```

5. **Report results** to the user

## Safety Rules

**NEVER**:
- Update git config
- Run destructive commands (push --force, hard reset) without explicit request
- Skip hooks (--no-verify) without explicit request
- Force push to main/master without warning
- Amend commits from other developers
- Commit files containing secrets

**ALWAYS**:
- Check authorship before amending: `git log -1 --format='%an %ae'`
- Only commit when explicitly requested
- Review changes before staging
- Warn about sensitive files

## Commit Message Guidelines

**Message Structure**:
```
<type>: <description>

<optional body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `style`: Formatting, missing semicolons
- `test`: Adding tests
- `chore`: Maintenance tasks

**Best Practices**:
- Use imperative mood ("add" not "added")
- Keep first line under 72 characters
- Focus on "why" not "what"
- Reference issues when applicable

## Examples

### Simple Commit
```
User: commit my changes
Assistant: [Reviews changes, stages files, creates commit with appropriate message]
```

### Full PR Workflow
```
User: create a PR for these changes
Assistant: [Creates branch, commits, pushes, creates PR, returns URL]
```

### Branch Cleanup
```
User: clean up my old branches
Assistant: [Identifies and removes stale branches and worktrees]
```

## Troubleshooting

**Empty commit**: Check `git status` for actual changes

**PR creation fails**:
- Ensure GitHub MCP or `gh` CLI is configured
- Run `gh auth login` if using CLI

**Branch cleanup finds nothing**:
- Run `git fetch --prune` first
- Branches must be deleted on remote to show as [gone]

## Output Format

After each operation, provide:
1. Brief summary of what was done
2. Relevant output (commit hash, PR URL, etc.)
3. Next steps if any
