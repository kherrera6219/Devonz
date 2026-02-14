<#
.SYNOPSIS
    Devonz MSIX Package Builder
.DESCRIPTION
    Builds an MSIX package for Microsoft Store submission or sideloading.
    Steps:
      1. Build the Remix production bundle
      2. Create the launcher executable wrapper
      3. Stage all package files
      4. Generate the MSIX package with makeappx.exe
      5. Sign for development sideloading (optional)
.PARAMETER SkipBuild
    Skip the Remix build step (use existing build output).
.PARAMETER SkipSign
    Skip code signing (for CI environments without a certificate).
.PARAMETER Configuration
    Build configuration: 'Release' or 'Debug'. Default: Release.
.NOTES
    Prerequisites:
      - Windows 10 SDK (for makeappx.exe and signtool.exe)
      - Node.js 18+
      - pnpm or npm
    Run with: powershell -ExecutionPolicy Bypass -File build-msix.ps1
#>

param(
    [switch]$SkipBuild,
    [switch]$SkipSign,
    [ValidateSet('Release', 'Debug')]
    [string]$Configuration = 'Release'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms

# ─── Constants ───
$AppName = 'Devonz'
$AppVersion = '1.0.0.0'
$Publisher = 'CN=DevonzTeam'
$SourceDir = $PSScriptRoot
$MsixDir = Join-Path $SourceDir 'msix'
$StagingDir = Join-Path $SourceDir '.msix-staging'
$OutputDir = Join-Path $SourceDir 'dist'
$OutputMsix = Join-Path $OutputDir "$AppName-$AppVersion.msix"
$CertFile = Join-Path $MsixDir 'DevonzDev.pfx'
$CertPassword = 'DevonzDev2024'

# ─── Step definitions ───
$steps = @(
    'Locating Windows SDK tools',
    'Building Remix application',
    'Creating launcher executable',
    'Staging package files',
    'Copying application build',
    'Copying visual assets',
    'Generating file mapping',
    'Creating MSIX package',
    'Signing package (development)',
    'Finalizing'
)
$totalSteps = $steps.Count

function Show-BuildProgress {
    param([int]$StepNumber, [string]$Status)
    $pct = [math]::Round(($StepNumber / $totalSteps) * 100)
    Write-Progress -Activity "Building $AppName MSIX" `
        -Status "$Status  ($StepNumber of $totalSteps)" `
        -PercentComplete $pct
}

function Find-WindowsSdkTool {
    param([string]$ToolName)

    # Search common SDK locations
    $sdkPaths = @(
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin",
        "$env:ProgramFiles\Windows Kits\10\bin"
    )

    foreach ($sdkPath in $sdkPaths) {
        if (Test-Path $sdkPath) {
            $found = Get-ChildItem -Path $sdkPath -Recurse -Filter "$ToolName.exe" -ErrorAction SilentlyContinue |
            Sort-Object { $_.Directory.Name } -Descending |
            Select-Object -First 1
            if ($found) { return $found.FullName }
        }
    }

    # Try PATH
    $inPath = Get-Command $ToolName -ErrorAction SilentlyContinue
    if ($inPath) { return $inPath.Source }

    return $null
}

# ════════════════════════════════════════════════════════════════
# STEP 1: Locate SDK tools
# ════════════════════════════════════════════════════════════════
$stepNum = 1
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

$makeAppx = Find-WindowsSdkTool 'makeappx'
$signTool = Find-WindowsSdkTool 'signtool'

if (-not $makeAppx) {
    Write-Host 'ERROR: makeappx.exe not found. Install Windows 10 SDK.' -ForegroundColor Red
    Write-Host '  Download: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/' -ForegroundColor Yellow
    exit 1
}

Write-Host "  makeappx: $makeAppx" -ForegroundColor Green
if ($signTool) {
    Write-Host "  signtool: $signTool" -ForegroundColor Green
}
else {
    Write-Host '  signtool: not found (signing will be skipped)' -ForegroundColor Yellow
    $SkipSign = $true
}

# ════════════════════════════════════════════════════════════════
# STEP 2: Build Remix application
# ════════════════════════════════════════════════════════════════
$stepNum = 2
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

if ($SkipBuild) {
    Write-Host '  Skipping build (--SkipBuild)' -ForegroundColor Yellow
}
else {
    Write-Host '  Running remix vite:build...' -ForegroundColor Cyan
    Push-Location $SourceDir
    try {
        $pm = if (Get-Command pnpm -ErrorAction SilentlyContinue) { 'pnpm' } else { 'npm' }
        & $pm run build 2>&1 | Out-Null
        Write-Host '  Build completed successfully' -ForegroundColor Green
    }
    catch {
        Write-Host "  Build failed: $_" -ForegroundColor Red
        exit 1
    }
    finally {
        Pop-Location
    }
}

# ════════════════════════════════════════════════════════════════
# STEP 3: Create launcher executable wrapper
# ════════════════════════════════════════════════════════════════
$stepNum = 3
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Create a batch file launcher that starts the Remix server
$launcherBat = Join-Path $MsixDir 'devonz-launcher.bat'
@"
@echo off
title Devonz - AI Agent
cd /d "%~dp0app"
node node_modules\remix-serve\dist\cli.js ./build/server/index.js
"@ | Set-Content -Path $launcherBat -Encoding ASCII

# For MSIX, we need an .exe — use a simple VBS-to-EXE or
# use the batch file directly if Desktop Bridge supports it.
# For now, create a small VBS wrapper that launches the batch silently.
$launcherVbs = Join-Path $MsixDir 'devonz-launcher.vbs'
@"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & Replace(WScript.ScriptFullName, ".vbs", ".bat") & Chr(34), 1, False

' Open browser after a brief delay
WScript.Sleep 3000
WshShell.Run "http://localhost:3000", 1, False
"@ | Set-Content -Path $launcherVbs -Encoding ASCII

Write-Host '  Launcher scripts created' -ForegroundColor Green

# ════════════════════════════════════════════════════════════════
# STEP 4: Stage package files
# ════════════════════════════════════════════════════════════════
$stepNum = 4
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Clean and recreate staging directory
if (Test-Path $StagingDir) {
    Remove-Item -Path $StagingDir -Recurse -Force
}
New-Item -Path $StagingDir -ItemType Directory -Force | Out-Null
New-Item -Path (Join-Path $StagingDir 'assets') -ItemType Directory -Force | Out-Null
New-Item -Path (Join-Path $StagingDir 'app') -ItemType Directory -Force | Out-Null

# Copy manifest
Copy-Item -Path (Join-Path $MsixDir 'AppxManifest.xml') -Destination $StagingDir -Force
Write-Host '  Staging directory created' -ForegroundColor Green

# ════════════════════════════════════════════════════════════════
# STEP 5: Copy application build
# ════════════════════════════════════════════════════════════════
$stepNum = 5
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

$appDest = Join-Path $StagingDir 'app'

# Copy build output
$buildDir = Join-Path $SourceDir 'build'
if (Test-Path $buildDir) {
    Copy-Item -Path $buildDir -Destination (Join-Path $appDest 'build') -Recurse -Force
    Write-Host '  Build output copied' -ForegroundColor Green
}
else {
    Write-Host '  WARNING: build/ directory not found — run without -SkipBuild' -ForegroundColor Yellow
}

# Copy essential files
$essentialFiles = @(
    'package.json', 'pnpm-lock.yaml', 'package-lock.json',
    'pre-start.js', 'vite.config.ts', 'tsconfig.json'
)

foreach ($file in $essentialFiles) {
    $src = Join-Path $SourceDir $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $appDest -Force
    }
}

