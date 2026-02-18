# Common MCP Server Dependencies Reference

## Python/UV-based MCPs

### Android MCP
**Repository:** https://github.com/cursortouch/android-mcp  
**Dependencies:**
- UV ✅ (auto-installable)
- Python 3.10+
- Git

**Installation:**
```json
"android-mcp": {
  "command": "uv",
  "args": ["--directory", "C:/path/to/android-mcp", "run", "android-mcp"]
}
```

### Windows MCP
**Repository:** https://github.com/user/windows-mcp  
**Dependencies:**
- UV ✅ (auto-installable)
- Python 3.10+
- Git

**Installation:**
```json
"windows-mcp": {
  "command": "uv",
  "args": ["--directory", "C:/path/to/windows-mcp", "run", "windows-mcp"]
}
```

---

## Node.js-based MCPs

### Filesystem MCP (Official)
**Package:** @modelcontextprotocol/server-filesystem  
**Dependencies:**
- Node.js 18.0.0+
- NPM 9.0.0+

**Installation:**
```json
"filesystem": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/allowed/directory"]
}
```

### GitHub MCP
**Package:** @modelcontextprotocol/server-github  
**Dependencies:**
- Node.js 18.0.0+
- GitHub Personal Access Token

**Installation:**
```json
"github": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
  }
}
```

### Memory MCP
**Package:** @modelcontextprotocol/server-memory  
**Dependencies:**
- Node.js 18.0.0+

**Installation:**
```json
"memory": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-memory"]
}
```

---

## Desktop Commander (Built-in)

### Desktop Commander
**Type:** Pre-installed Windows executable  
**Dependencies:** NONE  
**Location:** Built into Claude Desktop

**Installation:**
```json
"desktop-commander": {
  "command": "C:\\Users\\micha\\AppData\\Local\\Programs\\Claude Desktop\\resources\\mcp-desktop-commander\\desktop-commander.exe",
  "args": ["--port", "55199"]
}
```

---

## Dependency Quick Reference

| MCP Server | UV | Node | Python | Git | Special |
|------------|----|----|--------|-----|---------|
| android-mcp | ✅ | ❌ | ✅ 3.10+ | ✅ | - |
| windows-mcp | ✅ | ❌ | ✅ 3.10+ | ✅ | - |
| filesystem (official) | ❌ | ✅ 18+ | ❌ | ❌ | - |
| github (official) | ❌ | ✅ 18+ | ❌ | ❌ | PAT token |
| memory (official) | ❌ | ✅ 18+ | ❌ | ❌ | - |
| desktop-commander | ❌ | ❌ | ❌ | ❌ | Built-in |

---

## Installation Pattern Templates

### Python/UV Pattern
```json
{
  "command": "uv",
  "args": ["--directory", "C:/path/to/repo", "run", "server-name"]
}
```

### Node/NPX Pattern
```json
{
  "command": "npx",
  "args": ["-y", "package-name", ...additional-args]
}
```

### Local Node Pattern
```json
{
  "command": "node",
  "args": ["C:/path/to/repo/index.js", ...args]
}
```

### Executable Pattern (Desktop Commander style)
```json
{
  "command": "C:/full/path/to/executable.exe",
  "args": ["--port", "port_number"]
}
```

---

## Environment Variables

### GitHub MCP
```json
"env": {
  "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
}
```

### Custom API Keys
```json
"env": {
  "API_KEY": "your_key_here",
  "API_SECRET": "your_secret_here"
}
```

---

## Version Requirements

### Node.js
- **Minimum:** 18.0.0
- **Recommended:** 20.x LTS
- **Download:** https://nodejs.org/

### Python
- **Minimum:** 3.10
- **Recommended:** 3.11+ or 3.13+
- **Download:** https://www.python.org/

### UV
- **Minimum:** 0.8.0+
- **Recommended:** Latest (0.10.2+)
- **Installation:** `python -m pip install uv --break-system-packages`

### Git
- **Minimum:** 2.30.0+
- **Recommended:** Latest (2.47.0+)
- **Download:** https://git-scm.com/

---

## Error Patterns

### UV Missing
**Error:** `spawn uv ENOENT`  
**Fix:** `python -m pip install uv --break-system-packages`

### Node Version Too Old
**Error:** `engines.node requirement not satisfied`  
**Fix:** Update Node.js to 18.0.0+

### Python Missing
**Error:** `python is not recognized`  
**Fix:** Install Python 3.10+ and add to PATH

### Git Missing
**Error:** `git is not recognized`  
**Fix:** Install Git for Windows

### PATH Not Updated
**Error:** Command works in new terminal but not Claude Desktop  
**Fix:** Restart Claude Desktop after installing dependencies

---

## Advanced MCPs

### Docker MCP
**Requirements:**
- Docker Desktop running
- Node.js 18+
- Docker socket accessible

### Database MCPs (Postgres, MySQL)
**Requirements:**
- Database server running
- Connection credentials
- Node.js 18+ (usually)

### Cloud MCPs (AWS, Azure, GCP)
**Requirements:**
- Cloud CLI installed (aws-cli, az, gcloud)
- Credentials configured
- Node.js or Python depending on MCP

---

**Last Updated:** 2026-02-14  
**Maintained by:** Sir Chief Architect  
**Auto-updated by:** MCP Dependency Resolver
