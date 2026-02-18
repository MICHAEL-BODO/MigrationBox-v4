$sourceDir = "c:\DevTools\# CLAUDE SKILLS"
$destDir = "c:\DevTools\#REPOS\MigrationBox-v4\.agent\skills"

Write-Host "Creating destination directory: $destDir"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$items = Get-ChildItem -Path $sourceDir

# Sort items to process Zips first, then Directories, then individual skill files
# This ensures we get the most complete version (zip/dir) before falling back to single file
$sortedItems = $items | Sort-Object {
    if ($_.Extension -eq ".zip") { 0 }
    elseif ($_.PSIsContainer) { 1 }
    else { 2 }
}

foreach ($item in $sortedItems) {
    if ($item.Name -eq "skill-installer") { continue } 
    
    $itemName = $item.BaseName
    $targetPath = Join-Path $destDir $itemName

    Write-Host "Processing $($item.Name)..."

    if ($item.Extension -eq ".zip") {
        # It's a zip file - extract it
        # If target folder exists, we might overwrite or merge. Expand-Archive doesn't merge nicely by default without -Force, and even then...
        # Let's ensure target folder exists for extraction
        if (-not (Test-Path $targetPath)) {
            New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
        }
        try {
            Expand-Archive -Path $item.FullName -DestinationPath $targetPath -Force
            Write-Host "Extracted zip: $itemName"
        } catch {
            Write-Error "Failed to extract $($item.Name): $_"
        }
    }
    elseif ($item.PSIsContainer) {
        # It's a directory
        if (-not (Test-Path $targetPath)) {
            Copy-Item -Path $item.FullName -Destination $targetPath -Recurse -Force
            Write-Host "Copied directory: $itemName"
        } else {
            # Merge/Overwrite
            Copy-Item -Path "$($item.FullName)\*" -Destination $targetPath -Recurse -Force
            Write-Host "Merged directory: $itemName"
        }
    }
    elseif ($item.Extension -in @(".skill", ".md")) {
        # It's a skill file. 
        if (-not (Test-Path $targetPath)) {
             New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
             Copy-Item -Path $item.FullName -Destination (Join-Path $targetPath "SKILL.md") -Force
             Write-Host "Copied skill file to folder: $itemName"
        } else {
             # If folder exists, don't overwrite SKILL.md if it came from a zip or directory (assumed to be better/more complete)
             # Unless the folder is empty or generic?
             # Let's assume zip/directory takes precedence.
             if (-not (Test-Path (Join-Path $targetPath "SKILL.md"))) {
                 Copy-Item -Path $item.FullName -Destination (Join-Path $targetPath "SKILL.md") -Force
                 Write-Host "Added SKILL.md to existing folder: $itemName"
             } else {
                 Write-Host "Skipping skill file (SKILL.md exists): $itemName"
             }
        }
    }
}

Write-Host "Done installing skills."
