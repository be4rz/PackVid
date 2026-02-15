---
name: review-pr
description: Comprehensive code review covering quality, simplification, comments, tests, error handling, and type design. Use when reviewing PRs, checking code quality, analyzing tests, reviewing error handling, or preparing code for merge. Triggers on "review PR", "check code", "review tests", "check error handling", "simplify code", "before merge", "code review".
---

# PR Review

A comprehensive code review toolkit with 6 review focuses. Use individually for targeted reviews or together for thorough PR analysis.

## When to Use

- Before creating a PR
- After implementing a feature
- When adding documentation or comments
- After modifying error handling
- When introducing new types
- To polish and simplify code

## Review Focuses

| Focus | Description | When |
|-------|-------------|------|
| Code Quality | General review, convention compliance | After writing/modifying code |
| Simplification | Clarity, maintainability, DRY | After quality review passes |
| Comments | Comment accuracy, documentation quality | After adding docs/comments |
| Tests | Test coverage, quality, edge cases | After creating/updating tests |
| Error Handling | Silent failures, empty catches | After adding error handling |
| Type Design | Type encapsulation, invariants | When adding/modifying types |

## Review Workflow

### Quick Review (Single Focus)

1. Identify the concern
2. Run `git diff` to see changed files
3. Review using the relevant focus checklist below
4. Present findings via `notify_user`

### Comprehensive Review (Before PR)

**Phase 1: Determine Scope**

```bash
git diff --name-only main  # or target branch
```

**Phase 2: Run Applicable Reviews**

Based on changes, apply relevant focuses sequentially:

- **Always**: Code Quality (general)
- **If test files changed**: Tests
- **If comments/docs added**: Comments
- **If error handling changed**: Error Handling
- **If types added/modified**: Type Design
- **After all pass**: Simplification (polish)

**Phase 3: Aggregate Results**

Classify findings:
- **Critical Issues** (must fix before merge)
- **Important Issues** (should fix)
- **Suggestions** (nice to have)
- **Strengths** (what's good)

**Phase 4: Present Summary**

```markdown
# PR Review Summary

## Critical Issues (X found)
- Issue description [file:line]

## Important Issues (X found)
- Issue description [file:line]

## Suggestions (X found)
- Suggestion [file:line]

## Strengths
- What's well-done in this PR

## Recommended Action
1. Fix critical issues first
2. Address important issues
3. Consider suggestions
```

Present via `notify_user` and ask what to fix.

## Focus Checklists

### Code Quality
- [ ] Follows PackVid coding conventions (`/coding-instruction`)
- [ ] No bugs, logic errors, or security issues
- [ ] Proper TypeScript types (no `any` abuse)
- [ ] No code duplication
- [ ] Proper error handling and loading states
- [ ] Electron IPC safety (no Node APIs in renderer)
- [ ] Named exports for components

### Simplification
- [ ] Can any code be simplified without changing behavior?
- [ ] Reduce nesting and complexity
- [ ] Eliminate redundant code
- [ ] No nested ternaries — prefer if/else for clarity
- [ ] Extract repeated logic into helpers

### Comments
- [ ] Comments match actual code behavior
- [ ] No outdated/stale comments
- [ ] Complex logic has explanatory comments
- [ ] Code in English, UI text in Vietnamese

### Tests
- [ ] Critical paths covered
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] Tests are resilient (not brittle)

### Error Handling
- [ ] No empty catch blocks
- [ ] Errors logged with meaningful messages
- [ ] User-facing errors are clear (in Vietnamese)
- [ ] No silent failures hiding bugs
- [ ] Async operations have proper error handling

### Type Design
- [ ] Types express domain concepts clearly
- [ ] Proper encapsulation
- [ ] No overly broad types
- [ ] Interfaces for component props
- [ ] Discriminated unions where appropriate

## Best Practices

1. **Run before creating PR**: Catch issues early
2. **Focus on changes**: Review `git diff`, not entire files
3. **Address critical first**: Fix high-priority issues first
4. **Re-run after fixes**: Verify issues are resolved
5. **Run simplification last**: Polish after functionality is correct
