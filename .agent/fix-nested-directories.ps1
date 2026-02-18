# Fix Script for Nested Directory Issues
# This script flattens nested skill directories

param(
    [string]$TempDir = "C:\DevTools\#REPOS\MigrationBox-v4\.agent\temp_skills"
)

Write-Host "=== Fixing Nested Directory Issues ===" -ForegroundColor Magenta

$skillsToFix = @(
    "ceo-advisor-new",
    "frontend-design",
    "hybrid-cloud-networking-new",
    "multi-cloud-architecture-new",
    "product-strategist-new",
    "senior-devops-new",
    "senior-fullstack-new",
    "service-mesh-new",
    "terraform-module-library-new"
)

foreach ($skillName in $skillsToFix) {
    $skillPath = Join-Path $TempDir $skillName
    
    if (-not (Test-Path $skillPath)) {
        Write-Host "SKIP: $skillName - Directory not found" -ForegroundColor Yellow
        continue
    }
    
    # Get all subdirectories
    $subDirs = Get-ChildItem -Path $skillPath -Directory
    
    if ($subDirs.Count -eq 1) {
        # Single nested directory - flatten it
        $nestedDir = $subDirs[0]
        $nestedPath = $nestedDir.FullName
        
        # Check if nested directory contains SKILL.md
        if (Test-Path (Join-Path $nestedPath "SKILL.md")) {
            Write-Host "FIXING: $skillName - Flattening nested directory '$($nestedDir.Name)'" -ForegroundColor Cyan
            
            # Move all contents from nested directory to parent
            $tempMove = Join-Path $TempDir "temp_flatten_$skillName"
            Move-Item -Path $nestedPath -Destination $tempMove -Force
            
            # Remove original directory
            Remove-Item -Path $skillPath -Recurse -Force
            
            # Rename temp to original name
            Move-Item -Path $tempMove -Destination $skillPath -Force
            
            Write-Host "SUCCESS: $skillName - Flattened successfully" -ForegroundColor Green
        }
        else {
            Write-Host "SKIP: $skillName - Nested directory doesn't contain SKILL.md" -ForegroundColor Yellow
        }
    }
    elseif ($subDirs.Count -eq 0) {
        Write-Host "SKIP: $skillName - No subdirectories found" -ForegroundColor Yellow
    }
    else {
        Write-Host "SKIP: $skillName - Multiple subdirectories found, manual review needed" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Flattening Complete ===" -ForegroundColor Magenta
