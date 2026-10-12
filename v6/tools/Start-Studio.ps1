param([ValidateRange(1,65535)][int]$Port=5176)
$ErrorActionPreference='Stop'
$node=Get-Command node -ErrorAction SilentlyContinue
$previousElectron=$env:ELECTRON_RUN_AS_NODE
$previousPort=$env:GBURG_STUDIO_PORT
try {
 $env:GBURG_STUDIO_PORT=[string]$Port
 if ($node) {
  & $node.Source (Join-Path $PSScriptRoot 'studio-server.cjs')
 } else {
  $code=Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe'
  if (!(Test-Path $code)) { throw 'Install Node.js or VS Code to run the studio server.' }
  $env:ELECTRON_RUN_AS_NODE='1'
  & $code (Join-Path $PSScriptRoot 'studio-server.cjs') | Out-Host
 }
 if ($LASTEXITCODE -ne 0) { throw "Studio server exited with code $LASTEXITCODE." }
} finally {
 $env:ELECTRON_RUN_AS_NODE=$previousElectron
 $env:GBURG_STUDIO_PORT=$previousPort
}
