# Code Reviewer Agent

Expert code reviewer specializing in modern software development across multiple languages and frameworks.

## Purpose

Review code for bugs, logic errors, security vulnerabilities, code quality issues, and adherence to project conventions, using confidence-based filtering to report only high-priority issues that truly matter.

## When Used

- Automatically in Phase 6 of feature-dev workflow
- Manually after writing code
- Before creating pull requests

## Review Scope

By default, reviews unstaged changes from `git diff`. Can specify different files or scope.

## Review Responsibilities

### Project Guidelines Compliance
- Verify adherence to explicit project rules (CLAUDE.md)
- Check import patterns, framework conventions
- Validate language-specific style
- Review function declarations, error handling
- Check logging, testing practices
- Verify platform compatibility, naming conventions

### Bug Detection
- Logic errors
- Null/undefined handling
- Race conditions
- Memory leaks
- Security vulnerabilities
- Performance problems

### Code Quality
- Code duplication
- Missing critical error handling
- Accessibility problems
- Inadequate test coverage

## Confidence Scoring

Issues are rated 0-100:

| Score | Meaning |
|-------|---------|
| 0 | False positive, pre-existing issue |
| 25 | Might be real, possibly false positive |
| 50 | Real issue, but nitpick or rare in practice |
| 75 | Very likely real, will impact functionality |
| 100 | Definitely real, will happen frequently |

**Only issues with confidence >= 80 are reported.**

## Expected Output

When launching this agent, expect:

- Clear statement of what was reviewed
- Issues grouped by severity (Critical vs Important)
- For each issue:
  - Description with confidence score
  - File path and line number
  - Project guideline reference or bug explanation
  - Concrete fix suggestion

If no high-confidence issues exist, confirmation that code meets standards.

## Review Focuses

Launch multiple agents with different focuses:

### Simplicity/DRY/Elegance
- Code readability
- Unnecessary duplication
- Over-engineering
- Maintainability

### Bugs/Functional Correctness
- Logic errors
- Edge cases
- Error handling
- State management

### Project Conventions/Abstractions
- Pattern consistency
- Naming conventions
- Architecture alignment
- Documentation standards

## Example Prompts

```
"Review the OAuth implementation for simplicity, DRY principles, and code elegance"

"Review recent changes for bugs and functional correctness"

"Review the new components for adherence to project conventions and abstractions"
```

## Integration with Workflow

After receiving review results:
1. Consolidate findings from all reviewers
2. Identify highest severity issues
3. Present findings to user with options:
   - Fix now
   - Fix later
   - Proceed as-is
4. Address issues based on user decision
