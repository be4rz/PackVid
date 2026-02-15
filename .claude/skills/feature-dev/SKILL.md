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
- Trivial changes
- Well-defined, simple tasks
- Urgent hotfixes

## Core Principles

- **Check memory first**: Before exploration, search memory for existing codebase knowledge
- **Ask clarifying questions**: Identify all ambiguities and edge cases before implementing
- **Understand before acting**: Read and comprehend existing code patterns first
- **Read files identified by agents**: After agents complete, read key files to build context
- **Store findings in memory**: After exploration, store valuable discoveries for future use
- **Simple and elegant**: Prioritize readable, maintainable, architecturally sound code
- **Use TodoWrite**: Track all progress throughout
- **Use related skills**: Invoke specialized skills during implementation

## Related Skills

Use these skills during implementation (Phase 5) as needed:

| Skill             | When to Use                                                                     |
| ----------------- | ------------------------------------------------------------------------------- |
| `memory`          | Before exploration to check existing knowledge; after to store findings         |
| `lohi-ui-design`  | When building UI components, pages, forms, buttons, cards using lohi-ui library |
| `frontend-design` | When creating distinctive, production-grade frontend interfaces                 |

**IMPORTANT**: During Phase 5 (Implementation), proactively invoke these skills:

- Creating a new module? → Use `memory` skill to document it
- Building UI components? → Use `lohi-ui-design` skill for Swiss/Minimalist style
- Designing frontend pages? → Use `frontend-design` skill for distinctive aesthetics

## The 7 Phases

### Phase 1: Discovery

**Goal**: Understand what needs to be built

**Actions**:

1. Create todo list with all phases
2. If feature unclear, ask user for:
   - What problem are they solving?
   - What should the feature do?
   - Any constraints or requirements?
3. Summarize understanding and confirm with user

### Phase 2: Codebase Exploration

**Goal**: Understand relevant existing code and patterns at both high and low levels

**CRITICAL: Check Memory First**

Before launching explore agents, use the `memory` skill to search for existing knowledge. If sufficient context exists, skip or reduce agent exploration. Include memory findings in agent prompts to avoid redundant discovery.

**Actions**:

1. **Check memory** for existing codebase knowledge (see above)
2. Launch 2-3 `code-explorer` agents in parallel. Each agent should:

   - Trace through the code comprehensively
   - Focus on getting comprehensive understanding of abstractions, architecture and flow
   - Target different aspects (similar features, architecture, user experience)
   - Return a list of 5-10 key files to read

   **Example agent prompts**:

   - "Find features similar to [feature] and trace through their implementation comprehensively"
   - "Map the architecture and abstractions for [feature area], tracing through the code comprehensively"
   - "Analyze the current implementation of [existing feature/area], tracing through the code comprehensively"

3. Read all files identified by agents to build deep understanding
4. **Store valuable discoveries in memory**: Use the `memory` skill to document findings in the codebase
5. Present comprehensive summary of findings and patterns discovered

See [agents/code-explorer.md](agents/code-explorer.md) for agent details.

### Phase 3: Clarifying Questions

**Goal**: Fill in gaps and resolve all ambiguities before designing

**CRITICAL**: This is one of the most important phases. DO NOT SKIP.

**Actions**:

1. Review the codebase findings and original feature request
2. Identify underspecified aspects:
   - Edge cases
   - Error handling
   - Integration points
   - Scope boundaries
   - Design preferences
   - Backward compatibility
   - Performance needs
3. **Present all questions to the user in a clear, organized list**
4. **Wait for answers before proceeding to architecture design**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

### Phase 4: Architecture Design

**Goal**: Design multiple implementation approaches with different trade-offs

**Actions**:

1. Launch 2-3 `code-architect` agents in parallel with different focuses:

   - **Minimal changes**: Smallest change, maximum reuse
   - **Clean architecture**: Maintainability, elegant abstractions
   - **Pragmatic balance**: Speed + quality

2. Review all approaches and form your opinion on which fits best
3. Present to user:
   - Brief summary of each approach
   - Trade-offs comparison
   - **Your recommendation with reasoning**
   - Concrete implementation differences
