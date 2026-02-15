---
name: planning
description: Plan and track complex software development projects by breaking them into phases with codebase exploration. Reads upstream outputs from pull-figma (design-spec.md, development-scope.md) and api-confirm (api-specification.md) to create informed, implementation-ready plans. Use when building features, refactoring systems, or any multi-step work. Triggers on "plan", "break down", "phases", "roadmap", "architecture planning", "project planning".
---

# Planning Skill

A systematic 6-phase approach to creating implementation plans. Leverages upstream skill outputs (pull-figma, api-confirm) and codebase exploration to produce phased, actionable plans for feature-dev.

## Critical Rules

1. **Read upstream outputs first.** Before any exploration, check for existing `design-spec.md`, `development-scope.md`, `api-specification.md`, and `codebase-analysis.md` in the feature workspace.
2. **Don't duplicate exploration.** If pull-figma already ran codebase analysis, use those findings instead of re-exploring the same areas.
3. **Ask clarifying questions.** Never skip Phase 3 — resolve ambiguities before designing phases.
4. **Each phase = 1-2 hours max.** Keep phases small, deliverable, and independently verifiable.

## Workflow Position

```
pull-figma → api-confirm → planning → feature-dev → web-testing
    ↓            ↓             ↓            ↓
design-spec  api-spec.md   plan.md    implementation
dev-scope                  phase-*.md
```

## Input Sources

### From pull-figma (design & codebase context)

| File | What to Extract |
|---|---|
| `design-spec.md` | UI components, screen structure, interactions, data requirements |
| `development-scope.md` | New vs existing vs modified components, effort estimate |
| `codebase-analysis.md` | Existing modules, hooks, services, patterns, file structure |
| `components/*.json` | Individual component details with Briicks mapping |

### From api-confirm (API context)

| File | What to Extract |
|---|---|
| `api-specification.md` | Existing/modify/new APIs, TypeScript interfaces, frontend integration blueprint |
| `api-discovery.md` | API research notes, CURL test results, gap analysis |
| `api-test-responses/*.json` | Actual API response shapes for type definitions |

### From user (requirements context)

- Feature description or task brief
- Constraints, priorities, timeline preferences
- Answers to clarifying questions

## Storage Structure

```
agent-workspace/features/<feature-name>/
├── screenshots/              # (from pull-figma)
├── sections/                 # (from pull-figma)
├── components/               # (from pull-figma)
├── design-spec.md            # (from pull-figma) - INPUT
├── development-scope.md      # (from pull-figma) - INPUT
├── codebase-analysis.md      # (from pull-figma) - INPUT
├── api-discovery.md          # (from api-confirm) - INPUT
├── api-specification.md      # (from api-confirm) - INPUT
├── api-test-responses/       # (from api-confirm) - INPUT
├── plan/                     # THIS SKILL - OUTPUT
│   ├── plan.md               # Main plan with phase tracking
│   ├── phase-1.md
│   ├── phase-2.md
│   ├── phase-N.md
│   └── summaries/            # Phase completion summaries
│       ├── phase-1-summary.md
│       └── ...
└── implementation/           # (from feature-dev) - DOWNSTREAM
```

## The 6 Phases

### Phase 1: Discovery

**Goal**: Understand what needs to be planned by reading all available context.

**Actions**:

1. Create todo list with all 6 phases
2. **Check for upstream outputs**:
   ```
   Read → agent-workspace/features/<feature-name>/design-spec.md
   Read → agent-workspace/features/<feature-name>/development-scope.md
   Read → agent-workspace/features/<feature-name>/api-specification.md
   Read → agent-workspace/features/<feature-name>/codebase-analysis.md
   ```
3. **If upstream outputs exist**: Extract and summarize:
   - UI components to build (from design-spec)
   - New vs reuse vs modify breakdown (from development-scope)
   - API integration requirements (from api-specification)
   - Existing codebase patterns (from codebase-analysis)
4. **If no upstream outputs**: Ask user for requirements:
   - What problem are they solving?
   - What should be accomplished?
   - Any constraints or requirements?
5. Summarize understanding and confirm with user

### Phase 2: Codebase Exploration

**Goal**: Fill gaps in existing knowledge about relevant code and patterns.

**CRITICAL: Check what already exists first.**

If `codebase-analysis.md` from pull-figma already covers the relevant areas, **skip or reduce agent exploration**. Only explore areas NOT already analyzed.

**Actions**:

1. **Review existing analysis** from upstream outputs:
   - `codebase-analysis.md` — existing modules, patterns, file structure
   - `api-specification.md` section E — frontend integration blueprint (API resources, services, hooks)
   - `development-scope.md` — existing components to reuse

