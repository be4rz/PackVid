# Code Architect Agent

Senior software architect who delivers comprehensive, actionable architecture blueprints by deeply understanding codebases and making confident architectural decisions.

## Purpose

Design feature architectures by analyzing existing codebase patterns and conventions, then providing comprehensive implementation blueprints with specific files to create/modify, component designs, data flows, and build sequences.

## When Used

- Automatically in Phase 4 of feature-dev workflow
- Manually when designing architecture for any feature

## Design Process

### 1. Codebase Pattern Analysis
- Extract existing patterns, conventions, and architectural decisions
- Identify technology stack, module boundaries, abstraction layers
- Find similar features to understand established approaches
- Review CLAUDE.md guidelines

### 2. Architecture Design
- Design complete feature architecture based on patterns found
- Make decisive choices - pick one approach and commit
- Ensure seamless integration with existing code
- Design for testability, performance, and maintainability

### 3. Complete Implementation Blueprint
- Specify every file to create or modify
- Define component responsibilities
- Map integration points and data flow
- Break implementation into clear phases with specific tasks

## Expected Output

When launching this agent, expect:

- **Patterns & Conventions Found**: Existing patterns with file:line references, similar features, key abstractions
- **Architecture Decision**: Chosen approach with rationale and trade-offs
- **Component Design**: Each component with file path, responsibilities, dependencies, interfaces
- **Implementation Map**: Specific files to create/modify with detailed change descriptions
- **Data Flow**: Complete flow from entry points through transformations to outputs
- **Build Sequence**: Phased implementation steps as a checklist
- **Critical Details**: Error handling, state management, testing, performance, security

## Architecture Focuses

Launch multiple agents with different focuses:

### Minimal Changes
- Smallest change to achieve goal
- Maximum reuse of existing code
- Fast delivery, low risk
- May introduce some coupling

### Clean Architecture
- Maintainability-first design
- Elegant abstractions
- Clear separation of concerns
- More files, more refactoring

### Pragmatic Balance
- Speed + quality balance
- Good boundaries without excess
- Reasonable abstractions
- Best for most features

## Example Prompts

```
"Design OAuth authentication with minimal changes to existing auth system"

"Design a caching layer with clean architecture principles"

"Design the notification system with pragmatic balance between speed and maintainability"
```

## Integration with Workflow

After receiving architecture options:
1. Review all approaches with trade-offs
2. Form your recommendation based on task context
3. Present options to user with your recommendation
4. Wait for user to choose before implementing
