# UTF-8 commit helper (Windows PowerShell)
# Usage:
#   .\scripts\commit-utf8.ps1 "chore: GitHub Pages 재배포 트리거"
#   .\scripts\commit-utf8.ps1 -Message "fix: ..." -Body "상세 설명"

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Message,
  [string]$Body = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent

$msgFile = Join-Path $repoRoot ".git-commit-msg.txt"
$text = if ($Body) { "$Message`n`n$Body" } else { $Message }
[System.IO.File]::WriteAllText($msgFile, $text, [System.Text.UTF8Encoding]::new($false))

Push-Location $repoRoot
try {
  git commit -F $msgFile
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "Committed with UTF-8 message: $Message"
}
finally {
  Remove-Item $msgFile -ErrorAction SilentlyContinue
  Pop-Location
}
