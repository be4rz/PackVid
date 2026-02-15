---
description: Run a comprehensive PR review using specialized agents for code quality, tests, error handling, types, and simplification.
argument-hint: [scope or focus area]
---

Invoke the `review-pr` skill to review the current changes:

<prompt>$ARGUMENTS</prompt>

Run a comprehensive review:
1. Determine scope via `git diff --name-only`
2. Launch applicable review agents in parallel:
   - `code-reviewer` (always)
   - `pr-test-analyzer` (if test files changed)
   - `comment-analyzer` (if comments/docs added)
   - `silent-failure-hunter` (if error handling changed)
   - `type-design-analyzer` (if types added/modified)
3. Aggregate results by severity: Critical > Important > Suggestions
4. Present summary with recommended actions
5. After fixes, run `code-simplifier` for polish
