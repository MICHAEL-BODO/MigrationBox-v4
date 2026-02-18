# MCP Dependency Resolver - Main Orchestrator
# Version: 1.0.0
# Purpose: Analyzes MCP server requirements and resolves dependencies BEFORE installation

param(
    [Parameter(Mandatory=$true)]
    [string]$MCPSource,  # GitHub URL, NPM package, or PyPI package
    
    [Parameter(Mandatory=$false)]
    [string]$MCPType = "auto",  # auto, github, npm, pypi
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoFix = $true,  # Automatically install missing dependencies
    
    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "C:\devtools\Claude\logs"
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = Join-Path $ReportPath "mcp-install-$timestamp.md"

# Color output functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error-Custom { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warning-Custom { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }

# Initialize report
$report = @"
# MCP Dependency Resolution Report
**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Source:** $MCPSource
**Type:** $MCPType

---

"@

Write-Info "MCP Dependency Resolver v1.0.0"
Write-Info "Analyzing: $MCPSource"
Write-Host ""

# Step 1: Detect MCP Type
Write-Info "Step 1: Detecting MCP server type..."

if ($MCPType -eq "auto") {
    if ($MCPSource -match "github\.com") {
        $MCPType = "github"
        Write-Success "Detected: GitHub repository"
    }
    elseif ($MCPSource -match "^@?[\w-]+\/[\w-]+$" -or $MCPSource -match "^@modelcontextprotocol") {
        $MCPType = "npm"
        Write-Success "Detected: NPM package"
    }
    elseif ($MCPSource -match "^[\w-]+$" -and $MCPSource -notmatch "\/") {
        $MCPType = "pypi"
        Write-Success "Detected: PyPI package (assumed)"
    }
    else {
        Write-Warning-Custom "Could not auto-detect type. Defaulting to GitHub."
        $MCPType = "github"
    }
}

$report += "## Detection Results`n`n"
$report += "**MCP Type:** $MCPType`n`n"

# Step 2: Fetch metadata and requirements
Write-Info "Step 2: Fetching metadata..."

$requirements = @{
    UV = $false
    Node = $false
    Python = $false
    Git = $false
    NodeVersion = ""
    PythonVersion = ""
    Dependencies = @()
}

if ($MCPType -eq "github") {
    # Parse GitHub URL
    if ($MCPSource -match "github\.com\/([^\/]+)\/([^\/\.]+)") {
        $owner = $Matches[1]
        $repo = $Matches[2]
        $apiUrl = "https://api.github.com/repos/$owner/$repo"
        
        Write-Info "Fetching from: $apiUrl"
        
        try {
            # Check for package.json (Node.js)
            $packageJsonUrl = "https://raw.githubusercontent.com/$owner/$repo/main/package.json"
            $packageJson = Invoke-RestMethod -Uri $packageJsonUrl -ErrorAction SilentlyContinue
            
            if ($packageJson) {
                $requirements.Node = $true
                Write-Success "Found package.json - Node.js MCP"
                
                if ($packageJson.engines.node) {
                    $requirements.NodeVersion = $packageJson.engines.node
                    Write-Info "Required Node version: $($packageJson.engines.node)"
                }
                
                $report += "### Node.js MCP Detected`n`n"
                $report += "- **package.json:** Found`n"
                $report += "- **Node version:** $($requirements.NodeVersion)`n`n"
            }
        }
        catch {
            # Try pyproject.toml (Python/UV)
            $pyprojectUrl = "https://raw.githubusercontent.com/$owner/$repo/main/pyproject.toml"
            try {
                $pyproject = Invoke-RestMethod -Uri $pyprojectUrl -ErrorAction SilentlyContinue
                
                if ($pyproject) {
                    $requirements.UV = $true
                    $requirements.Python = $true
                    Write-Success "Found pyproject.toml - Python/UV MCP"
                    
                    # Parse Python version requirement
                    if ($pyproject -match 'requires-python\s*=\s*"([^"]+)"') {
                        $requirements.PythonVersion = $Matches[1]
                        Write-Info "Required Python version: $($Matches[1])"
                    }
                    
                    $report += "### Python/UV MCP Detected`n`n"
                    $report += "- **pyproject.toml:** Found`n"
                    $report += "- **Python version:** $($requirements.PythonVersion)`n"
                    $report += "- **UV required:** Yes`n`n"
                }
            }
            catch {
                Write-Warning-Custom "Could not fetch metadata files"
            }
        }
        
        $requirements.Git = $true  # Always need Git for GitHub repos
    }
}
elseif ($MCPType -eq "npm") {
    $requirements.Node = $true
    Write-Success "NPM package - Node.js required"
    $report += "### NPM Package`n`n- **Node.js:** Required`n`n"
}
elseif ($MCPType -eq "pypi") {
    $requirements.UV = $true
    $requirements.Python = $true
    Write-Success "PyPI package - Python/UV required"
    $report += "### PyPI Package`n`n- **Python:** Required`n- **UV:** Required`n`n"
}

Write-Host ""

# Step 3: System Validation
Write-Info "Step 3: Validating system dependencies..."

$validation = @{
    UV = @{ Installed = $false; Version = ""; Path = "" }
    Node = @{ Installed = $false; Version = ""; Path = "" }
    Python = @{ Installed = $false; Version = ""; Path = "" }
    Git = @{ Installed = $false; Version = ""; Path = "" }
    NPM = @{ Installed = $false; Version = ""; Path = "" }
}

# Check UV
try {
    $uvPath = Get-Command uv -ErrorAction SilentlyContinue
    if ($uvPath) {
        $validation.UV.Installed = $true
        $validation.UV.Path = $uvPath.Source
        $uvVersion = & uv --version 2>&1
        if ($uvVersion -match "uv ([\d\.]+)") {
            $validation.UV.Version = $Matches[1]
        }
        Write-Success "UV installed: v$($validation.UV.Version)"
    }
    else {
        Write-Warning-Custom "UV not found"
    }
}
catch {
    Write-Warning-Custom "UV check failed: $_"
}

# Check Node.js
try {
    $nodePath = Get-Command node -ErrorAction SilentlyContinue
    if ($nodePath) {
        $validation.Node.Installed = $true
        $validation.Node.Path = $nodePath.Source
        $nodeVersion = & node --version 2>&1
        $validation.Node.Version = $nodeVersion -replace 'v', ''
        Write-Success "Node.js installed: $nodeVersion"
    }
    else {
        Write-Warning-Custom "Node.js not found"
    }
}
catch {
    Write-Warning-Custom "Node.js check failed: $_"
}

# Check Python
try {
    $pythonPath = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonPath) {
        $validation.Python.Installed = $true
        $validation.Python.Path = $pythonPath.Source
        $pythonVersion = & python --version 2>&1
        if ($pythonVersion -match "Python ([\d\.]+)") {
            $validation.Python.Version = $Matches[1]
        }
        Write-Success "Python installed: v$($validation.Python.Version)"
    }
    else {
        Write-Warning-Custom "Python not found"
    }
}
catch {
    Write-Warning-Custom "Python check failed: $_"
}

