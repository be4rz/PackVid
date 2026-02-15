# Add Figma MCP Server

Add the Figma MCP server to Claude Code's configuration file.

## Steps:
1. Ask the user for their Figma API key (if they don't have one, tell them to get it from https://www.figma.com/developers/api#access-tokens)
2. Read the Claude Code config file at `~/.claude/config.json`
3. Add or update the Figma MCP server configuration:
   ```json
   {
     "mcpServers": {
       "figma": {
         "command": "npx",
         "args": ["-y", "figma-developer-mcp", "--figma-api-key=THEIR-KEY", "--stdio"]
       }
     }
   }
   ```
4. If the config file already has other MCP servers, merge the Figma configuration with existing ones (don't overwrite)
5. Save the updated configuration back to `~/.claude/config.json`
6. Inform the user they need to restart Claude Code for changes to take effect
7. Provide instructions on how to verify it's working after restart

IMPORTANT: Handle the case where the config file doesn't exist or is empty - create it with proper structure.