# Copy node_modules (for remix-serve runtime)
$nodeModulesDir = Join-Path $SourceDir 'node_modules'
if (Test-Path $nodeModulesDir) {
    Write-Host '  Copying node_modules (this may take a moment)...' -ForegroundColor Cyan
    Copy-Item -Path $nodeModulesDir -Destination (Join-Path $appDest 'node_modules') -Recurse -Force
    Write-Host '  node_modules copied' -ForegroundColor Green
}

# Copy launcher
Copy-Item -Path $launcherBat -Destination $StagingDir -Force
Copy-Item -Path $launcherVbs -Destination $StagingDir -Force

# ════════════════════════════════════════════════════════════════
# STEP 6: Copy visual assets
# ════════════════════════════════════════════════════════════════
$stepNum = 6
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

$assetsSource = Join-Path $MsixDir 'assets'
$assetsDest = Join-Path $StagingDir 'assets'

$requiredAssets = @(
    'StoreLogo.png',
    'Square44x44Logo.png',
    'Square150x150Logo.png',
    'Wide310x150Logo.png',
    'LargeTile.png',
    'SplashScreen.png'
)

$missingAssets = @()
foreach ($asset in $requiredAssets) {
    $src = Join-Path $assetsSource $asset
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $assetsDest -Force
    }
    else {
        $missingAssets += $asset
    }
}

if ($missingAssets.Count -gt 0) {
    Write-Host "  WARNING: Missing assets: $($missingAssets -join ', ')" -ForegroundColor Yellow
    Write-Host '  The package may not pass Store validation without all assets.' -ForegroundColor Yellow
}
else {
    Write-Host '  All visual assets copied' -ForegroundColor Green
}

