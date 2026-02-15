# Chrome DevTools MCP Setup

## Quick Install (Recommended)

```bash
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
claude mcp list  # verify installation
```

## Manual Install

Add to `.mcp.json` in project root:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

## Connection Options

**Default**: Server starts Chrome automatically

**With existing Chrome**: Use `--autoConnect` to connect to running Chrome

**Manual Chrome**:
```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

## Configuration Options

| Option | Purpose |
|--------|---------|
| `--isolated=true` | Temporary profile, auto-cleanup |
| `--headless=true` | No visible browser (CI/CD) |
| `--viewport=1280x720` | Consistent test viewport |
| `--autoConnect` | Connect to existing Chrome |

## Verify Setup

```
mcp__chrome-devtools__list_pages()
```

Should return list of open pages.

## Security Warning

Remote debugging port exposes browser to any application on machine:
- Use only for development/testing
- Don't browse sensitive sites
- Close Chrome when finished
