# Error Pattern Database - Claude Health Analyzer v1.0

## Quick Reference: Error Signature -> Fix

| Error Pattern | Product | Severity | Auto-Fix |
|--------------|---------|----------|----------|
| spawn ENOENT | Desktop/Code | HIGH | Use absolute binary path |
| "Required" param error | Desktop | CRITICAL | Upstream - check status.anthropic.com |
| Invalid JSON / Unexpected token | Desktop/Code | HIGH | Validate & fix JSON syntax |
| Server disconnected | Desktop | HIGH | Check transport type match |
| Disconnect after ~60s | Desktop | HIGH | Add transport config for HTTP servers |
| parseArgs / ERR_MODULE | Desktop/Code | HIGH | Upgrade Node.js to 22 LTS |
| Docker daemon not running | All | HIGH | Start Docker Desktop |
| EADDRINUSE / port conflict | All | MEDIUM | Find & stop conflicting process |
| EACCES / permission denied | All | MEDIUM | Fix permissions |
| Keychain error | Code (macOS) | MEDIUM | Reset Claude Code credentials |
| 401 / OAuth error | Desktop | MEDIUM | Re-authenticate MCP connection |
| heap out of memory | All | HIGH | Restart server, set memory limits |
| Docker API exposed (2375) | Security | CRITICAL | Disable TCP or bind localhost |
| 429 / rate limit | API | MEDIUM | Implement backoff |
| ripgrep missing | Code | LOW | winget install BurntSushi.ripgrep.MSVC |

## Detailed Patterns

### ENOENT_SPAWN
- Regex: `spawn.*ENOENT|spawn.*failed`
- Fix: `where.exe <command>` -> use full path in config

### REQUIRED_PARAM  
- Regex: `"message":\s*"Required"|Invalid arguments for`
- Fix: Check status.anthropic.com, update Claude Desktop

### JSON_PARSE
- Regex: `Unexpected token|Invalid JSON|SyntaxError.*JSON`
- Fix: `python -m json.tool <config_file>`

### SERVER_DISCONNECT
- Regex: `Server disconnected|connection closed|ECONNRESET`
- Fix: Verify transport type, check server logs

### TIMEOUT_60S
- Regex: `Server disconnected` (after exactly ~60s in logs)
- Fix: Add transport config matching server type (http/sse)

### NODE_VERSION
- Regex: `parseArgs|does not provide an export|ERR_MODULE`
- Fix: `nvm install 22 && nvm use 22`

### DOCKER_DOWN
- Regex: `Cannot connect to.*Docker|docker.*error`
- Fix: Start Docker Desktop

### PORT_CONFLICT
- Regex: `EADDRINUSE|address already in use|port.*allocated`
- Fix: `netstat -ano | findstr :<port>` -> kill conflicting PID

### MEMORY_LEAK
- Regex: `heap out of memory|ENOMEM|JavaScript heap`
- Fix: Restart server, add `--max-old-space-size=4096`

### SECURITY_DOCKER_API
- Check: `netstat -ano | findstr "2375 2376" | findstr LISTENING`
- Fix: Disable Docker TCP socket or bind 127.0.0.1 with TLS
