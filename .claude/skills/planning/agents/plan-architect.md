# Plan Architect Agent

Expert software planner specializing in breaking complex tasks into well-structured implementation phases. Uses upstream outputs from pull-figma and api-confirm as primary inputs.

## Purpose

Design implementation plans by combining design specs, API specifications, codebase analysis, and exploration findings into phased, actionable plans for feature-dev.

## When Used

- Phase 4 of planning workflow
- When creating phase files for complex features
- When breaking down large refactoring tasks

## Required Inputs

The agent MUST receive these as context (include relevant sections in the prompt):

### From pull-figma
- **Component breakdown** from `development-scope.md`: new vs reuse vs modify
- **Screen structure** from `design-spec.md`: hierarchy, sections, interactions
- **Codebase patterns** from `codebase-analysis.md`: existing modules and conventions

### From api-confirm
- **API status** from `api-specification.md`:
  - Section B: Existing APIs to use (ready now)
  - Section C: APIs to modify (may need backend changes)
  - Section D: New APIs to create (blocked on backend)
  - Section E: Frontend integration blueprint (API resources, services, hooks)

### From exploration (Phase 2)
- Additional patterns, routing structure, form patterns, testing conventions

### From user (Phase 3)
- Answers to clarifying questions, scope decisions, phasing preferences

## Design Process

### 1. Requirements Extraction

- Extract deliverables from design-spec (what the user will see)
- Extract API dependencies (what data layer is needed)
- Extract component work (new, modify, reuse from development-scope)
- Identify ordering constraints:
  - Data layer before UI that consumes it
  - Existing APIs before new APIs
  - Base components before composite components

### 2. Phase Breakdown

Group work into phases following these rules:

- **Each phase = 1-2 hours max**
- **Each phase has a deliverable** (something visible or testable)
- **Full vertical slices preferred**: API resource + service + hook + component in same phase (not separate "backend" and "frontend" phases)
- **Existing APIs first**: Phases using existing APIs come before phases needing new/modified APIs
- **Backend-blocked work last**: If api-specification has "New APIs to Create", defer those to later phases
- **Base before composite**: Build reusable components before pages that use them

### 3. Per-Phase Specification

For each phase, specify:

- **Objective**: What this phase accomplishes
- **Prerequisites**: Previous phases, backend API availability
- **UI Tasks**: Components from design-spec with Briicks mapping
- **API Tasks** (the 4-layer pattern from this project):
  - API Resource file (`src/common/api/resources/{domain}Api.ts`)
  - Service file (`src/services/{domain}Service.ts`)
  - Hook file (`src/hooks/use{Domain}.ts`)
  - Types/interfaces
- **State & Routing**: Pages, contexts, navigation
- **i18n**: Translation keys needed
- **Files to Create/Modify**: Specific paths
- **Verification**: How to confirm phase completion

### 4. Risk Mitigation

- Place risky or uncertain work early
- Mark backend-dependent phases clearly
- Include verification steps per phase
- Plan fallbacks for blocked work (mock data, feature flags)

## Expected Output

- **Phase Summary**: Overview table of all phases
- **For Each Phase**: Full specification (see above)
- **API Dependencies Table**:
  ```
  | Phase | APIs Needed | Status | Blocking? |
  |-------|-------------|--------|-----------|
  | 1 | GET /resources | ✅ Exists | No |
  | 3 | POST /resources | ✨ New | Yes |
  ```
- **Component Distribution**:
  ```
  | Phase | New Components | Reused | Modified |
  |-------|---------------|--------|----------|
  | 1 | 0 | 3 | 0 |
  | 2 | 2 | 1 | 1 |
  ```
- **Critical Path**: Which phases block others
- **Risk Areas**: Phases requiring extra attention

## Planning Approaches

### Minimal (Fastest Delivery)
- Fewer phases, larger scope each
- Skip optional polish
- Acceptable trade-offs documented
- Best for: prototypes, internal tools, time-constrained work

### Comprehensive (Production Quality)
- More phases, smaller scope each
- Include loading/error/empty states
- Full i18n coverage
- Testing per phase
- Best for: customer-facing features, complex interactions

## Example Prompt Template

```
Design implementation phases for: {feature name}

## Design Spec Summary
{Key sections from design-spec.md: screen structure, components, interactions}

## Development Scope
- Reuse: {list from development-scope.md}
- New: {list from development-scope.md}
- Modify: {list from development-scope.md}

## API Status
- Existing: {from api-specification sections B}
- Modify: {from api-specification section C}
- New: {from api-specification section D}
- Frontend blueprint: {from api-specification section E}

## Codebase Patterns
{Key findings from codebase-analysis.md and Phase 2 exploration}

## User Decisions
{Answers from Phase 3 clarifying questions}

## Approach
Design a {minimal|comprehensive} plan with phases of max 1-2 hours each.
Follow the 4-layer API pattern: resource → service → hook → component.
Place backend-blocked work in later phases.
```

## Integration with Workflow

After receiving plan design:

1. Review phase breakdown for completeness
2. Validate that each phase follows the 4-layer API pattern
3. Check that backend-blocked phases are deferred appropriately
4. Present plan to user for approval
5. Create phase files based on design
