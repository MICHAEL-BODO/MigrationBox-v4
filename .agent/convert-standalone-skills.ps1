# Convert Standalone Skill Files to Directory Format
# This script converts .skill and .md files to proper skill directories

param(
    [string]$SourceDir = "C:\DevTools\# CLAUDE SKILLS",
    [string]$TargetDir = "C:\DevTools\#REPOS\MigrationBox-v4\.agent\skills"
)

Write-Host "=== Converting Standalone Skill Files ===" -ForegroundColor Magenta

# Define skill files to convert
$skillFiles = @(
    @{ Source = "code-architect.skill"; SkillName = "code-architect" },
    @{ Source = "code-architect.md"; SkillName = "code-architect-md" },
    @{ Source = "code-tester-reviewer.skill"; SkillName = "code-tester-reviewer" },
    @{ Source = "code-tester-reviewer.md"; SkillName = "code-tester-reviewer-md" },
    @{ Source = "senior-fullstack-developer.skill"; SkillName = "senior-fullstack-developer" },
    @{ Source = "senior-fullstack-developer.md"; SkillName = "senior-fullstack-developer-md" }
)

foreach ($skillInfo in $skillFiles) {
    $sourceFile = Join-Path $SourceDir $skillInfo.Source
    $skillName = $skillInfo.SkillName
    $targetSkillDir = Join-Path $TargetDir $skillName
    $targetSkillFile = Join-Path $targetSkillDir "SKILL.md"
    
    if (-not (Test-Path $sourceFile)) {
        Write-Host "SKIP: $($skillInfo.Source) - File not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "PROCESSING: $($skillInfo.Source) -> $skillName" -ForegroundColor Cyan
    
    # Check if target already exists
    if (Test-Path $targetSkillDir) {
        # Backup existing
        $backupPath = "${targetSkillDir}.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Host "  Backing up existing to: $backupPath" -ForegroundColor Gray
        Copy-Item -Path $targetSkillDir -Destination $backupPath -Recurse -Force
        Remove-Item -Path $targetSkillDir -Recurse -Force
    }
    
    # Create directory
    New-Item -ItemType Directory -Path $targetSkillDir -Force | Out-Null
    
    # Copy skill file and rename to SKILL.md
    Copy-Item -Path $sourceFile -Destination $targetSkillFile -Force
    
    Write-Host "SUCCESS: $skillName - Created from $($skillInfo.Source)" -ForegroundColor Green
}

# Handle duplicate check - if both .skill and .md exist for same name, prefer .skill
$duplicateChecks = @(
    @{ Primary = "code-architect"; Duplicate = "code-architect-md" },
    @{ Primary = "code-tester-reviewer"; Duplicate = "code-tester-reviewer-md" },
    @{ Primary = "senior-fullstack-developer"; Duplicate = "senior-fullstack-developer-md" }
)

foreach ($check in $duplicateChecks) {
    $primaryPath = Join-Path $TargetDir $check.Primary
    $duplicatePath = Join-Path $TargetDir $check.Duplicate
    
    if ((Test-Path $primaryPath) -and (Test-Path $duplicatePath)) {
        Write-Host "  Removing duplicate: $($check.Duplicate)" -ForegroundColor Yellow
        Remove-Item -Path $duplicatePath -Recurse -Force
    }
}

Write-Host "`n=== Conversion Complete ===" -ForegroundColor Magenta
