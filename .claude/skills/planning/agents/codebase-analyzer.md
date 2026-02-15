# Codebase Analyzer Agent

Expert analyst specializing in understanding codebases to inform implementation planning. Works alongside upstream outputs from pull-figma and api-confirm.

## Purpose

Fill knowledge gaps NOT already covered by upstream analysis. Pull-figma provides `codebase-analysis.md` and api-confirm provides `api-specification.md` — this agent explores areas those skills didn't cover.

## When Used

- Phase 2 of planning workflow
- **Only for gaps** not covered by upstream outputs
- When planning features that touch areas outside pull-figma's component scope

## Pre-Check: What Already Exists

Before launching this agent, check if these files exist and what they cover:

| File | Covers |
|---|---|
| `codebase-analysis.md` | Existing components, modules, hooks, services for the feature area |
| `api-specification.md` section E | Frontend integration blueprint (API resources, services, hooks to create) |
| `development-scope.md` | Which components exist, which are new, which need modification |

**Only explore areas NOT covered above.** Common gaps to fill:

- Routing and page structure (`src/app/`)
- State management patterns (contexts, global stores)
- Shared utilities and helpers
- Testing patterns for similar features
- i18n file organization for the feature area
- Form validation patterns (React Hook Form + Zod)
- Permission/role-based access patterns

## Analysis Approach

### 1. Gap-Focused Discovery

- Read upstream files to understand what's already known
- Identify specific areas still unknown
- Target exploration to those areas only

### 2. Pattern Analysis

- Extract coding conventions and style patterns
- Identify architectural decisions and layer boundaries
- Map module organization and file structure conventions
- Document testing patterns and approaches

### 3. Complexity Assessment

- Estimate scope of changes needed
- Identify risky or complex areas
- Flag potential blockers or challenges

### 4. Dependency Mapping

- Map internal module dependencies not in upstream analysis
- Note shared components or utilities
- Document integration points between new and existing code

## Expected Output

- **New Findings Only**: Don't repeat what's in upstream outputs
- **Relevant Areas**: File paths and modules that upstream analysis missed
- **Patterns**: Conventions with file:line references
- **Similar Implementations**: Features to reference for routing, forms, state patterns
- **Architecture Insights**: Layer boundaries, design patterns in use
- **Risks & Blockers**: Challenges not identified by upstream skills
- **List of 5-10 key files** essential for understanding the remaining scope

## Example Prompts

```
"Upstream analysis covers components and APIs for broadcast messaging.
Explore: routing patterns, form validation, and state management
for similar features in the codebase. Check src/app/ for page structure
and src/modules/ for module organization patterns."

"codebase-analysis.md covers existing hooks and services.
Explore: testing patterns, i18n organization, and permission
handling for features in src/modules/financial/"

"development-scope.md shows 3 new components needed.
Explore: how similar new modules were structured,
what shared utilities they use, and form patterns in src/modules/contact/"
```

## Integration with Workflow

After this agent returns:

1. Combine findings with upstream analysis for complete picture
2. Read key files identified to build understanding
3. Use patterns found to inform phase breakdown
4. Account for complexity factors in time estimates
5. Address risks as explicit tasks in the plan