4. **Ask user which approach they prefer**

See [agents/code-architect.md](agents/code-architect.md) for agent details.

### Phase 5: Implementation

**Goal**: Build the feature

**DO NOT START WITHOUT USER APPROVAL**

**Actions**:

1. Wait for explicit user approval
2. Read all relevant files identified in previous phases
3. Implement following chosen architecture
4. Follow codebase conventions strictly
5. Write clean, well-documented code
6. Update todos as you progress

**Module Structure** (see [docs/module-structure.md](/docs/module-structure.md)):
When creating new domain modules, follow DDD/Clean Architecture:

```
modules/[domain]/
├── adapters/      # Domain-specific UI components
├── entities/      # Domain entities (core business objects)
├── repositories/  # Data access layer (DB queries, API calls)
└── usecases/      # Business logic / application services
```

**Dependency Rule**: Inner layers (entities) never depend on outer layers.

- `app/` → `adapters/` → `usecases/` → `repositories/` → `entities/`
- `adapters/` → `repositories/` → `lib/db/`

**Use Related Skills During Implementation**:

- **Building UI?** → Invoke `lohi-ui-design` skill for component library and Swiss/Minimalist style
- **Creating frontend pages?** → Invoke `frontend-design` skill for distinctive, production-grade interfaces
- **Created new module?** → Invoke `memory` skill to document the module

### Phase 6: Quality Review

**Goal**: Ensure code is simple, DRY, elegant, and functionally correct

**Actions**:

1. Launch 3 `code-reviewer` agents in parallel with different focuses:

   - Simplicity/DRY/elegance
   - Bugs/functional correctness
   - Project conventions/abstractions

2. Consolidate findings and identify highest severity issues
3. **Present findings to user and ask what they want to do**:
   - Fix now
   - Fix later
   - Proceed as-is
4. Address issues based on user decision

See [agents/code-reviewer.md](agents/code-reviewer.md) for agent details.

### Phase 7: Summary

**Goal**: Document what was accomplished

**Actions**:

1. Mark all todos complete
2. **Ensure documentation exists** → If new modules were created, verify `memory` skill was used
3. Summarize:
   - What was built
   - Key decisions made
   - Files modified
   - Suggested next steps

## Example Usage

```
User: I need to add user authentication with OAuth

Claude: [Phase 1] Let me understand what you need...
        - Which OAuth providers? (Google, GitHub, etc.)
        - Replace current auth or add alongside?
        - Any specific security requirements?

User: Google and GitHub, add alongside existing auth

Claude: [Phase 2] Launching code-explorer agents to understand
        your current auth system...

        Found: JWT-based auth in src/auth/, session management
        in src/session/, API middleware in src/middleware/

        Key files to understand:
        - src/auth/AuthService.ts:45
        - src/middleware/authMiddleware.ts:12

Claude: [Phase 3] Before designing, I need to clarify:
        1. Store OAuth tokens or just user profile?
        2. Link OAuth to existing accounts?
        3. How to handle OAuth failures?

User: Store tokens, allow linking, show error page on failure

Claude: [Phase 4] I've designed 3 approaches...
        Recommendation: Approach 3 (pragmatic balance)
        Which would you prefer?

User: Go with your recommendation

Claude: [Phase 5] Implementing OAuth with pragmatic approach...
        [Updates todos, writes code]

Claude: [Phase 6] Code review found 2 high-priority issues:
        1. Missing error handling in callback
        2. Token cleanup needed
        What would you like to do?

User: Fix them now

Claude: [Phase 7] Feature Complete: OAuth Authentication
        - Built OAuth for Google and GitHub
        - Integrated with existing auth
        - Files modified: 4 new, 3 updated
        - Next steps: Add tests, documentation
```

## Best Practices

1. **Use the full workflow for complex features**: The 7 phases ensure thorough planning
2. **Answer clarifying questions thoughtfully**: Phase 3 prevents future confusion
3. **Choose architecture deliberately**: Phase 4 gives you options for a reason
4. **Don't skip code review**: Phase 6 catches issues before production
5. **Read the suggested files**: Phase 2 identifies key files - read them to understand context
