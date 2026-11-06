Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

function Resize-Image($srcPath, $destPath, $width, $height) {
    $parent = Split-Path -Parent $destPath
    if (-not (Test-Path $parent)) { 
        New-Item -ItemType Directory -Path $parent -Force | Out-Null 
    }
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $width, $height)
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
    Write-Host "Created $destPath ($width x $height)"
}

$rootDir = Split-Path -Parent $PSScriptRoot
$src = Join-Path $rootDir "assets\source_logo.jpg"

if (-not (Test-Path $src)) {
    Write-Error "Source image not found: $src"
    exit 1
}

# Web Assets
$publicDir = Join-Path $rootDir "public"
$assetsDir = Join-Path $rootDir "assets"
Resize-Image $src (Join-Path $publicDir "logo.png") 512 512
Resize-Image $src (Join-Path $publicDir "favicon.ico") 64 64
Resize-Image $src (Join-Path $assetsDir "logo.png") 512 512
Resize-Image $src (Join-Path $assetsDir "icon.png") 512 512
Resize-Image $src (Join-Path $assetsDir "splash.png") 512 512

# Android Assets
$androidResDir = Join-Path $rootDir "android\app\src\main\res"

$densities = @(
    @{ Name = 'mipmap-mdpi'; Size = 48; Fore = 108 },
    @{ Name = 'mipmap-hdpi'; Size = 72; Fore = 162 },
    @{ Name = 'mipmap-xhdpi'; Size = 96; Fore = 216 },
    @{ Name = 'mipmap-xxhdpi'; Size = 144; Fore = 324 },
    @{ Name = 'mipmap-xxxhdpi'; Size = 192; Fore = 432 }
)

foreach ($d in $densities) {
    $folder = Join-Path $androidResDir $d.Name
    Resize-Image $src (Join-Path $folder "ic_launcher.png") $d.Size $d.Size
    Resize-Image $src (Join-Path $folder "ic_launcher_round.png") $d.Size $d.Size
    Resize-Image $src (Join-Path $folder "ic_launcher_foreground.png") $d.Fore $d.Fore
}

Write-Host "All icons generated successfully!"