2. **Identify gaps** — What's NOT covered by upstream analysis:
   - Routing and page structure for the new feature
   - State management needs (contexts, stores)
   - Shared utilities or helpers needed
   - Testing patterns for similar features
   - i18n patterns for the feature area

3. **Launch exploration agents only for gaps** — Use 1-2 `codebase-analyzer` agents:
   ```
   Task tool → subagent_type: "feature-dev:code-explorer"
   ```
   Focus agents on uncovered areas, not on what pull-figma/api-confirm already analyzed.

4. **Read key files** identified by agents
5. **Present combined findings**: upstream analysis + new exploration

See [agents/codebase-analyzer.md](agents/codebase-analyzer.md) for details.

### Phase 3: Clarifying Questions

**Goal**: Fill gaps and resolve ambiguities before designing phases.

**CRITICAL**: Do not skip this phase.

**Actions**:

1. Review all context: upstream outputs + exploration findings + original task
2. Identify underspecified aspects:
   - **Scope**: Which screens/flows are in scope vs out of scope?
   - **API gaps**: Are backend changes needed before frontend can start? (from api-specification "APIs to Create/Modify" sections)
   - **Component decisions**: For new components in development-scope — build custom or extend existing?
   - **Data flow**: Any complex state management or cross-component communication?
   - **Edge cases**: Empty states, error states, loading states, permissions
   - **i18n**: Any special translation requirements?
   - **Phasing preference**: Ship incrementally or all at once?
3. **Present all questions to user in organized list**
4. **Wait for answers before proceeding**

If user says "whatever you think is best", provide recommendation and get confirmation.

### Phase 4: Plan Design

**Goal**: Design implementation phases informed by all upstream analysis.

**Actions**:

1. Launch 1-2 `plan-architect` agents with different approaches:

   **Agent input must include** (from upstream outputs):
   - Component breakdown from `development-scope.md` (new/reuse/modify)
   - API integration blueprint from `api-specification.md` (existing/modify/new APIs)
   - Codebase patterns from `codebase-analysis.md`
   - User answers from Phase 3

   **Approach options**:
   - **Minimal phases**: Fewest phases, fastest delivery, acceptable trade-offs
   - **Comprehensive**: Thorough coverage, more verification, production-ready quality

2. Review approaches and form recommendation
3. Present to user:
   - Phase summary for each approach
   - Trade-offs comparison
   - **Your recommendation with reasoning**
4. **Ask user which approach they prefer**

See [agents/plan-architect.md](agents/plan-architect.md) for details.

### Phase 5: Plan Output

**Goal**: Create the plan files.

**Actions**:

1. Create plan directory:
   ```bash
   mkdir -p agent-workspace/features/<feature-name>/plan/summaries
   ```

2. Create `phase-{n}.md` for each phase:
   ```markdown
   # Phase {n}: {Name}

   ## Objective
   {What this phase accomplishes}

   ## Prerequisites
   - Phase {n-1} completed (if applicable)
   - Backend APIs available: {list from api-specification if needed}

   ## Tasks

   ### UI Components
   - [ ] Create/modify `src/modules/{feature}/{Component}.tsx`
     - Briicks components: {from design-spec mapping}
     - Props: {from component spec}

   ### API Integration
   - [ ] API Resource: `src/common/api/resources/{domain}Api.ts`
     - Endpoints: {from api-specification section B/C/D}
     - Types: {from api-specification TypeScript interfaces}
   - [ ] Service: `src/services/{domain}Service.ts`
     - Transformations: {form data ↔ DTO}
   - [ ] Hook: `src/hooks/use{Domain}.ts`
     - Query key: `{DOMAIN}_QUERY_KEY`
     - Hooks: {useList, useDetail, useCreate, useUpdate, useDelete}

   ### State & Routing
   - [ ] Route: `src/app/[locale]/(app)/{path}/page.tsx`
   - [ ] Context/state: {if needed}

   ### i18n
   - [ ] Translation keys: `messages/en/{domain}.json`

   ## Files to Create/Modify
   - `path/to/file.ts`: {description of changes}

   ## Verification
   - [ ] Component renders correctly
   - [ ] API calls work with test data
   - [ ] TypeScript compiles without errors
   ```

