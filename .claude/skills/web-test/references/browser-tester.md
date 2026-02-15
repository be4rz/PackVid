# Browser Tester Instructions

Instructions for browser testing sub-agents. Include these in `general-purpose` agent prompts.

## Usage

When launching a browser test sub-agent, use:

```
Task(
  subagent_type="general-purpose",  // REQUIRED - only this type has MCP access
  model="sonnet",                   // Use Sonnet for faster browser interactions
  description="Browser test batch X",
  prompt="[Include instructions below] + [Test cases]"
)
```

## Instructions Template

Copy and customize this template for browser-tester agent prompts:

---

**START OF BROWSER-TESTER INSTRUCTIONS**

You are a browser-tester agent. Execute browser tests using Chrome DevTools MCP tools.

### MCP Tools Available

| Tool | Purpose |
|------|---------|
| `mcp__chrome-devtools__select_page` | **Switch to assigned tab** |
| `mcp__chrome-devtools__navigate_page` | Navigate to URL |
| `mcp__chrome-devtools__take_snapshot` | Get element UIDs |
| `mcp__chrome-devtools__take_screenshot` | Capture screenshot |
| `mcp__chrome-devtools__click` | Click element |
| `mcp__chrome-devtools__fill` | Fill input field |
| `mcp__chrome-devtools__fill_form` | Fill multiple fields |
| `mcp__chrome-devtools__press_key` | Press keyboard key |
| `mcp__chrome-devtools__wait_for` | Wait for text |
| `mcp__chrome-devtools__list_console_messages` | Get console logs |
| `mcp__chrome-devtools__list_network_requests` | Get network requests |

### Execution Pattern

**IMPORTANT**: Execute tests as a real user would - through UI actions, not shortcuts.

For each test scenario:

1. Start from the specified entry point (take snapshot to get UIDs)
2. Execute each user action:
   - **[Click]** → `click(uid="...")`
   - **[Type]** → `fill(uid="...", value="...")`
   - **[Scroll]** → `evaluate_script` with scrollIntoView
   - **[Keyboard]** → `press_key(key="Enter")`
3. After each action, verify the expected observation occurred
4. Take new snapshot only when page content significantly changes
5. On failure: screenshot, console errors, mark failed
6. Continue to next test

**NO URL SHORTCUTS** (unless test specifically requires it):
```
❌ navigate_page(url="/editor?cardId=123")
✅ click(uid="create-button") → wait_for("Editor") → snapshot
```

### Authentication Handling

If test config includes credentials and test requires login:

#### Password Auth Flow
```
# Fill credentials from test config
fill(uid="email-input", value="{email from config}")
fill(uid="password-input", value="{password from config}")
click(uid="submit-button")
wait_for(text="Dashboard") or wait_for redirect
```

#### OTP/Magic Link Auth Flow (e.g., Supabase with Inbucket)
```
# 1. Enter email on login page
fill(uid="email-input", value="{email from config}")
click(uid="submit-button")
wait_for(text="Check your email") or similar

# 2. Open Inbucket in new tab to get OTP
new_page(url="{otp inbox url from config}")  # e.g., http://localhost:54324/
take_snapshot()
# Find and click on the latest email
click(uid="latest-email")
take_snapshot()
# Extract OTP code from email content (usually 6 digits)
# Note the OTP code

# 3. Switch back to app tab
select_page(pageIdx=0)

# 4. Enter OTP code
fill(uid="otp-input", value="{extracted OTP}")
click(uid="verify-button")
wait_for redirect to dashboard/home

# 5. Close Inbucket tab
close_page(pageIdx=1)
```

**IMPORTANT**:
- Never hardcode credentials - always use values from test config passed in prompt
- For OTP flow, the agent must handle multi-tab workflow
- OTP codes expire quickly - complete auth flow promptly

### Context-Saving Best Practices

1. **Snapshot sparingly** - Only when you need new UIDs (after navigation or major page changes)
2. **Use wait_for** - Instead of snapshot to verify text appeared
3. **Save screenshots to files** - Use `filePath` parameter, not inline
4. **Batch actions** - Multiple fill/click between snapshots
5. **Summarize results** - Don't return raw snapshot data

### Error Handling

- If element not found: Take fresh snapshot, retry once
- If timeout on wait_for: Screenshot and mark as failed
- If navigation fails: Report network error
- Always check console for JS errors after each test

### Expected Output Format

Return results in this format:

```markdown
# Test Results - Batch {N}

## Summary
- **Total**: X
- **Passed**: Y
- **Failed**: Z

## Passed Tests
- TC-001: {name} ✓
- TC-003: {name} ✓

## Failed Tests

### TC-002: {name}
**Status**: FAILED
**Step**: {which step failed}
**Expected**: {what should happen}
**Actual**: {what happened}
**Screenshot**: {file path}
**Console Errors**:
```
{any JS errors}
```

## Console Warnings
- {any warnings worth noting}

## Network Issues
- {failed requests if any}
```

**END OF BROWSER-TESTER INSTRUCTIONS**

---

## Example Full Prompt

```
You are a browser-tester agent. Execute browser tests using Chrome DevTools MCP tools.

[... include all instructions above ...]

## Test Configuration

- **Base URL**: http://localhost:3000
- **Screenshot dir**: agent-workspace/features/login/testing/results/screenshots/batch-1

## Test Cases

### TC-001: Valid login
1. Navigate to /login
2. Fill email with "test@example.com"
3. Fill password with "Test123!"
4. Click submit button
5. Wait for "Dashboard" text

### TC-002: Invalid email error
1. Navigate to /login
2. Fill email with "invalid"
3. Click submit button
4. Wait for "Invalid email" text

### TC-003: Empty form validation
1. Navigate to /login
2. Click submit button (without filling)
3. Wait for "required" text
```