# Check Git
try {
    $gitPath = Get-Command git -ErrorAction SilentlyContinue
    if ($gitPath) {
        $validation.Git.Installed = $true
        $validation.Git.Path = $gitPath.Source
        $gitVersion = & git --version 2>&1
        if ($gitVersion -match "git version ([\d\.]+)") {
            $validation.Git.Version = $Matches[1]
        }
        Write-Success "Git installed: v$($validation.Git.Version)"
    }
    else {
        Write-Warning-Custom "Git not found"
    }
}
catch {
    Write-Warning-Custom "Git check failed: $_"
}

# Check NPM
try {
    $npmPath = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmPath) {
        $validation.NPM.Installed = $true
        $validation.NPM.Path = $npmPath.Source
        $npmVersion = & npm --version 2>&1
        $validation.NPM.Version = $npmVersion.Trim()
        Write-Success "NPM installed: v$($validation.NPM.Version)"
    }
    else {
        Write-Warning-Custom "NPM not found"
    }
}
catch {
    Write-Warning-Custom "NPM check failed: $_"
}

Write-Host ""

# Build validation report
$report += "## System Validation`n`n"
$report += "| Tool | Required | Installed | Version | Path |`n"
$report += "|------|----------|-----------|---------|------|`n"

foreach ($tool in @("UV", "Node", "Python", "Git", "NPM")) {
    $req = if ($requirements[$tool]) { "✅ Yes" } else { "❌ No" }
    $inst = if ($validation[$tool].Installed) { "✅ Yes" } else { "❌ No" }
    $ver = $validation[$tool].Version
    $path = $validation[$tool].Path
    
    $report += "| $tool | $req | $inst | $ver | $path |`n"
}

$report += "`n"

# Step 4: Gap Analysis
Write-Info "Step 4: Analyzing dependency gaps..."

$gaps = @()
$canProceed = $true

if ($requirements.UV -and -not $validation.UV.Installed) {
    $gaps += "UV (Python package manager)"
    $canProceed = $false
    Write-Error-Custom "Missing: UV"
}

if ($requirements.Node -and -not $validation.Node.Installed) {
    $gaps += "Node.js"
    $canProceed = $false
    Write-Error-Custom "Missing: Node.js"
}

if ($requirements.Python -and -not $validation.Python.Installed) {
    $gaps += "Python"
    $canProceed = $false
    Write-Error-Custom "Missing: Python"
}

if ($requirements.Git -and -not $validation.Git.Installed) {
    $gaps += "Git"
    $canProceed = $false
    Write-Error-Custom "Missing: Git"
}

if ($gaps.Count -gt 0) {
    $report += "## Missing Dependencies`n`n"
    foreach ($gap in $gaps) {
        $report += "- ❌ $gap`n"
    }
    $report += "`n"
}
else {
    Write-Success "All required dependencies are installed!"
    $report += "## Dependency Status`n`n✅ All required dependencies are installed.`n`n"
}

