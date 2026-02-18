$skillsDir = "c:\DevTools\#REPOS\MigrationBox-v4\.agent\skills"

$items = Get-ChildItem -Path $skillsDir -Directory

foreach ($item in $items) {
    $skillName = $item.Name
    $nestedFolder = Join-Path $item.FullName $skillName
    
    if (Test-Path $nestedFolder -PathType Container) {
        Write-Host "Found nested skill: $skillName"
        
        # Check if top-level SKILL.md is a zip or just exists
        $topSkillMd = Join-Path $item.FullName "SKILL.md"
        if (Test-Path $topSkillMd) {
            $bytes = Get-Content -Path $topSkillMd -Encoding Byte -TotalCount 2
            if ($bytes[0] -eq 0x50 -and $bytes[1] -eq 0x4B) {
                Write-Host "  Deleting top-level SKILL.md (detected as ZIP)"
                Remove-Item -Path $topSkillMd -Force
            }
            else {
                Write-Host "  Top-level SKILL.md is not a ZIP, keeping (or check logic)"
                # If we are moving nested content up, we might overwrite this anyway.
                # If nested folder has SKILL.md, it should probably supersede this one
            }
        }
        
        # Move contents from nested folder to current folder
        Write-Host "  Moving contents from $nestedFolder to $($item.FullName)"
        Get-ChildItem -Path $nestedFolder | Move-Item -Destination $item.FullName -Force
        
        # Remove the now empty nested folder
        Remove-Item -Path $nestedFolder -Force
        Write-Host "  Fixed structure for $skillName"
    }
}
