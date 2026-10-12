param([switch]$ValidateOnly)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$inbox = Join-Path $root 'art inbox'
$scenes = Join-Path $root 'v5\assets\scenes'
$effects = Join-Path $root 'v5\assets\effects'
$names = [ordered]@{
    'banquet' = 'Scene - Kentlands Under the Lights.png'
    'paris' = 'Scene - Paris.png'
    'egypt' = 'Scene - Egypt.png'
    'japan' = 'Scene - Japan.png'
    'russia' = 'Scene - Russia.png'
    'hawaii' = 'Scene - Hawaii.png'
    'new-york' = 'Scene - New York.png'
}
if (-not $ValidateOnly) {
    New-Item -ItemType Directory -Force $scenes,$effects | Out-Null
    foreach ($name in $names.Keys) {
        $source = Join-Path $inbox $names[$name]
        $hash = (Get-FileHash $source).Hash
        $image = [System.Drawing.Image]::FromFile($source)
        $height = [int][Math]::Round($image.Height * 576 / $image.Width)
        $bitmap = New-Object System.Drawing.Bitmap 576,$height
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.DrawImage($image,0,0,576,$height)
            $bitmap.Save((Join-Path $scenes ($name + '.png')),[System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $graphics.Dispose(); $bitmap.Dispose(); $image.Dispose()
        }
        if ((Get-FileHash $source).Hash -ne $hash) { throw "Original scene changed: $source" }
    }
    $source = Join-Path $inbox 'Meteor - Sprite.png'
    $hash = (Get-FileHash $source).Hash
    $image = [System.Drawing.Image]::FromFile($source)
    $bitmap = New-Object System.Drawing.Bitmap 384,256
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        if ($image.Width -ne 1536 -or $image.Height -ne 1024) { throw 'Expected six 512px meteor cells.' }
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($image,0,0,384,256)
        $graphics.Dispose(); $graphics = $null
        for ($y=0; $y -lt 256; $y++) {
            for ($x=0; $x -lt 384; $x++) {
                $pixel = $bitmap.GetPixel($x,$y)
                $brightness = [Math]::Max($pixel.R,[Math]::Max($pixel.G,$pixel.B))
                $alpha = [int][Math]::Max(0,[Math]::Min(255,($brightness-28)*3))
                $bitmap.SetPixel($x,$y,[System.Drawing.Color]::FromArgb($alpha,$pixel.R,$pixel.G,$pixel.B))
            }
        }
        $bitmap.Save((Join-Path $effects 'meteor.png'),[System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        if ($graphics) { $graphics.Dispose() }; $bitmap.Dispose(); $image.Dispose()
    }
    if ((Get-FileHash $source).Hash -ne $hash) { throw 'Original meteor sheet changed.' }
}
foreach ($name in $names.Keys) {
    $image = [System.Drawing.Image]::FromFile((Join-Path $scenes ($name+'.png')))
    try {
        $expectedHeight = if ($name -eq 'banquet') { 864 } else { 768 }
        if ($image.Width -ne 576 -or $image.Height -ne $expectedHeight) { throw "Invalid scene dimensions: $name" }
        Write-Output "$name $($image.Width)x$($image.Height)"
    } finally { $image.Dispose() }
}
$image = [System.Drawing.Bitmap]::FromFile((Join-Path $effects 'meteor.png'))
try {
    if ($image.Width -ne 384 -or $image.Height -ne 256) { throw 'Invalid meteor atlas.' }
    $transparent = $false; $visible = $false
    for ($y=0; $y -lt $image.Height; $y+=3) {
        for ($x=0; $x -lt $image.Width; $x+=3) {
            $alpha=$image.GetPixel($x,$y).A
            if ($alpha -eq 0) { $transparent=$true }
            if ($alpha -eq 255) { $visible=$true }
        }
    }
    if (-not $transparent -or -not $visible) { throw 'Meteor needs transparent background and visible fire.' }
    Write-Output 'meteor 384x256: six 128px cells, transparent background and soft glow.'
} finally { $image.Dispose() }
