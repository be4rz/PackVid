---
name: feature-dev
description: Comprehensive 7-phase feature development workflow with codebase exploration, architecture design, and quality review. Use when implementing new features, building functionality, adding capabilities, or any complex development requiring multiple files or architectural decisions. Triggers on "build feature", "implement", "add functionality", "develop", "create feature".
---

# Feature Development

A systematic 7-phase approach to building features. Understand the codebase deeply, ask clarifying questions, design elegant architectures, then implement with quality review.

## When to Use

- New features that touch multiple files
- Features requiring architectural decisions
- Complex integrations with existing code
- Features where requirements are somewhat unclear

## When NOT to Use

- Single-line bug fixes
- Trivial changes / well-defined simple tasks
- Urgent hotfixes

## Core Principles

- **Explore before acting**: Use `view_file_outline`, `grep_search`, `view_code_item` to understand existing code
- **Ask clarifying questions**: Use `notify_user` to resolve ambiguities before implementing
- **Simple and elegant**: Prioritize readable, maintainable code
- **Track progress**: Use `task.md` to track all phases
- **Use related skills**: Invoke specialized skills during implementation

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `memory` | Before exploration to check existing knowledge; after to store findings |
| `ui-ux-pro-max` | When building UI components — design system, palettes, typography |
| `tailwindcss` | When styling with Tailwind CSS v4 |
| `mermaidjs-v11` | When creating architecture or flow diagrams |

## PackVid Architecture

Follow the project structure from coding conventions (`/coding-instruction` workflow):

```
PackVid/
├── electron/                 # Main process (Node.js)
│   ├── main.ts              # Window creation, app lifecycle
│   ├── preload.ts           # IPC bridge to renderer
│   └── ipc/                 # IPC handlers by domain
├── src/                     # Renderer process (React)
│   ├── views/              # Page-level components
│   ├── components/         # Reusable UI components
│   ├── composables/        # Custom React hooks (useXxx)
│   ├── stores/             # State management
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript types
```

**Key rules**: Functional components only, IPC through preload bridge, UI text in Vietnamese, code in English.

## The 7 Phases

### Phase 1: Discovery

**Goal**: Understand what needs to be built

1. Update `task.md` with all phases
2. If feature unclear, ask user via `notify_user`:
   - What problem are they solving?
   - What should the feature do?
   - Any constraints or requirements?
3. Summarize understanding and confirm

### Phase 2: Codebase Exploration

**Goal**: Understand relevant existing code and patterns

1. Search for related code:
   - `grep_search` for similar patterns, function names, imports
   - `view_file_outline` on key files to understand structure
   - `view_code_item` for specific functions/classes
   - `find_by_name` to locate relevant files
2. Trace through existing similar features to understand patterns
3. Document findings in `task.md`

### Phase 3: Clarifying Questions

**Goal**: Fill in gaps and resolve all ambiguities before designing

**CRITICAL**: Do NOT skip this phase.

1. Review codebase findings and original feature request
2. Identify underspecified aspects:
   - Edge cases, error handling
   - Integration points (IPC, state, routing)
   - Scope boundaries
   - Design preferences
   - Electron vs React responsibilities
3. Present all questions via `notify_user` in organized list
4. Wait for answers before proceeding

### Phase 4: Architecture Design

**Goal**: Design the implementation approach

1. Explore multiple approaches by analyzing trade-offs:
   - **Minimal changes**: Smallest change, maximum reuse
   - **Clean architecture**: Maintainability, elegant abstractions
   - **Pragmatic balance**: Speed + quality
2. Present to user via `notify_user`:
   - Brief summary of each approach
   - Trade-offs comparison
   - Your recommendation with reasoning
3. Create `implementation_plan.md` artifact with chosen approach

### Phase 5: Implementation

**Goal**: Build the feature

**DO NOT START WITHOUT USER APPROVAL**

1. Wait for explicit approval via `notify_user`
2. Read all relevant files identified in previous phases
3. Implement following chosen architecture:
   - Follow PackVid coding conventions (`/coding-instruction`)
   - Use `tailwindcss` skill for styling
   - Use `ui-ux-pro-max` skill for design decisions
4. Update `task.md` as you progress

### Phase 6: Quality Review

**Goal**: Ensure code is clean, correct, and follows conventions

1. Review your own changes systematically:
   - **Simplicity/DRY**: Check for duplication and unnecessary complexity
   - **Bugs/correctness**: Verify logic, edge cases, error handling
   - **Conventions**: Ensure PackVid coding conventions followed
   - **TypeScript**: Proper types, no `any` abuse
   - **Electron safety**: No Node.js APIs exposed to renderer
2. Consolidate issues by severity (Critical → Important → Suggestion)
3. Present findings via `notify_user` and ask what to fix

### Phase 7: Summary

**Goal**: Document what was accomplished

1. Mark all tasks complete in `task.md`
2. Create `walkthrough.md` artifact:
   - What was built
   - Key decisions made
   - Files modified/created
   - Suggested next steps

## Integration Flow

```
feature-design → planning → feature-dev
(what & why)    (how)      (build)
```
