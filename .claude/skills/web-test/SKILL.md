---
name: web-test
description: Test web applications using Chrome DevTools MCP with parallel sub-agents and automated bug fixing. Use after feature-dev to verify implementations, run QA testing, or ship bug-free features. Triggers on "test feature", "web test", "e2e test", "browser test", "verify implementation", "QA testing".
---

# Web Test Skill

Test web applications using Chrome DevTools MCP. Uses sub-agents for parallel testing and integrates with `feature-dev` for bug fixing.

## When to Use

- After `feature-dev` to verify implementation
- Testing user stories and acceptance criteria
- E2E testing of web features
- QA validation before shipping
- Debugging UI issues

## When NOT to Use

- Unit testing (use jest/vitest)
- API testing without UI (use API tools)
- Non-web applications

## Prerequisites

Chrome DevTools MCP must be installed:

```bash
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
claude mcp list  # verify
```

See [references/setup.md](references/setup.md) for manual installation and options.

## Core Principles

- **Check memory first**: Before exploration, search memory for existing feature knowledge
- **Explore first**: Understand feature implementation before testing
- **Store findings in memory**: After exploration, store valuable discoveries
- **Test via sub-agents**: All browser interactions happen in `general-purpose` sub-agents, NOT the main agent
- **Fix with feature-dev**: Don't just report bugs, fix them
- **Confirm with human**: Get approval before fixes

## The 5 Phases

### Phase 1: Setup & Exploration

**Goal**: Verify MCP and understand feature implementation

**CRITICAL: Check Memory First**

Before launching explore agents, use the `memory` skill to search for existing knowledge. If sufficient context exists, skip or reduce agent exploration.

**Actions**:

1. Create todo list with all phases
2. **Check memory** for existing feature knowledge (see above)
3. Verify MCP is available:
   ```
   mcp__chrome-devtools__list_pages
   ```
4. Launch `code-explorer` agents to understand:
   - Feature implementation
   - Relevant UI components
   - State management approach
   - API/data flow
5. Read key files identified by agents
6. **Store valuable discoveries in memory**: Use the `memory` skill to document findings in the codebase
7. Summarize findings

### Phase 2: Test Planning

**Goal**: Design test scenarios and configure test environment

**Actions**:

1. **Read test configs** (REQUIRED - will be passed to all agents):

   **Priority order** (merge configs, later overrides earlier):
   ```bash
   # 1. Global project config (base settings)
   cat ./global-test-config.md 2>/dev/null

   # 2. Feature-specific config (overrides)
   cat agent-workspace/test-config.md 2>/dev/null
   ```

   **Expected global-test-config.md format**:
   ```markdown
   # Global Test Configuration

   ## URL
   http://localhost:3000

   ## Test User (if auth needed)
   - email: test@example.com
   - password: TestPassword123
   # OR for OTP/magic link:
   - email: test@example.com
   - get otp in: http://localhost:54324/

   ## Viewport
   - iPhone 14 Pro Max
   ```

2. **If no config or missing credentials**, ask user for:
   - Base URL to test
   - Test user credentials (email/password OR email/OTP location)
   - Any special setup instructions

   Then create `./global-test-config.md` for project-wide settings.

3. **Determine auth flow type**:
   - **Password auth**: Fill email → Fill password → Submit
   - **OTP/Magic link auth**: Fill email → Submit → Get OTP from Inbucket → Enter OTP

3. **Create test directory**:
   ```bash
   mkdir -p agent-workspace/features/{feature}/testing/results/screenshots
   ```

4. **Launch test-case-designer agent** with:
   - Feature requirements
   - Codebase patterns discovered
   - User flows to validate
   - **Test config contents** (for auth-aware test design)

5. **Save scenarios** to `testing/scenarios.md`

6. **Present test plan for user approval**

See [agents/test-case-designer.md](agents/test-case-designer.md) for details.

### Phase 3: Test Execution

**Goal**: Run tests using sub-agents

**CRITICAL**: The main agent must NOT use Chrome DevTools MCP directly. All browser interactions happen in `general-purpose` sub-agents.

**Why sub-agents?**
- Chrome DevTools snapshots are verbose (full accessibility tree) - sub-agents keep main context clean
- Only `general-purpose` agent type has access to MCP tools (`mcp__chrome-devtools__*`)
- Isolates browser state from main conversation

#### Actions

1. **Create screenshot directories**:
   ```bash
   mkdir -p agent-workspace/features/{feature}/testing/results/screenshots/batch-{1,2,3}
   ```

