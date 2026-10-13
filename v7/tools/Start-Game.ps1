param([ValidateRange(1,65535)][int]$Port=5177)
$ErrorActionPreference='Stop'
$node=Get-Command node -ErrorAction SilentlyContinue
$previousElectron=$env:ELECTRON_RUN_AS_NODE
$previousPort=$env:GBURG_V7_PORT
try{
 $env:GBURG_V7_PORT=[string]$Port
 if($node){& $node.Source (Join-Path $PSScriptRoot 'server.cjs')}
 else{
  $code=Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe'
  if(-not(Test-Path $code)){throw 'Install Node.js or VS Code to run the local game.'}
  $env:ELECTRON_RUN_AS_NODE='1'
  & $code (Join-Path $PSScriptRoot 'server.cjs') | Out-Host
 }
 if($LASTEXITCODE -ne 0){throw "Game server exited with code $LASTEXITCODE."}
}finally{$env:ELECTRON_RUN_AS_NODE=$previousElectron;$env:GBURG_V7_PORT=$previousPort}
