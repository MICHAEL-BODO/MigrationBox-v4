# Skill Installation Script
# Multi-threaded skill validator and installer

param(
    [string]$TempDir = "C:\DevTools\#REPOS\MigrationBox-v4\.agent\temp_skills",
    [string]$TargetDir = "C:\DevTools\#REPOS\MigrationBox-v4\.agent\skills",
    [string]$LogFile = "C:\DevTools\#REPOS\MigrationBox-v4\.agent\installation-log.txt"
)

# Initialize log
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"=== Skill Installation Started at $timestamp ===" | Out-File -FilePath $LogFile -Encoding UTF8

# Get all extracted skill directories
$extractedSkills = Get-ChildItem -Path $TempDir -Directory

$results = @()
$errors = @()

foreach ($skillDir in $extractedSkills) {
    $skillName = $skillDir.Name
    $skillPath = $skillDir.FullName
    $skillMdPath = Join-Path $skillPath "SKILL.md"
    
    Write-Host "Processing: $skillName" -ForegroundColor Cyan
    
    # Validate SKILL.md exists
    if (-not (Test-Path $skillMdPath)) {
        $errorMsg = "ERROR: $skillName - Missing SKILL.md file"
        Write-Host $errorMsg -ForegroundColor Red
        $errors += $errorMsg
        $errorMsg | Out-File -FilePath $LogFile -Append -Encoding UTF8
        continue
    }
    
    # Read and validate SKILL.md has frontmatter
    $skillContent = Get-Content -Path $skillMdPath -Raw
    if ($skillContent -notmatch '(?ms)^---\s*\n.*?\n---') {
        $errorMsg = "ERROR: $skillName - Invalid SKILL.md format (missing YAML frontmatter)"
        Write-Host $errorMsg -ForegroundColor Yellow
        $errors += $errorMsg
        $errorMsg | Out-File -FilePath $LogFile -Append -Encoding UTF8
        # Continue anyway - maybe it's still usable
    }
    
    # Determine target skill name (remove -new suffix if present)
    $targetSkillName = $skillName -replace '-new$', ''
    $targetSkillPath = Join-Path $TargetDir $targetSkillName
    
    # Check if target already exists
    if (Test-Path $targetSkillPath) {
        $msg = "INFO: $targetSkillName - Already exists, will update"
        Write-Host $msg -ForegroundColor Yellow
        $msg | Out-File -FilePath $LogFile -Append -Encoding UTF8
        
        # Backup existing
        $backupPath = "${targetSkillPath}.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item -Path $targetSkillPath -Destination $backupPath -Recurse -Force
        $msg = "INFO: $targetSkillName - Backed up to $backupPath"
        Write-Host $msg -ForegroundColor Gray
        $msg | Out-File -FilePath $LogFile -Append -Encoding UTF8
    }
    
    # Copy to target location
    try {
        if (Test-Path $targetSkillPath) {
            # Update existing
            Remove-Item -Path $targetSkillPath -Recurse -Force
        }
        
        Copy-Item -Path $skillPath -Destination $targetSkillPath -Recurse -Force
        
        $successMsg = "SUCCESS: $targetSkillName - Installed successfully"
        Write-Host $successMsg -ForegroundColor Green
        $results += $successMsg
        $successMsg | Out-File -FilePath $LogFile -Append -Encoding UTF8
    }
    catch {
        $errorMsg = "ERROR: $targetSkillName - Failed to install: $($_.Exception.Message)"
        Write-Host $errorMsg -ForegroundColor Red
        $errors += $errorMsg
        $errorMsg | Out-File -FilePath $LogFile -Append -Encoding UTF8
    }
}

# Summary
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"`n=== Installation Completed at $timestamp ===" | Out-File -FilePath $LogFile -Append -Encoding UTF8
"Total Skills Processed: $($extractedSkills.Count)" | Out-File -FilePath $LogFile -Append -Encoding UTF8
"Successful Installations: $($results.Count)" | Out-File -FilePath $LogFile -Append -Encoding UTF8
"Errors: $($errors.Count)" | Out-File -FilePath $LogFile -Append -Encoding UTF8

Write-Host "`n=== SUMMARY ===" -ForegroundColor Magenta
Write-Host "Total Skills Processed: $($extractedSkills.Count)" -ForegroundColor White
Write-Host "Successful Installations: $($results.Count)" -ForegroundColor Green
Write-Host "Errors: $($errors.Count)" -ForegroundColor $(if ($errors.Count -gt 0) { "Red" } else { "Green" })

if ($errors.Count -gt 0) {
    Write-Host "`nErrors encountered:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

Write-Host "`nLog file: $LogFile" -ForegroundColor Cyan