Write-Host ""

# Step 5: Auto-fix missing dependencies
if ($gaps.Count -gt 0 -and $AutoFix) {
    Write-Info "Step 5: Auto-fixing missing dependencies..."
    $report += "## Auto-Fix Actions`n`n"
    
    foreach ($gap in $gaps) {
        if ($gap -eq "UV (Python package manager)") {
            Write-Info "Installing UV via pip..."
            try {
                $installResult = & python -m pip install uv --break-system-packages 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "UV installed successfully!"
                    $report += "- ✅ **UV:** Installed via pip`n"
                    
                    # Verify
                    $uvCheck = & uv --version 2>&1
                    if ($uvCheck -match "uv ([\d\.]+)") {
                        Write-Success "UV version: $($Matches[1])"
                        $report += "  - Version: $($Matches[1])`n"
                    }
                }
                else {
                    Write-Error-Custom "UV installation failed"
                    $report += "- ❌ **UV:** Installation failed`n"
                    $report += "  - Error: $installResult`n"
                }
            }
            catch {
                Write-Error-Custom "UV installation error: $_"
                $report += "- ❌ **UV:** Installation error: $_`n"
            }
        }
        elseif ($gap -eq "Node.js") {
            Write-Warning-Custom "Node.js must be installed manually"
            Write-Info "Download from: https://nodejs.org/"
            $report += "- ⚠️  **Node.js:** Manual installation required`n"
            $report += "  - Download: https://nodejs.org/`n"
        }
        elseif ($gap -eq "Python") {
            Write-Warning-Custom "Python must be installed manually"
            Write-Info "Download from: https://www.python.org/"
            $report += "- ⚠️  **Python:** Manual installation required`n"
            $report += "  - Download: https://www.python.org/`n"
        }
        elseif ($gap -eq "Git") {
            Write-Warning-Custom "Git must be installed manually"
            Write-Info "Download from: https://git-scm.com/"
            $report += "- ⚠️  **Git:** Manual installation required`n"
            $report += "  - Download: https://git-scm.com/`n"
        }
    }
    
    Write-Host ""
    $report += "`n"
}

# Step 6: Final Validation
Write-Info "Step 6: Final validation check..."

# Re-check critical dependencies after auto-fix
if ($AutoFix -and $gaps -contains "UV (Python package manager)") {
    $uvRecheck = Get-Command uv -ErrorAction SilentlyContinue
    if ($uvRecheck) {
        Write-Success "UV is now available in PATH"
        $canProceed = $true
    }
}

# Final report section
$report += "## Installation Readiness`n`n"

if ($canProceed) {
    Write-Success "✅ READY TO INSTALL MCP SERVER"
    $report += "✅ **Status:** Ready to proceed with MCP installation`n`n"
    
    # Provide installation command
    $report += "### Next Steps`n`n"
    if ($MCPType -eq "github" -and $requirements.UV) {
        $report += "``````powershell`n"
        $report += "# Add to Claude Desktop config:`n"
        $report += "uv --directory `"path_to_cloned_repo`" run server-name`n"
        $report += "``````n`n"
    }
    elseif ($MCPType -eq "github" -and $requirements.Node) {
        $report += "``````powershell`n"
        $report += "# Add to Claude Desktop config:`n"
        $report += "node path_to_cloned_repo/index.js`n"
        $report += "``````n`n"
    }
    elseif ($MCPType -eq "npm") {
        $report += "``````powershell`n"
        $report += "# Add to Claude Desktop config:`n"
        $report += "npx -y $MCPSource`n"
        $report += "``````n`n"
    }
    elseif ($MCPType -eq "pypi") {
        $report += "``````powershell`n"
        $report += "# Add to Claude Desktop config:`n"
        $report += "uvx $MCPSource`n"
        $report += "``````n`n"
    }
}
else {
    Write-Error-Custom "❌ NOT READY - Missing dependencies"
    $report += "❌ **Status:** Cannot proceed - missing dependencies`n`n"
    $report += "Please install missing dependencies and run this script again.`n`n"
}

# Save report
Write-Host ""
Write-Info "Saving report to: $reportFile"

try {
    $report | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Success "Report saved successfully"
}
catch {
    Write-Error-Custom "Failed to save report: $_"
}

# Summary output
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                    SUMMARY                            " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "MCP Source:    $MCPSource" -ForegroundColor White
Write-Host "MCP Type:      $MCPType" -ForegroundColor White
Write-Host "Dependencies:  $($gaps.Count) missing" -ForegroundColor $(if ($gaps.Count -eq 0) { "Green" } else { "Red" })
Write-Host "Ready:         $(if ($canProceed) { 'YES ✅' } else { 'NO ❌' })" -ForegroundColor $(if ($canProceed) { "Green" } else { "Red" })
Write-Host "Report:        $reportFile" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

# Return status code
if ($canProceed) {
    exit 0
}
else {
    exit 1
}
