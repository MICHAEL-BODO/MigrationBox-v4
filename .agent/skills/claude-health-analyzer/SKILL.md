---
name: claude-health-analyzer
description: "Auto-activate when ANY error message, crash, failure, timeout, disconnection, or degraded performance is detected across Claude Desktop, Claude Code, or Cowork. Triggers on: MCP server errors, connection failures, ENOENT/EACCES/ETIMEDOUT errors, 'server disconnected', 'spawn failed', 'Required parameter error', JSON parse failures, extension install failures, Docker container errors, Node.js version mismatches, PATH resolution failures, OAuth/SSO errors, keychain errors, memory/CPU spikes, tool not available, transport mismatch, and any stderr output from MCP logs. Also use proactively when performing health checks, system diagnostics, or preventive maintenance on Claude product ecosystems."
---

# Claude Ecosystem Health Analyzer & Fixer v1.0

An intelligent diagnostic skill that automatically detects, analyzes, and resolves issues across **Claude Desktop**, **Claude Code**, and **Cowork** (beta). Operates as an always-on health monitor that activates when errors are detected and provides automated remediation.

---

## Activation Triggers

This skill MUST activate when ANY of these patterns are detected:

### Error Message Patterns
```
# MCP Server Errors
- "server disconnected"
- "spawn ENOENT"
- "EACCES: permission denied"
- "ETIMEDOUT"
- "connection refused"
- "Required parameter error"
- "Invalid arguments for"
- "AbortError: The operation was aborted"
- "Command failed"
- "SyntaxError: The requested module"
- "does not provide an export named"

# Configuration Errors
- "Invalid JSON"
- "Unexpected token"
- "Cannot find module"
- "MODULE_NOT_FOUND"
- "ENOENT: no such file or directory"

# Authentication/Transport Errors
- "401 Unauthorized"
- "OAuth" + "error"
- "SecKeychainSearchCopyNext"
- "keychain" + "not found"
- "transport" + "error"

# Performance/Resource Errors
- "out of memory"
- "heap out of memory"
- "ENOMEM"
- "context window" + "exceeded"
- "rate limit"
- "429"

# Docker/Container Errors
- "docker" + "error"
- "container" + "exited"
- "port" + "already in use"
- "EADDRINUSE"
```

### Proactive Triggers
- User says "health check", "diagnose", "troubleshoot", "fix", "broken", "not working"
- User mentions "MCP" + any negative word (failing, broken, stuck, error, crash)
- User mentions "slow", "timeout", "hang" related to Claude products
- After any system change (new MCP server added, config edited, extension installed)

---

## Diagnostic Framework

### Phase 1: DETECT - Error Classification

| Category | Priority | Examples |
|----------|----------|----------|
| CRITICAL | P0 | Total MCP failure, all tools broken, data loss risk |
| HIGH | P1 | Specific MCP server down, auth failures, config corruption |
| MEDIUM | P2 | Performance degradation, intermittent failures, warnings |
| LOW | P3 | Deprecated warnings, non-blocking issues, optimization |

### Phase 2: DIAGNOSE - Root Cause Analysis

Follow this diagnostic tree IN ORDER:

1. IDENTIFY PRODUCT
   - Claude Desktop: Check %APPDATA%\Claude\claude_desktop_config.json (Windows)
   - Claude Code: Check ~/.claude.json and .mcp.json
   - Cowork: Check application-specific settings

2. CHECK LOGS
   - Claude Desktop MCP logs: %APPDATA%\Claude\logs\mcp-server-*.log
   - Claude Code: stderr output, terminal logs
   - Docker containers: docker logs <container_name>

3. VERIFY DEPENDENCIES
   - Node.js version (must be >=18.17 for MCP)
   - Python version (if Python MCP servers used)
   - Docker daemon status
   - Network connectivity
   - Disk space / memory availability

4. TEST CONNECTIVITY
   - MCP server responds to ping/health check
   - Transport type matches server capability (stdio vs http vs sse)
   - Authentication tokens valid and not expired
   - Port availability for HTTP/SSE transports

### Phase 3: FIX - Automated Remediation

#### MCP Server Connection Failures
```powershell
# Step 1: Verify config JSON
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json

# Step 2: Check if command exists
where.exe node
where.exe npx
where.exe docker

# Step 3: For Docker servers - verify container health
docker ps --filter "name=mcp" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Step 4: Test server directly
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' | node server.js
```

#### PATH Resolution Failures (ENOENT)
```powershell
# Find the actual binary location
where.exe node
where.exe npx
where.exe python
# Use the FULL PATH in config instead of just "npx" or "node"
```

#### Transport Mismatch Errors
```json
{
  "mcpServers": {
    "server-name": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-p", "8080:8080", "image-name"],
      "transport": {
        "type": "http",
        "url": "http://localhost:8080/mcp"
      }
    }
  }
}
```

#### Docker Container Errors
```powershell
docker ps -a --filter "name=mcp"
docker restart <container_name>
netstat -ano | findstr :<port>
docker build --no-cache -t <image> .
```

#### Node.js Version Mismatch
```powershell
node --version
# Minimum: v18.17.0, Recommended: v22.x LTS
nvm install 22
nvm use 22
```

### Phase 4: VERIFY - Post-Fix Validation

1. Restart affected product (Claude Desktop = full quit+relaunch)
2. Check MCP server connection (hammer icon in Claude Desktop)
3. Test a simple tool call
4. Monitor logs for 60 seconds
5. Report results with before/after comparison

---

## Auto-Fix Recipes

### Recipe 1: MCP Server Not Showing Up
1. Validate config JSON syntax
2. Check command path exists
3. Verify Node.js >= 18.17
4. Restart Claude Desktop completely
5. Check hammer icon appears

### Recipe 2: Required Parameter Error
1. Check status.anthropic.com (often upstream)
2. Verify tool schemas are valid
3. Update Claude Desktop to latest version

### Recipe 3: Server Disconnected After 60s
1. Check transport type matches server
2. For Docker: add -i flag for interactive mode
3. For HTTP servers: add transport config
4. Check server logs for crashes

### Recipe 4: ENOENT / spawn failed
1. Find full path: where.exe node
2. Replace npx with full path in config
3. Ensure Docker daemon is running

### Recipe 5: Docker MCP Container Errors
1. docker info (check daemon)
2. docker ps -a (list containers)
3. docker logs <container> (check logs)
4. Verify no port conflicts
5. Check Docker API not exposed externally

### Recipe 6: Performance Degradation
1. Check system resources
2. Count active MCP servers
3. Check for memory leaks
4. Review Docker resource limits

---

## Response Format

When this skill activates:

```
HEALTH ANALYZER ACTIVATED
Product: [Claude Desktop / Claude Code / Cowork]
Severity: [CRITICAL/HIGH/MEDIUM/LOW]
Error: [error message summary]
Root Cause: [identified cause]
Fix: [applied or recommended fix]
Status: [RESOLVED / IN PROGRESS / ESCALATED]
```

---

## Official Documentation References

- Claude Desktop MCP: https://support.claude.com/en/articles/10949351
- Claude Code Troubleshooting: https://code.claude.com/docs/en/troubleshooting
- MCP Protocol: https://modelcontextprotocol.io/docs
- MCP Debugging: https://modelcontextprotocol.io/docs/tools/debugging
- Anthropic Status: https://status.anthropic.com
