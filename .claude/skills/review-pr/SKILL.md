---
name: review-pr
description: Comprehensive PR review using specialized agents for code comments, test coverage, error handling, type design, code quality, and simplification. Use when reviewing PRs, checking code quality, analyzing tests, reviewing error handling, or preparing code for merge. Triggers on "review PR", "check code", "review tests", "check error handling", "simplify code", "before merge".
---

# PR Review

A comprehensive pull request review toolkit with 6 specialized agents that each focus on a different aspect of code quality. Use individually for targeted reviews or together for thorough PR analysis.

## When to Use

- Before creating a PR
- After implementing a feature
- When adding documentation or comments
- After modifying error handling
- When introducing new types
- To polish and simplify code

## Available Agents

| Agent                   | Focus                                     | When to Use                   |
| ----------------------- | ----------------------------------------- | ----------------------------- |
| `code-reviewer`         | General code review, CLAUDE.md compliance | After writing/modifying code  |
| `code-simplifier`       | Simplification, clarity, maintainability  | After code review passes      |
| `comment-analyzer`      | Comment accuracy, documentation quality   | After adding docs/comments    |
| `pr-test-analyzer`      | Test coverage, quality, edge cases        | After creating/updating tests |
| `silent-failure-hunter` | Error handling, silent failures           | After adding error handling   |
| `type-design-analyzer`  | Type encapsulation, invariants            | When adding/modifying types   |

## Review Workflow

### Quick Review (Single Aspect)

For targeted review of a specific concern:

1. Identify the concern (tests, errors, types, comments, code quality)
2. Launch the appropriate agent
3. Address findings
4. Re-run to verify

### Comprehensive Review (Before PR)

For thorough pre-merge review:

**Phase 1: Determine Scope**

- Run `git diff --name-only` to identify changed files
- Identify which reviews apply based on changes

**Phase 2: Launch Applicable Reviews**

Based on changes:

- **Always**: `code-reviewer` (general quality)
- **If test files changed**: `pr-test-analyzer`
- **If comments/docs added**: `comment-analyzer`
- **If error handling changed**: `silent-failure-hunter`
- **If types added/modified**: `type-design-analyzer`
- **After review passes**: `code-simplifier` (polish)

**Phase 3: Sequential or Parallel**

- **Sequential** (easier to act on): Run one agent at a time
- **Parallel** (faster): Launch all agents simultaneously with separate Task calls

**Phase 4: Aggregate Results**

Summarize findings:

- **Critical Issues** (must fix before merge)
- **Important Issues** (should fix)
- **Suggestions** (nice to have)
- **Positive Observations** (what's good)

**Phase 5: Document Common Patterns (use memory skill)**

Use the **memory skill** to store common patterns discovered during review:

- **Before reviewing**: Use memory skill to retrieve existing PR patterns
- **After finding patterns**: Use memory skill to store new patterns

**Store** (common across codebase):
- Callback ordering patterns
- Validation patterns before async operations

**Do NOT store** (too specific):
- ~~FileReader handlers~~ (specific API)
- ~~Fixed positioning layout~~ (specific CSS)
- ~~File/line references~~

### Output Format

```markdown
# PR Review Summary

## Critical Issues (X found)

- [agent-name]: Issue description [file:line]

## Important Issues (X found)

- [agent-name]: Issue description [file:line]

## Suggestions (X found)

- [agent-name]: Suggestion [file:line]

## Strengths

- What's well-done in this PR

## Recommended Action

1. Fix critical issues first
2. Address important issues
3. Consider suggestions
4. Re-run review after fixes
```

## Agent Details

### code-reviewer

**Focus**: General code quality and project guideline compliance

- Reviews against CLAUDE.md rules
- Detects bugs, logic errors, security issues
- Evaluates code quality (duplication, error handling, accessibility)
- Confidence scoring (0-100), only reports issues >= 80

See [agents/code-reviewer.md](agents/code-reviewer.md)

### code-simplifier

**Focus**: Code clarity and maintainability

- Simplifies without changing functionality
- Reduces complexity and nesting
- Eliminates redundant code
- Avoids nested ternaries, prefers clarity over brevity

See [agents/code-simplifier.md](agents/code-simplifier.md)

### comment-analyzer

**Focus**: Code comment accuracy and documentation quality

- Verifies comments match actual code
- Identifies comment rot and outdated docs
- Assesses completeness and long-term value
- Flags misleading documentation

See [agents/comment-analyzer.md](agents/comment-analyzer.md)

### pr-test-analyzer

**Focus**: Test coverage quality and completeness

- Analyzes behavioral vs line coverage
- Identifies critical test gaps
- Evaluates test quality and resilience
- Rates gap criticality 1-10

See [agents/pr-test-analyzer.md](agents/pr-test-analyzer.md)

### silent-failure-hunter

**Focus**: Error handling and silent failures

- Finds empty catch blocks
- Reviews error logging quality
- Checks user-facing error messages
- Identifies hidden failures and fallbacks

See [agents/silent-failure-hunter.md](agents/silent-failure-hunter.md)

### type-design-analyzer

**Focus**: Type design and invariant quality

- Analyzes encapsulation (1-10)
- Reviews invariant expression (1-10)
- Judges invariant usefulness (1-10)
- Examines enforcement (1-10)

See [agents/type-design-analyzer.md](agents/type-design-analyzer.md)

## Usage Examples

### After Writing Code

```
User: I've added the new authentication feature. Can you check if everything looks good?

Claude: I'll launch the code-reviewer agent to review your changes.
[Task tool → code-reviewer agent]

Found 2 issues:
1. Missing error handling in callback [src/auth.ts:45]
2. Unused import [src/auth.ts:3]
```

### Before Creating PR

```
User: I'm ready to create the PR. Please do a thorough review.

Claude: I'll run a comprehensive review using multiple agents.

[Launches code-reviewer, pr-test-analyzer, silent-failure-hunter in parallel]

# PR Review Summary

## Critical Issues (1 found)
- silent-failure-hunter: Empty catch block hides API errors [src/api.ts:123]

## Important Issues (2 found)
- pr-test-analyzer: Missing test for error case [src/api.test.ts]
- code-reviewer: Variable shadowing [src/utils.ts:45]

## Strengths
- Good separation of concerns
- Comprehensive happy-path tests
```

### Simplify After Review

```
User: The code review passed. Can you simplify it?

Claude: I'll use the code-simplifier agent to improve clarity.
[Task tool → code-simplifier agent]

Simplified 3 areas:
1. Flattened nested conditionals [src/handler.ts:20-35]
2. Extracted repeated logic [src/utils.ts:10-25]
3. Simplified ternary to if/else [src/validate.ts:8]
```

## Best Practices

1. **Run before creating PR**: Catch issues early
2. **Focus on changes**: Agents analyze git diff by default
3. **Address critical first**: Fix high-priority issues first
4. **Re-run after fixes**: Verify issues are resolved
5. **Use targeted reviews**: Run specific agents for specific concerns
6. **Run code-simplifier last**: Polish after functionality is correct

## Workflow Integration

**Before committing:**

1. Write code
2. Run code-reviewer + silent-failure-hunter
3. Fix critical issues
4. Commit

**Before creating PR:**

1. Stage all changes
2. Run all applicable reviews
3. Address critical and important issues
4. Run specific reviews again to verify
5. Create PR

**After PR feedback:**

1. Make requested changes
2. Run targeted reviews based on feedback
3. Verify issues are resolved
4. Push updates
