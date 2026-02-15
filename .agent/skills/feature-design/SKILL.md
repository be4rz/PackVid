---
name: feature-design
description: Design software features from a product owner perspective with market research, user analysis, and business strategy. Use when starting a new feature, analyzing market fit, defining product strategy, creating user personas, drawing business flows, or planning go-to-market. Triggers on "feature design", "market analysis", "competitive analysis", "user personas", "product strategy", "go-to-market", "user journey", "value proposition".
---

# Feature Design Skill

Design software features from a product owner perspective. Analyze market, understand users, define value proposition, and create user stories—all before implementation planning.

## When to Use

- Starting a new feature or product
- Analyzing product-market fit
- Defining product strategy
- Creating user personas and journeys
- Planning go-to-market strategy

## When NOT to Use

- Implementation planning (use `planning` skill)
- Technical architecture (use `feature-dev` skill)
- Simple bug fixes or enhancements

## Core Principles

- **Research first**: Use `search_web` and `read_url_content` for market research
- **User-centric**: Ground decisions in user needs
- **Business-aware**: Consider positioning and strategy
- **Visual communication**: Use `mermaidjs-v11` skill for diagrams
- **Checkpoint with user**: Use `notify_user` at every phase gate

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `mermaidjs-v11` | Create business flows, user journeys, sequence diagrams |
| `planning` | After design approved, create implementation phases |
| `feature-dev` | Implement the designed feature |
| `ui-ux-pro-max` | Design system, color palettes, typography |

## Storage Structure

```
.agent/features/{feature-name}/
├── design/                      # THIS SKILL
│   ├── overview.md              # Hub file (links to all docs)
│   ├── market/
│   │   ├── analysis.md          # Market size, trends, opportunities
│   │   ├── competitors.md       # Competitive analysis matrix
│   │   └── positioning.md       # Product positioning, differentiation
│   ├── users/
│   │   ├── personas.md          # Target user personas
│   │   └── journeys.md          # User journey maps (mermaid)
│   ├── product/
│   │   ├── problem-statement.md # Problem, goals, non-goals
│   │   ├── value-proposition.md # Value prop, benefits, differentiation
│   │   └── business-flows.md    # Business flow diagrams (mermaid)
│   ├── stories/
│   │   ├── epic-1-{name}.md     # User stories per epic
│   │   └── ...
│   └── go-to-market/
│       ├── strategy.md          # Launch strategy, channels
│       └── messaging.md         # Key messages, positioning
├── plan/                        # From planning skill
└── implementation/              # From feature-dev skill
```

## The 7 Phases

### Phase 1: Discovery

**Goal**: Understand the feature idea

1. Update `task.md` with all phases
2. Ask user for initial context via `notify_user`:
   - What is the feature/product idea?
   - What problem does it solve?
   - Who is the target audience?
   - Any constraints or requirements?
3. Summarize understanding and confirm

### Phase 2: Market Research

**Goal**: Understand market landscape and competition

1. Use `search_web` to research:
   - Market size and trends
   - Competitors and their offerings
   - Market gaps and opportunities
   - Positioning angles
2. Use `read_url_content` to extract details from key sources
3. Present findings via `notify_user`:
   - Market overview
   - Competitor matrix
   - Opportunity analysis
4. Ask if any areas need deeper research

### Phase 3: User Research

**Goal**: Understand target users deeply

1. Research user needs using web search:
   - Define user segments
   - Create detailed personas
   - Identify needs and pain points
   - Map user behavior patterns
2. Present findings via `notify_user`:
   - Primary and secondary personas
   - Needs matrix
   - Pain points to address
3. Confirm personas with user

### Phase 4: Product Definition

**Goal**: Define problem, solution, and value proposition

1. Create `product/problem-statement.md`:
   - Problem description
   - Target users (reference personas)
   - Goals and non-goals
   - Success criteria
2. Create `product/value-proposition.md`:
   - Core value proposition
   - Key benefits
   - Differentiation from competitors
   - Why now (timing)
3. Present and get user approval via `notify_user`

### Phase 5: Business Flows

**Goal**: Visualize key business processes

1. Identify key flows to diagram:
   - User journey (end-to-end)
   - Core feature flow
   - Decision points
   - Integration touchpoints
2. Create diagrams using `mermaidjs-v11` skill:
   ```mermaid
   journey
       title User Journey: Feature Name
       section Discovery
         Find feature: 5: User
       section Usage
         Complete task: 5: User
   ```
3. Document in `product/business-flows.md` and `users/journeys.md`
4. Review diagrams with user via `notify_user`

### Phase 6: User Stories

**Goal**: Break feature into implementable stories

1. Group functionality into epics
2. Create `stories/epic-{n}-{name}.md` for each:

   ```markdown
   # Epic {n}: {Name}

   ## Summary
   {What this epic delivers}

   ## User Stories

   ### Story 1: {Title}
   **As a** {persona}
   **I want to** {action}
   **So that** {benefit}

   **Acceptance Criteria**:
   - [ ] Criterion 1
   - [ ] Criterion 2

   ## Dependencies
   - {Other epics or external}
   ```

3. Present epic breakdown for approval via `notify_user`

### Phase 7: Go-to-Market

**Goal**: Plan launch and marketing strategy

1. Create `go-to-market/strategy.md`:
   - Launch approach (soft/hard launch)
   - Target channels
   - Timeline milestones
   - Success metrics
2. Create `go-to-market/messaging.md`:
   - Key messages by audience
   - Positioning statement
   - Taglines and hooks
3. Create `overview.md` hub linking all documents
4. Present complete design for final approval via `notify_user`

## Integration Flow

```
feature-design → planning → feature-dev
(what & why)    (how)      (build)
     ↓              ↓            ↓
  design/        plan/     implementation/
```
