Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot "..\src\renderer\assets\dokiii-logo.jpg"
$outDir = Join-Path $PSScriptRoot "..\build"
$outFile = Join-Path $outDir "icon.ico"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$bmp = [System.Drawing.Bitmap]::FromFile($src)
$thumb = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($thumb)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($bmp, 0, 0, 256, 256)
$g.Dispose()

$h = $thumb.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($h)
$fs = [System.IO.File]::Create($outFile)
$ico.Save($fs)
$fs.Close()
$thumb.Dispose()
$bmp.Dispose()

Write-Host "ICON_GENERATED_SUCCESSFULLY"
