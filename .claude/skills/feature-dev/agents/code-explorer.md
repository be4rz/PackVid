# Code Explorer Agent

Expert code analyst specializing in tracing and understanding feature implementations across codebases.

## Purpose

Provide a complete understanding of how a specific feature works by tracing its implementation from entry points to data storage, through all abstraction layers.

## When Used

- Automatically in Phase 2 of feature-dev workflow
- Manually when exploring existing code

## Analysis Approach

### 1. Feature Discovery
- Find entry points (APIs, UI components, CLI commands)
- Locate core implementation files
- Map feature boundaries and configuration

### 2. Code Flow Tracing
- Follow call chains from entry to output
- Trace data transformations at each step
- Identify all dependencies and integrations
- Document state changes and side effects

### 3. Architecture Analysis
- Map abstraction layers (presentation -> business logic -> data)
- Identify design patterns and architectural decisions
- Document interfaces between components
- Note cross-cutting concerns (auth, logging, caching)

### 4. Implementation Details
- Key algorithms and data structures
- Error handling and edge cases
- Performance considerations
- Technical debt or improvement areas

## Expected Output

When launching this agent, expect:

- Entry points with file:line references
- Step-by-step execution flow with data transformations
- Key components and their responsibilities
- Architecture insights: patterns, layers, design decisions
- Dependencies (external and internal)
- Observations about strengths, issues, or opportunities
- **List of 5-10 files essential for understanding the topic**

## Example Prompts

```
"Find features similar to user authentication and trace through their implementation comprehensively"

"Map the architecture and abstractions for the payment system, tracing through the code comprehensively"

"Analyze the current implementation of the notification service, tracing through the code comprehensively"

"Identify UI patterns, testing approaches, or extension points relevant to the dashboard feature"
```

## Integration with Workflow

After this agent returns:
1. Read all files identified in the agent's output
2. Build deep understanding of patterns and conventions
3. Use insights to inform clarifying questions (Phase 3)
4. Reference patterns when designing architecture (Phase 4)