3. Create `plan.md` with phase tracking:
   ```markdown
   # {Feature Name} Plan

   ## Goal
   {One sentence end state}

   ## Upstream Documents
   - Design spec: `../design-spec.md` (from pull-figma)
   - Development scope: `../development-scope.md` (from pull-figma)
   - API specification: `../api-specification.md` (from api-confirm)
   - Codebase analysis: `../codebase-analysis.md` (from pull-figma)

   ## API Dependencies
   | API | Status | Blocking? |
   |-----|--------|-----------|
   | GET /resource | ✅ Exists | No |
   | POST /resource | ✨ New | Yes — needs backend |
   | PATCH /resource/:id | 🔄 Modify | No — works with current |

   ## Phase Tracking
   | Phase | Name | Status | Description | Summary |
   |-------|------|--------|-------------|---------|
   | 1 | {name} | [ ] | {brief desc} | |
   | 2 | {name} | [ ] | {brief desc} | |

   ## Phase Files
   - [Phase 1: {name}](./phase-1.md)
   - [Phase 2: {name}](./phase-2.md)

   ## Component Breakdown
   | Component | Source | Phase |
   |-----------|--------|-------|
   | {name} | Reuse `ComponentName` | 1 |
   | {name} | New — build | 2 |
   | {name} | Modify `ComponentName` | 2 |

   ## Notes
   {Decisions, constraints, risks identified}
   ```

### Phase 6: Summary

**Goal**: Document the plan and next steps.

**Actions**:

1. Mark planning todos complete
2. Summarize:
   - What was planned
   - Key decisions made
   - Files to create/modify (total count)
   - Backend dependencies (blocking vs non-blocking)
   - Recommended execution order
3. Present plan to user for final approval
4. Note: "Run `feature-dev` to start implementing Phase 1"

## Updating Plan Progress

### After Completing Each Phase (REQUIRED)

1. **Update status in plan.md** — Change `[ ]` to `[x]`:
   ```markdown
   | 1 | Setup | [x] | Database schema | Created 3 tables |
   ```

2. **Create summary** in `summaries/phase-{n}-summary.md`:
   ```markdown
   # Phase {n} Summary

   ## Completed
   - Key accomplishment 1
   - Key accomplishment 2

   ## Files Changed
   - `path/file.ts`

   ## Notes
   {Critical info only}
   ```

3. **Link summary in plan.md**:
   ```markdown
   | 1 | Setup | [x] | Database schema | [summary](./summaries/phase-1-summary.md) |
   ```

## Status Markers

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[!]` Blocked (e.g., waiting for backend API)

## Phase Design Principles

- Each phase: 1-2 hours max
- Deliverable at end of each phase
- Minimize cross-phase dependencies
- Move scope creep to future phases
- Place risky work early
- **API integration phases should follow the 4-layer pattern**: API resource → service → hook → component (per phase, not as separate phases)
- **Backend-blocked work goes last**: If api-specification has "New APIs to Create", plan those phases after phases that use existing APIs

## Typical Phase Patterns

### Feature with existing APIs (common)
1. **Setup**: Routing, page structure, base layout
2. **Data layer**: API resources + services + hooks (from api-specification blueprint)
3. **Core UI**: Main screen components (from design-spec)
4. **Interactions**: Forms, mutations, state management
5. **Polish**: Loading states, error handling, empty states, i18n

### Feature with new backend APIs (needs coordination)
1. **Setup**: Routing, page structure, types/interfaces
2. **Existing API integration**: Hooks for APIs that already exist
3. **UI with mock data**: Build components using existing API data + mock for missing
4. **New API integration**: Connect remaining APIs once backend delivers
5. **Polish**: Full integration testing, edge cases

### Feature with only UI changes
1. **Components**: Build new components from design-spec
2. **Integration**: Wire into existing pages/modules
3. **Polish**: States, i18n, testing

## Integration with Other Skills

```
pull-figma → api-confirm → planning → feature-dev → web-testing
    ↓            ↓             ↓            ↓            ↓
design-spec  api-spec      plan.md    implementation  QA testing
dev-scope                  phase-*.md
codebase-analysis
```

- **pull-figma** provides: design-spec, development-scope, codebase-analysis, component mapping
- **api-confirm** provides: api-specification, api-discovery, test responses
- **planning** produces: plan.md, phase-*.md, summaries/
- **feature-dev** consumes: all of the above to implement each phase

## Documentation (memory skill)

After each phase, use the `memory` skill to document what you built:

| Module Size | Action |
|-------------|--------|
| Single file < 100 lines | Add header comment |
| Folder with 2-3 files | Header comments in each |
| Folder with 4+ files | Create README.md |

## Checklist

- [ ] Upstream outputs checked (design-spec, dev-scope, api-spec, codebase-analysis)
- [ ] Gaps identified and explored with agents (only for uncovered areas)
- [ ] Clarifying questions asked and answered
- [ ] Phase approach chosen with user
- [ ] All phase files created with API integration details
- [ ] plan.md created with upstream document links and API dependencies table
- [ ] Backend-blocking dependencies clearly marked
- [ ] Status updated after each phase completion
- [ ] Summary file created per completed phase
