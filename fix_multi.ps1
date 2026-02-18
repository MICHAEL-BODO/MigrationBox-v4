$zipFile = "c:\DevTools\#REPOS\MigrationBox-v4\.agent\skills\multi-cloud-architecture\SKILL.md"
$destDir = "c:\DevTools\#REPOS\MigrationBox-v4\.agent\skills\multi-cloud-architecture\extracted"

if (Test-Path $zipFile) {
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    
    try {
        Expand-Archive -Path $zipFile -DestinationPath $destDir -Force
        Write-Host "Extracted multi-cloud-architecture"
        Get-ChildItem -Path $destDir -Recurse | Select-Object FullName
    }
    catch {
        Write-Error "Failed to extract: $_"
    }
}
else {
    Write-Error "File not found: $zipFile"
}
