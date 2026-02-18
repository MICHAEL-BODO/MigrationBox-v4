# Claude Ecosystem Health Checker v1.0
# Platform: Windows (Alienware m17 / Dell File Server)
# Usage: pwsh ./health-check.ps1 [-Full] [-Fix]

param(
    [switch]$Full,
    [switch]$Fix,
    [string]$Report = "",
    [switch]$Quiet
)

$ErrorActionPreference = "Continue"
$script:issues = @()
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

function Write-Status($icon, $msg) {
    if (-not $Quiet) { Write-Host "$icon $msg" }
}

function Add-Issue($severity, $product, $msg, $fix) {
    $script:issues += @{ Severity=$severity; Product=$product; Message=$msg; Fix=$fix }
}

Write-Host ""
Write-Host "  Claude Ecosystem Health Check v1.0"
Write-Host "  $timestamp"
Write-Host "  ======================================"
Write-Host ""

# --- Claude Desktop Config ---
Write-Status ">" "Checking Claude Desktop..."
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        Write-Status "[OK]" "Config: Valid JSON"
        if ($config.mcpServers) {
            $servers = $config.mcpServers.PSObject.Properties
            Write-Status "[OK]" "MCP Servers: $($servers.Count) configured"
            foreach ($s in $servers) {
                $cmd = $s.Value.command
                $found = Get-Command $cmd -ErrorAction SilentlyContinue
                if ($found) { Write-Status "  [OK]" "$($s.Name) -> $cmd" }
                else {
                    Write-Status "  [FAIL]" "$($s.Name) -> $cmd NOT FOUND"
                    Add-Issue "HIGH" "Desktop" "MCP '$($s.Name)' cmd '$cmd' missing" "Use full path"
                }
            }
        }
    } catch {
        Write-Status "[FAIL]" "Config: INVALID JSON"
        Add-Issue "CRITICAL" "Desktop" "Invalid JSON in config" "Fix syntax at $configPath"
    }
} else { Write-Status "[WARN]" "Config not found" }

# --- Node.js ---
Write-Status ">" "Checking Node.js..."
$nv = & node --version 2>$null
if ($nv) {
    $major = [int]($nv -replace 'v(\d+)\..*','$1')
    if ($major -ge 18) { Write-Status "[OK]" "Node.js: $nv" }
    else {
        Write-Status "[FAIL]" "Node.js: $nv (need >=18.17)"
        Add-Issue "HIGH" "System" "Node.js $nv too old" "nvm install 22"
    }
} else {
    Write-Status "[FAIL]" "Node.js: NOT FOUND"
    Add-Issue "CRITICAL" "System" "Node.js missing" "Install from nodejs.org"
}

# --- Docker ---
Write-Status ">" "Checking Docker..."
$dv = & docker --version 2>$null
if ($dv) {
    Write-Status "[OK]" "$dv"
    $di = & docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "[OK]" "Docker daemon: Running"
        $mc = & docker ps --filter "name=mcp" --format "{{.Names}}|{{.Status}}" 2>$null
        if ($mc) {
            foreach ($c in $mc) {
                $p = $c -split '\|'
                $ok = if ($p[1] -match "Up") {"[OK]"} else {"[FAIL]"}
                Write-Status "  $ok" "$($p[0]) - $($p[1])"
                if ($p[1] -notmatch "Up") {
                    Add-Issue "HIGH" "Docker" "Container '$($p[0])' down" "docker restart $($p[0])"
                }
            }
        }
    } else {
        Write-Status "[FAIL]" "Docker daemon: NOT RUNNING"
        Add-Issue "HIGH" "Docker" "Daemon not running" "Start Docker Desktop"
    }
} else { Write-Status "[WARN]" "Docker: Not installed" }

# --- Resources (Full mode) ---
if ($Full) {
    Write-Status ">" "Checking resources..."
    $cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
    $mem = Get-CimInstance Win32_OperatingSystem
    $mu = [math]::Round(($mem.TotalVisibleMemorySize - $mem.FreePhysicalMemory) / $mem.TotalVisibleMemorySize * 100, 1)
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
    $du = [math]::Round(($disk.Size - $disk.FreeSpace) / $disk.Size * 100, 1)
    Write-Status "[INFO]" "CPU: ${cpu}% | RAM: ${mu}% | Disk: ${du}%"
    if ($cpu -gt 90) { Add-Issue "HIGH" "System" "CPU ${cpu}%" "Check processes" }
    if ($mu -gt 90) { Add-Issue "HIGH" "System" "RAM ${mu}%" "Close apps" }
    if ($du -gt 95) { Add-Issue "CRITICAL" "System" "Disk ${du}%" "Free space now" }

    # Security: Docker API exposure
    $exposed = netstat -ano 2>$null | Select-String "2375|2376" | Select-String "LISTENING"
    if ($exposed) {
        Write-Status "[SECURITY]" "Docker API port EXPOSED!"
        Add-Issue "CRITICAL" "Security" "Docker API exposed" "Disable TCP socket"
    }
}

# --- Summary ---
Write-Host ""
Write-Host "  ====== SUMMARY ======"
if ($script:issues.Count -eq 0) {
    Write-Host "  All checks passed!" -ForegroundColor Green
} else {
    Write-Host "  Issues: $($script:issues.Count)" -ForegroundColor Yellow
    foreach ($i in $script:issues) {
        $sev = switch ($i.Severity) {"CRITICAL"{"!!"}; "HIGH"{"!"}; "MEDIUM"{"~"}; "LOW"{"."}}
        Write-Host "  [$sev] $($i.Product): $($i.Message)" -ForegroundColor $(if($i.Severity -eq "CRITICAL"){"Red"}else{"Yellow"})
        Write-Host "      Fix: $($i.Fix)" -ForegroundColor Cyan
    }
}

if ($Report) {
    @{timestamp=$timestamp; issues=$script:issues} | ConvertTo-Json -Depth 5 | Out-File $Report -Encoding UTF8
    Write-Status "[OK]" "Report: $Report"
}
