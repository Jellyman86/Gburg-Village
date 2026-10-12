$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$source = Join-Path $root 'art inbox\Scene - Five guys HQ.png'
$output = Join-Path $root 'v5\assets\scenes\five-guys-hq.png'
New-Item -ItemType Directory -Force (Split-Path $output -Parent) | Out-Null
$image = [System.Drawing.Image]::FromFile($source)
$bitmap = New-Object System.Drawing.Bitmap 724,543
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
    if ($image.Width * 543 -ne $image.Height * 724) { throw 'Expected 4:3 HQ artwork.' }
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($image, 0, 0, 724, 543)
    $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Created $output (724x543); source artwork unchanged."
} finally {
    $graphics.Dispose()
    $bitmap.Dispose()
    $image.Dispose()
}
