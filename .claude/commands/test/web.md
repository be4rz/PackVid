---
description: Test web application features using Chrome DevTools MCP with parallel sub-agents and automated bug fixing.
argument-hint: [feature or page to test]
---

Invoke the `web-test` skill to test the following:

<prompt>$ARGUMENTS</prompt>

Follow all 5 phases defined in the skill:
1. Setup & Exploration - Verify MCP and understand feature implementation
2. Test Planning - Design test scenarios with test-case-designer agent
3. Test Execution - Run tests via browser-tester sub-agents (sequentially)
4. Bug Fixing Loop - Analyze failures and fix with feature-dev
5. Summary & Ship - Generate final test report

Prerequisites: Chrome DevTools MCP must be installed (`claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest`).
All browser interactions happen in `general-purpose` sub-agents, not the main agent.
