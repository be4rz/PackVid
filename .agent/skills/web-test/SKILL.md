---
name: web-test
description: Test web applications using the browser sub-agent with automated bug fixing. Use after feature-dev to verify implementations, run QA testing, or ship bug-free features. Triggers on "test feature", "web test", "e2e test", "browser test", "verify implementation", "QA testing".
---

# Web Test Skill

Test web applications using Antigravity's `browser_subagent`. Integrates with `feature-dev` for bug fixing.

## When to Use

- After `feature-dev` to verify implementation
- Testing user stories and acceptance criteria
- E2E testing of web features
- QA validation before shipping
- Debugging UI issues

## When NOT to Use

- Unit testing (use jest/vitest directly)
- API testing without UI
- Testing native Electron features (menus, system tray, etc.)

## Core Principles

- **Explore first**: Understand feature implementation before testing
- **Test via browser_subagent**: All browser interactions go through `browser_subagent`
- **Fix with feature-dev**: Don't just report bugs, fix them
- **Confirm with user**: Get approval before fixes via `notify_user`

## The 5 Phases

### Phase 1: Setup & Exploration

**Goal**: Verify dev server and understand feature implementation

1. Update `task.md` with all phases
2. Ensure dev server is running:
   ```bash
   npm run dev
   ```
3. Explore feature implementation:
   - `grep_search` for relevant components and logic
   - `view_file_outline` on key files
   - Understand state management and data flow
4. Summarize findings

### Phase 2: Test Planning

**Goal**: Design test scenarios

1. Based on codebase exploration, design test cases:
   - Happy path scenarios
   - Error/edge cases
   - Validation checks
   - Responsive design checks
   - Accessibility checks

2. Document scenarios:
   ```markdown
   ## Test Scenarios

   ### TC-001: {Title}
   **Steps**: Navigate to X → Click Y → Verify Z
   **Expected**: {outcome}

   ### TC-002: {Title}
   **Steps**: ...
   **Expected**: ...
   ```

3. Present test plan via `notify_user` for approval

### Phase 3: Test Execution

**Goal**: Run tests using browser sub-agent

Use `browser_subagent` for each test scenario:

```
browser_subagent(
  TaskName="Testing TC-001 Login Flow",
  Task="Navigate to http://localhost:5173. 
        1. Click the login button
        2. Enter test@example.com in email field
        3. Enter password123 in password field
        4. Click submit
        5. Verify the dashboard page loads
        Return: PASS/FAIL with details",
  RecordingName="tc_001_login"
)
```

**Key guidelines**:
- One `browser_subagent` call per test case (or small batch)
- Give clear, specific instructions with exact selectors or text
- Always specify what to verify and what to return
- Use descriptive `RecordingName` for video artifacts

After each batch, review results and document:
- PASS/FAIL status
- Screenshots/recordings captured
- Any unexpected behavior

### Phase 4: Bug Fixing Loop

**Goal**: Fix issues found during testing

For each failed test:

1. Analyze the failure:
   - What was expected vs actual?
   - Check console errors via browser_subagent
   - Trace the code path
2. Present findings via `notify_user`:
   - "Test X failed because Y"
   - "Suggested fix: Z"
   - "Should I fix this?"
3. If approved, fix the bug:
   - Use `feature-dev` skill approach for complex fixes
   - Direct edit for simple fixes
4. Re-run failed test to verify fix
5. Repeat until all tests pass

### Phase 5: Summary & Ship

**Goal**: Document results and confirm ready to ship

1. Mark all tasks complete in `task.md`
2. Create test report:
   ```markdown
   # Test Results

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
3. Present summary via `notify_user`
4. Recommend next steps (commit via `/git-commit`, additional testing)

## Related Skills

| Phase | Skill | Purpose |
|-------|-------|---------|
| 1 | `feature-dev` | Code exploration patterns |
| 4 | `feature-dev` | Bug fix implementation |
| 5 | `git-commit` | Commit and push changes |

## PackVid-Specific Notes

- Dev server runs on `http://localhost:5173` (Vite default)
- Electron window wraps the Vite dev server in development
- Test the web UI through the browser, not the Electron window
- IPC-dependent features may need manual testing in the Electron app