2. **Launch browser-tester agents sequentially** with test config:

   ```
   # IMPORTANT: Always include test config and browser-tester instructions in prompts!
   # See references/browser-tester.md for full instructions template

   # Batch 1
   Task(
     subagent_type="general-purpose",
     model="sonnet",  # Use Sonnet for faster browser interactions
     description="Browser test batch 1",
     prompt="You are a browser-tester. Execute browser tests using Chrome DevTools MCP tools.

             [Include instructions from references/browser-tester.md]

             ## Test Configuration (from test-config.md)
             - Base URL: http://localhost:3000
             - Test Account: test@example.com / TestPassword123
             - Auth Flow: /sign-in → Fill email → Fill password → Click submit

             ## Test Cases
             TC-001, TC-002, TC-003

             ## Screenshot Directory
             agent-workspace/features/{feature}/testing/results/screenshots/batch-1/

             ## Auth Instructions
             If test requires login, perform auth flow FIRST before proceeding."
   )
   # Wait for completion before launching next batch
   ```

3. **Launch subsequent batches** after previous completes

4. **Merge results** from all batches

5. **Save results** to `testing/results/run-{date}.md`

See [references/browser-tester.md](references/browser-tester.md) for complete browser-tester instructions to include in prompts.

### Phase 4: Bug Fixing Loop

**Goal**: Fix issues found during testing using `feature-dev`

**Actions**:

For each failed test:

1. Launch `issue-analyzer` agent with:
   - Test scenario that failed
   - Error details (console, screenshot)
   - Expected vs actual behavior

2. Agent returns:
   - Root cause analysis
   - Affected files with line numbers
   - Suggested fix approach

3. **Present findings to user**:
   - "Test X failed because Y"
   - "Suggested fix: Z"
   - "Should I fix this?"

4. If user approves, **invoke `feature-dev` skill** to implement fix:
   - Pass root cause and affected files to feature-dev
   - feature-dev handles exploration, architecture, implementation
   - Skip feature-dev's quality review (we'll re-test in browser)

5. Re-run failed test to verify fix

6. Repeat until all tests pass

See [agents/issue-analyzer.md](agents/issue-analyzer.md) for details.

### Phase 5: Summary & Ship

**Goal**: Document and confirm ready to ship

**Actions**:

1. Mark all todos complete
2. Generate final test report in `testing/results/run-{date}.md`:
   ```markdown
   # Test Run: {date}

   ## Summary
   - Passed: X/Y
   - Fixed during QA: Z issues

   ## Issues Fixed
   | Issue | Root Cause | Fix |
   |-------|------------|-----|
   | ... | ... | ... |

   ## Quality Checklist
   - [ ] Happy path works
   - [ ] Error states handled
   - [ ] No console errors
   - [ ] Responsive design verified
   ```

3. Present summary to user
4. Recommend next steps (commit, PR, additional testing)

## Related Skills

| Phase | Skill | Purpose |
|-------|-------|---------|
| 1 | feature-dev | Code exploration agents |
| 4 | feature-dev | Bug fix implementation |

## References

- [references/browser-tester.md](references/browser-tester.md) - Browser testing instructions (for general-purpose agent prompts)
- [references/setup.md](references/setup.md) - Chrome DevTools MCP setup
- [references/test-patterns.md](references/test-patterns.md) - Common test patterns
- [references/ui-ux-checklist.md](references/ui-ux-checklist.md) - Quality checklist

## Agents

- [agents/test-case-designer.md](agents/test-case-designer.md) - Test case generation
- [agents/issue-analyzer.md](agents/issue-analyzer.md) - Bug analysis and fix suggestions

## Example Usage

```
User: Test the login feature

Claude: [Phase 1] Checking MCP and exploring feature...
        ✓ MCP available
        Launching code-explorer...

        Found: LoginForm at modules/auth/components/,
        useLogin hook at modules/auth/hooks/

Claude: [Phase 2] Designing test cases...

        Test Scenarios:
        - TC-001: Valid login succeeds
        - TC-002: Invalid email shows error
        - TC-003: Empty fields show validation

        Approve?

User: Yes

Claude: [Phase 3] Launching browser-tester sub-agents sequentially...

        Batch 1: TC-001, TC-002 → completed
        Batch 2: TC-003 → completed

        Results:
        - TC-001: ✓ Passed
        - TC-002: ✗ Failed - Error message not showing
        - TC-003: ✓ Passed

Claude: [Phase 4] Analyzing failure...

        Root cause: Error state not connected to form
        Affected: LoginForm.tsx:45

        Should I fix this with feature-dev?

User: Yes

Claude: Invoking feature-dev...
        [Fixes the issue]

        Re-testing TC-002...
        TC-002: ✓ Passed

Claude: [Phase 5] Summary:
        - All 3 tests passing
        - 1 bug fixed during QA
        - Ready to ship!
```
