# UI/UX Quality Checklist

Use this checklist during Phase 4 (Browser Testing) to verify UI/UX quality.

## Visual Quality

### Layout
- [ ] Elements align properly (no visual misalignment)
- [ ] Spacing is consistent with design system
- [ ] No overlapping elements
- [ ] Content doesn't overflow containers

### Typography
- [ ] Text is readable (appropriate size and contrast)
- [ ] Font weights are correct (headings vs body)
- [ ] No text truncation issues
- [ ] Line heights are comfortable

### Colors
- [ ] Colors match design system tokens
- [ ] Sufficient contrast (WCAG AA minimum)
- [ ] Hover/focus states are visible
- [ ] Error states use appropriate colors (red)
- [ ] Success states use appropriate colors (green)

## Interaction Quality

### Feedback
- [ ] Buttons show loading state during async operations
- [ ] Success/error messages appear after actions
- [ ] Form validation errors are clear and specific
- [ ] Hover states indicate clickable elements

### Navigation
- [ ] Links navigate to correct destinations
- [ ] Back button works as expected
- [ ] No dead-end pages
- [ ] Current location is indicated (active nav items)

### Forms
- [ ] Tab order is logical
- [ ] Labels are associated with inputs
- [ ] Placeholder text is helpful (not replacing labels)
- [ ] Submit button is disabled during submission
- [ ] Error focus moves to first invalid field

## Responsive Design

### Mobile (375px width)
- [ ] Content is readable without horizontal scroll
- [ ] Touch targets are at least 44x44px
- [ ] Navigation is accessible (hamburger menu works)
- [ ] Forms are usable on small screens

### Tablet (768px width)
- [ ] Layout adapts appropriately
- [ ] No awkward spacing or alignment

### Desktop (1920px width)
- [ ] Content doesn't stretch too wide
- [ ] Layout uses space effectively
- [ ] Multi-column layouts work correctly

## Accessibility

### Keyboard Navigation
- [ ] All interactive elements are focusable
- [ ] Focus order is logical
- [ ] Focus indicator is visible
- [ ] No keyboard traps

### Screen Reader
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] Heading hierarchy is correct (h1, h2, h3...)

### Motion & Animation
- [ ] Animations can be disabled (prefers-reduced-motion)
- [ ] No flashing content (seizure risk)
- [ ] Transitions are smooth (not jarring)

## Performance

### Loading States
- [ ] Initial load shows skeleton/spinner
- [ ] No layout shift when content loads
- [ ] Images load progressively or show placeholder

### Responsiveness
- [ ] Interactions feel instant (<100ms)
- [ ] No visible lag on clicks/typing
- [ ] Scrolling is smooth

## Error Handling

### User Errors
- [ ] Invalid input shows clear error message
- [ ] User can correct mistakes easily
- [ ] Partial form data is preserved on error

### System Errors
- [ ] Network errors show friendly message
- [ ] Retry option is available
- [ ] No cryptic error codes shown to users

### Edge Cases
- [ ] Empty states have helpful messaging
- [ ] Long content handles gracefully (truncate/scroll)
- [ ] Special characters don't break layout

## Browser Testing Commands for Quality Checks

### Check Console Errors
```
list_console_messages(types=["error", "warn"])
```

### Check Responsive Layout
```
resize_page(width=375, height=667)  # Mobile
take_snapshot()
resize_page(width=1920, height=1080)  # Desktop
take_snapshot()
```

### Check Network Performance
```
list_network_requests()
# Look for: slow requests, failed requests, large payloads
```

### Check Accessibility Tree
```
take_snapshot(verbose=true)
# Verbose mode shows more accessibility info
```

## Common Quality Issues to Watch For

| Issue | Detection | Fix |
|-------|-----------|-----|
| Missing loading state | Click button, no feedback | Add loading spinner |
| Form not validating | Submit invalid data, no error | Add validation schema |
| Console errors | Check console messages | Fix JavaScript errors |
| Broken layout on mobile | Resize to 375px | Add responsive styles |
| Missing focus state | Tab through page | Add focus-visible styles |
| Slow API response | Check network requests | Add loading state |
