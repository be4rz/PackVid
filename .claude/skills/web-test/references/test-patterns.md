# Test Patterns Reference

Common test patterns for Chrome DevTools MCP testing.

## Navigation Patterns

### Basic Navigation
```
navigate_page(url="http://localhost:3000/login")
take_snapshot()  # Get element UIDs
```

### Wait for Page Load
```
navigate_page(url="http://localhost:3000")
wait_for(text="Welcome")  # Wait for specific text
```

### Navigate After Action
```
click(uid="submit-btn")
wait_for(text="Dashboard")  # Wait for navigation
take_snapshot()  # Get new page UIDs
```

## Form Testing Patterns

### Fill and Submit
```
take_snapshot()
fill(uid="email-input", value="test@example.com")
fill(uid="password-input", value="password123")
click(uid="submit-btn")
wait_for(text="Success")
```

### Fill Multiple Fields
```
fill_form(elements=[
  {"uid": "name", "value": "John Doe"},
  {"uid": "email", "value": "john@example.com"},
  {"uid": "phone", "value": "555-1234"}
])
```

### Validation Error Testing
```
fill(uid="email", value="invalid-email")
click(uid="submit")
wait_for(text="Invalid email")  # Check error appears
```

## Verification Patterns

### Text Verification (Preferred)
```
# Use wait_for instead of snapshot when possible
wait_for(text="Successfully saved")
```

### Element State Check
```
take_snapshot()
# Look for element in snapshot with expected state
```

### Console Error Check
```
list_console_messages(types=["error"])
# Check for JavaScript errors
```

### Network Request Verification
```
list_network_requests(resourceTypes=["fetch", "xhr"])
# Verify API calls were made
```

## Error Handling Patterns

### Screenshot on Failure
```
# When test fails
take_screenshot(filePath="./results/screenshots/tc-001-fail.png")
list_console_messages()  # Capture errors
```

### Retry Pattern
```
# First attempt
click(uid="button")
# If timeout, take snapshot and retry
take_snapshot()
click(uid="button")  # Retry with fresh UID
```

## Performance Patterns

### Basic Performance Trace
```
performance_start_trace(reload=true, autoStop=true)
# Wait for trace to complete
performance_analyze_insight(insightSetId="0", insightName="LCPBreakdown")
```

### Core Web Vitals
```
performance_start_trace(reload=true, autoStop=true)
# Analyze:
# - LCPBreakdown (Largest Contentful Paint)
# - DocumentLatency
# - RenderBlocking
# - SlowCSS
```

## Context-Saving Best Practices

1. **Minimize snapshots**: Only take when you need new UIDs
2. **Use wait_for**: Instead of snapshot to verify text
3. **Save screenshots to files**: Not inline
4. **Batch actions**: Multiple actions between snapshots
5. **Report at end**: Collect results, summarize once

## Common Test Scenarios

### Login Flow
```
navigate_page(url="http://localhost:3000/login")
take_snapshot()
fill(uid="email", value="user@test.com")
fill(uid="password", value="Test123!")
click(uid="login-btn")
wait_for(text="Dashboard")
list_console_messages(types=["error"])  # Check no errors
```

### Form Validation
```
navigate_page(url="http://localhost:3000/signup")
take_snapshot()
click(uid="submit-btn")  # Submit empty form
wait_for(text="required")  # Check validation message
fill(uid="email", value="bad")
click(uid="submit-btn")
wait_for(text="Invalid email")
```

### CRUD Operations
```
# Create
navigate_page(url="http://localhost:3000/items/new")
take_snapshot()
fill(uid="name", value="Test Item")
click(uid="save-btn")
wait_for(text="Created successfully")

# Read
navigate_page(url="http://localhost:3000/items")
wait_for(text="Test Item")

# Update
click(uid="edit-btn")
take_snapshot()
fill(uid="name", value="Updated Item")
click(uid="save-btn")
wait_for(text="Updated successfully")

# Delete
click(uid="delete-btn")
handle_dialog(action="accept")
wait_for(text="Deleted")
```

### Modal/Dialog Testing
```
click(uid="open-modal-btn")
wait_for(text="Modal Title")
take_snapshot()  # Get modal element UIDs
click(uid="modal-close-btn")
# Verify modal closed (element should not be in next snapshot)
```

### Responsive Testing
```
resize_page(width=375, height=667)  # Mobile
take_snapshot()
# Verify mobile layout

resize_page(width=1920, height=1080)  # Desktop
take_snapshot()
# Verify desktop layout
```