# ════════════════════════════════════════════════════════════════
# STEP 7: Generate file mapping
# ════════════════════════════════════════════════════════════════
$stepNum = 7
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Build the mapping file dynamically from staging directory
$mappingFile = Join-Path $SourceDir '.msix-mapping.txt'
$mappingLines = @('[Files]')

Get-ChildItem -Path $StagingDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($StagingDir.Length + 1)
    $mappingLines += "`"$($_.FullName)`"  `"$relativePath`""
}

$mappingLines | Set-Content -Path $mappingFile -Encoding UTF8
Write-Host "  File mapping generated ($($mappingLines.Count - 1) files)" -ForegroundColor Green

# ════════════════════════════════════════════════════════════════
# STEP 8: Create MSIX package
# ════════════════════════════════════════════════════════════════
$stepNum = 8
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Ensure output directory exists
if (-not (Test-Path $OutputDir)) {
    New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
}

# Remove existing package
if (Test-Path $OutputMsix) {
    Remove-Item -Path $OutputMsix -Force
}

Write-Host "  Running makeappx.exe pack..." -ForegroundColor Cyan

& $makeAppx pack /f $mappingFile /p $OutputMsix /o 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    # Try alternate approach: pack from directory
    Write-Host '  Retrying with directory packing...' -ForegroundColor Yellow
    & $makeAppx pack /d $StagingDir /p $OutputMsix /o 2>&1 | Out-Null
}

if (Test-Path $OutputMsix) {
    $sizeMB = [math]::Round((Get-Item $OutputMsix).Length / 1MB, 2)
    Write-Host "  MSIX created: $OutputMsix ($sizeMB MB)" -ForegroundColor Green
}
else {
    Write-Host '  ERROR: Failed to create MSIX package' -ForegroundColor Red
    exit 1
}

# ════════════════════════════════════════════════════════════════
# STEP 9: Sign package (development)
# ════════════════════════════════════════════════════════════════
$stepNum = 9
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

if ($SkipSign) {
    Write-Host '  Skipping code signing' -ForegroundColor Yellow
}
else {
    # Generate self-signed certificate if it doesn't exist
    if (-not (Test-Path $CertFile)) {
        Write-Host '  Generating self-signed development certificate...' -ForegroundColor Cyan

        $cert = New-SelfSignedCertificate `
            -Type Custom `
            -Subject $Publisher `
            -KeyUsage DigitalSignature `
            -FriendlyName "$AppName Development Certificate" `
            -CertStoreLocation 'Cert:\CurrentUser\My' `
            -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")

        $certPasswordSecure = ConvertTo-SecureString -String $CertPassword -Force -AsPlainText
        Export-PfxCertificate -Cert $cert -FilePath $CertFile -Password $certPasswordSecure | Out-Null

        Write-Host "  Certificate exported: $CertFile" -ForegroundColor Green
    }

    # Sign the package
    Write-Host '  Signing MSIX package...' -ForegroundColor Cyan
    & $signTool sign /fd SHA256 /a /f $CertFile /p $CertPassword $OutputMsix 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host '  Package signed successfully' -ForegroundColor Green
    }
    else {
        Write-Host '  WARNING: Signing failed (package can still be used for Store upload)' -ForegroundColor Yellow
    }
}

# ════════════════════════════════════════════════════════════════
# STEP 10: Finalize
# ════════════════════════════════════════════════════════════════
$stepNum = 10
Show-BuildProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Clean up staging
Remove-Item -Path $StagingDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path $mappingFile -Force -ErrorAction SilentlyContinue

Write-Progress -Activity "Building $AppName MSIX" -Completed

# ─── Completion notification ───
Write-Host ''
Write-Host '══════════════════════════════════════════════════' -ForegroundColor Green
Write-Host "  $AppName MSIX package built successfully!" -ForegroundColor Green
Write-Host "  Output: $OutputMsix" -ForegroundColor Green
Write-Host '══════════════════════════════════════════════════' -ForegroundColor Green
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host "  Sideload:  powershell -File install.ps1" -ForegroundColor White
Write-Host "  Store:     Upload $OutputMsix to Partner Center" -ForegroundColor White
Write-Host ''

[System.Windows.Forms.MessageBox]::Show(
    "$AppName MSIX package built successfully!`n`nOutput: $OutputMsix`n`nYou can now:`n  • Sideload with install.ps1`n  • Upload to Microsoft Store via Partner Center",
    "$AppName - Build Complete",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
) | Out-Null
