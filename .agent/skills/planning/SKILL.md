---
name: planning
description: Plan and track complex software development projects by breaking them into phases with codebase exploration. Use when building features, refactoring systems, or any multi-step work requiring understanding of existing code. Triggers on "plan", "break down", "phases", "roadmap", "architecture planning", "project planning".
---

# Planning Skill

A systematic 6-phase approach to creating implementation plans. Understand the codebase, ask questions, design phases, then track execution.

## When to Use

- Features requiring multiple components
- System refactoring or migrations
- Any task with 3+ distinct steps
- Complex integrations with existing code

## When NOT to Use

- Single-file changes
- Trivial bug fixes
- Well-defined simple tasks

## Core Principles

- **Understand before planning**: Use codebase exploration tools first
- **Ask clarifying questions**: Use `notify_user` to resolve ambiguities
- **Simple and actionable**: Prioritize clear, achievable phases
- **Track with task.md**: Use Antigravity's task artifact for progress tracking

## Storage Structure

```
.agent/features/{feature-name}/
├── design/              # From feature-design skill
├── plan/                # THIS SKILL
│   ├── plan.md          # Main plan with phase tracking
│   ├── phase-1.md       # Details per phase
│   ├── phase-2.md
│   └── summaries/       # Brief phase completion summaries
└── implementation/      # From feature-dev skill
```

## The 6 Phases

### Phase 1: Discovery

**Goal**: Understand what needs to be planned

1. Update `task.md` with all phases
2. If task unclear, ask user via `notify_user`
3. Summarize understanding and confirm

### Phase 2: Codebase Exploration

**Goal**: Understand relevant existing code and patterns

1. Search for related code using:
   - `grep_search` for patterns and dependencies
   - `view_file_outline` for file structure
   - `view_code_item` for specific functions
   - `find_by_name` to locate files
2. Trace through relevant features to understand architecture
3. Summarize: patterns, dependencies, risks

### Phase 3: Clarifying Questions

**Goal**: Fill gaps and resolve ambiguities before designing phases

**CRITICAL**: Do not skip this phase.

1. Review findings and original task
2. Identify underspecified aspects: scope, edge cases, integration, compatibility
3. Present questions via `notify_user`
4. Wait for answers before proceeding

### Phase 4: Plan Design

**Goal**: Design implementation phases with trade-offs

1. Consider multiple approaches:
   - **Minimal phases**: Fewest phases, fastest delivery
   - **Comprehensive**: Thorough coverage, more verification
2. Present to user via `notify_user`:
   - Phase summary for each approach
   - Trade-offs comparison
   - Your recommendation with reasoning
3. Ask which approach they prefer

### Phase 5: Plan Output

**Goal**: Create the plan files

1. Create plan directory: `.agent/features/{feature-name}/plan/`

2. Create `phase-{n}.md` for each phase:
   ```markdown
   # Phase {n}: {Name}

   ## Objective
   {What this phase accomplishes}

   ## Tasks
   - [ ] Task 1
   - [ ] Task 2

   ## Files to Modify
   - `path/to/file.ts`: {changes}

   ## Verification
   - [ ] How to verify completion
   ```

3. Create `plan.md` with phase tracking:
   ```markdown
   # {Feature Name} Plan

   ## Goal
   {One sentence end state}

   ## Phase Tracking
   | Phase | Name | Status | Description |
   |-------|------|--------|-------------|
   | 1 | {name} | [ ] | {brief desc} |
   | 2 | {name} | [ ] | {brief desc} |
   ```

4. Also create Antigravity's `implementation_plan.md` artifact for formal approval

### Phase 6: Summary

**Goal**: Document the plan and next steps

1. Mark planning tasks complete in `task.md`
2. Summarize: what was planned, key decisions, execution order
3. Present plan for final approval via `notify_user`

## Status Markers

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[!]` Blocked

## Phase Design Principles

- Each phase: 1-2 hours max
- Deliverable at end of each phase
- Minimize cross-phase dependencies
- Place risky work early
- Move scope creep to future phases

## Integration with Other Skills

```
feature-design → planning → feature-dev
(what & why)    (how)      (build)
```

Use design docs to inform plan. Use plan to guide implementation.
