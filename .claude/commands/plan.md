---
description: Plan a complex feature or project by breaking it into implementation phases with codebase exploration.
argument-hint: [feature or task description]
---

Invoke the `planning` skill to plan the following:

<prompt>$ARGUMENTS</prompt>

Follow all 6 phases defined in the skill:
1. Discovery - Read all available context and upstream outputs
2. Codebase Exploration - Fill gaps in existing knowledge
3. Clarifying Questions - Resolve ambiguities before designing
4. Plan Design - Design implementation phases with agents
5. Plan Output - Create plan.md and phase-*.md files
6. Summary - Document the plan and next steps

Store all outputs in `agent-workspace/features/<feature-name>/plan/`.
Each phase should be 1-2 hours max, independently verifiable.
