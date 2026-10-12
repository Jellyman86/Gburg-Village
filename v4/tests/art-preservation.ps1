$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot '..\tools\process-art.ps1'
$tokens=$null;$parseErrors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile($source,[ref]$tokens,[ref]$parseErrors)
if($parseErrors.Count){throw ($parseErrors | Out-String)}
Add-Type @'
using System.Collections.Generic;
public static class VillageArt {
 public static List<string> Writes=new List<string>();
 public static void Atlas(string source,string destination,int[,] cells,int width,int height,int rows,int maxWidth,int maxHeight) {
  Writes.Add(destination);
 }
}
'@
function Assert($condition,$message){if(!$condition){throw $message}}
# Execute the real import loop with a recording exporter, never the user's PNGs.
foreach($node in $ast.FindAll({param($n)
 ($n -is [System.Management.Automation.Language.AssignmentStatementAst] -and $n.Left.Extent.Text -in @('$dinoRows','$dinoSources')) -or
 ($n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Cells')
},$true)){
 . ([scriptblock]::Create($node.Extent.Text))
}
$loops=@($ast.FindAll({param($n) $n -is [System.Management.Automation.Language.ForEachStatementAst] -and $n.Condition.Extent.Text -eq '$dinoRows.Keys'},$true))
Assert ($loops.Count -eq 1) 'Expected exactly one dinosaur import loop.'
$loop=[scriptblock]::Create($loops[0].Extent.Text)
$temp=Join-Path ([System.IO.Path]::GetTempPath()) ('gburg-art-preserve-'+[guid]::NewGuid())
$assets=$temp;$inbox=$temp;$folder=Join-Path $temp 'dinosaurs'
$ids=@('trex','raptor','triceratops','pterodactyl')
New-Item -ItemType Directory -Path $folder -Force | Out-Null
try{
 foreach($id in $ids){[System.IO.File]::WriteAllBytes((Join-Path $folder "$id.png"),[byte[]]@(1,2,3))}
 $RebuildDinosaurs=$false
 . $loop | Out-Null
 Assert ([VillageArt]::Writes.Count -eq 0) 'Default processing must not regenerate existing dinosaur sheets.'
 Remove-Item -LiteralPath (Join-Path $folder 'raptor.png')
 . $loop | Out-Null
 Assert ([VillageArt]::Writes.Count -eq 1 -and [VillageArt]::Writes[0] -eq (Join-Path $folder 'raptor.png')) 'A missing sheet must still be generated.'
 [VillageArt]::Writes.Clear();$RebuildDinosaurs=$true
 . $loop | Out-Null
 Assert ([VillageArt]::Writes.Count -eq 4) 'Explicit rebuild must regenerate all four sheets.'
 Assert (@([VillageArt]::Writes | Select-Object -Unique).Count -eq 4) 'Explicit rebuild must target four distinct sheets.'
 Write-Output 'Art preservation passed: existing sheets skipped, missing sheet generated, explicit rebuild replaces all four.'
}finally{
 foreach($id in $ids){$file=Join-Path $folder "$id.png";if(Test-Path -LiteralPath $file){Remove-Item -LiteralPath $file}}
 Remove-Item -LiteralPath $folder
 Remove-Item -LiteralPath $temp
}
