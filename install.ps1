<#
.SYNOPSIS
    Devonz Windows Installer (MSIX Sideload)
.DESCRIPTION
    Installs the Devonz AI Agent application via MSIX sideloading.
    For Microsoft Store installations, users install directly from the Store.
    This script is for development/testing sideloading.
    Features:
      - Progress bar showing each install step
      - Install location display (MSIX-managed)
      - Installs development signing certificate
      - Supports choosing between available MSIX packages
      - Completion notification
.NOTES
    Run with: powershell -ExecutionPolicy Bypass -File install.ps1
#>

#Requires -RunAsAdministrator

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms

# ─── Constants ───
$AppName = 'Devonz'
$AppIdentity = 'Devonz.AIAgent'
$ScriptDir = $PSScriptRoot
$MsixDir = Join-Path $ScriptDir 'msix'
$DistDir = Join-Path $ScriptDir 'dist'
$CertFile = Join-Path $MsixDir 'DevonzDev.pfx'
$CertPassword = 'DevonzDev2024'

# ─── Step definitions ───
$steps = @(
    'Checking prerequisites',
    'Locating MSIX package',
    'Installing development certificate',
    'Enabling sideloading',
    'Installing MSIX package',
    'Verifying installation',
    'Finalizing'
)
$totalSteps = $steps.Count

function Show-InstallerProgress {
    param([int]$StepNumber, [string]$Status)
    $pct = [math]::Round(($StepNumber / $totalSteps) * 100)
    Write-Progress -Activity "Installing $AppName" `
        -Status "$Status  ($StepNumber of $totalSteps)" `
        -PercentComplete $pct
}

function Show-MessageBox {
    param(
        [string]$Message,
        [string]$Title = $AppName,
        [string]$Icon = 'Information',
        [string]$Buttons = 'OK'
    )
    return [System.Windows.Forms.MessageBox]::Show(
        $Message, $Title,
        [System.Windows.Forms.MessageBoxButtons]::$Buttons,
        [System.Windows.Forms.MessageBoxIcon]::$Icon
    )
}

# ════════════════════════════════════════════════════════════════
# STEP 1: Check prerequisites
# ════════════════════════════════════════════════════════════════
$stepNum = 1
Show-InstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Check Windows version (MSIX requires Windows 10 1709+)
$winVer = [System.Environment]::OSVersion.Version
if ($winVer.Build -lt 16299) {
    Show-MessageBox -Message "Windows 10 version 1709 or later is required for MSIX installation.`nYour build: $($winVer.Build)" `
        -Title "$AppName - Unsupported Windows Version" -Icon 'Error'
    exit 1
}
Write-Host "  Windows version: $($winVer.Major).$($winVer.Minor).$($winVer.Build)" -ForegroundColor Green

# Check PowerShell version
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Show-MessageBox -Message "PowerShell 5.0+ is required.`nYour version: $($PSVersionTable.PSVersion)" `
        -Title "$AppName - Unsupported PowerShell" -Icon 'Error'
    exit 1
}
Write-Host "  PowerShell: $($PSVersionTable.PSVersion)" -ForegroundColor Green

# ════════════════════════════════════════════════════════════════
# STEP 2: Locate MSIX package
# ════════════════════════════════════════════════════════════════
$stepNum = 2
Show-InstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Search for available MSIX packages
$msixPackages = @()

# Check dist directory
if (Test-Path $DistDir) {
    $msixPackages += Get-ChildItem -Path $DistDir -Filter '*.msix' -ErrorAction SilentlyContinue
}

# Check script directory
$msixPackages += Get-ChildItem -Path $ScriptDir -Filter '*.msix' -MaxDepth 0 -ErrorAction SilentlyContinue

if ($msixPackages.Count -eq 0) {
    $buildNow = Show-MessageBox `
        -Message "No MSIX package found.`n`nWould you like to build one now?`n(This requires Windows SDK and Node.js)" `
        -Title "$AppName - Package Not Found" `
        -Icon 'Question' `
        -Buttons 'YesNo'

    if ($buildNow -eq [System.Windows.Forms.DialogResult]::Yes) {
        $buildScript = Join-Path $ScriptDir 'build-msix.ps1'
        if (Test-Path $buildScript) {
            & $buildScript
            $msixPackages = Get-ChildItem -Path $DistDir -Filter '*.msix' -ErrorAction SilentlyContinue
        }
        else {
            Show-MessageBox -Message "build-msix.ps1 not found." -Title $AppName -Icon 'Error'
            exit 1
        }
    }
    else {
        Write-Host 'Installation cancelled.' -ForegroundColor Yellow
        exit 0
    }
}

# If multiple packages, let user choose
$selectedPackage = $null
if ($msixPackages.Count -eq 1) {
    $selectedPackage = $msixPackages[0].FullName
}
elseif ($msixPackages.Count -gt 1) {
    # Use a simple dialog to let user choose
    Write-Host '  Available packages:' -ForegroundColor Cyan
    for ($i = 0; $i -lt $msixPackages.Count; $i++) {
        Write-Host "    [$($i+1)] $($msixPackages[$i].Name)" -ForegroundColor White
    }
    $selectedPackage = $msixPackages[0].FullName
    Write-Host "  Using: $($msixPackages[0].Name)" -ForegroundColor Green
}

Write-Host "  Package: $selectedPackage" -ForegroundColor Green

# ════════════════════════════════════════════════════════════════
# STEP 3: Install development certificate
# ════════════════════════════════════════════════════════════════
$stepNum = 3
Show-InstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

if (Test-Path $CertFile) {
    Write-Host '  Installing development signing certificate...' -ForegroundColor Cyan

    try {
        $certPasswordSecure = ConvertTo-SecureString -String $CertPassword -Force -AsPlainText
        Import-PfxCertificate `
            -FilePath $CertFile `
            -CertStoreLocation 'Cert:\LocalMachine\TrustedPeople' `
            -Password $certPasswordSecure | Out-Null

        Write-Host '  Certificate installed to TrustedPeople store' -ForegroundColor Green
    }
    catch {
        Write-Host "  Warning: Certificate install failed: $_" -ForegroundColor Yellow
        Write-Host '  The package may fail to install without a trusted certificate.' -ForegroundColor Yellow
    }
}
else {
    Write-Host '  No development certificate found (using Store-signed package)' -ForegroundColor Yellow
}

# ════════════════════════════════════════════════════════════════
# STEP 4: Enable sideloading
# ════════════════════════════════════════════════════════════════
$stepNum = 4
Show-InstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Check if sideloading is enabled
try {
    $sideloadKey = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock'
    if (Test-Path $sideloadKey) {
        $allowSideload = (Get-ItemProperty -Path $sideloadKey -Name 'AllowAllTrustedApps' -ErrorAction SilentlyContinue).AllowAllTrustedApps
        if ($allowSideload -ne 1) {
            Set-ItemProperty -Path $sideloadKey -Name 'AllowAllTrustedApps' -Value 1 -Type DWord
            Write-Host '  Sideloading enabled' -ForegroundColor Green
        }
        else {
            Write-Host '  Sideloading already enabled' -ForegroundColor Green
        }
    }
    else {
        New-Item -Path $sideloadKey -Force | Out-Null
        Set-ItemProperty -Path $sideloadKey -Name 'AllowAllTrustedApps' -Value 1 -Type DWord
        Write-Host '  Sideloading enabled' -ForegroundColor Green
    }
}
catch {
    Write-Host '  Warning: Could not verify sideloading status' -ForegroundColor Yellow
}

# ════════════════════════════════════════════════════════════════
# STEP 5: Install MSIX package
# ════════════════════════════════════════════════════════════════
$stepNum = 5
Show-InstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

Write-Host '  Installing MSIX package...' -ForegroundColor Cyan

try {
    # Remove existing installation if present
    $existing = Get-AppxPackage -Name $AppIdentity -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host '  Removing previous installation...' -ForegroundColor Yellow
        Remove-AppxPackage -Package $existing.PackageFullName -ErrorAction SilentlyContinue
    }

    # Install the new package
    Add-AppxPackage -Path $selectedPackage -ForceApplicationShutdown

    Write-Host '  MSIX package installed successfully' -ForegroundColor Green
}
catch {
    Show-MessageBox -Message "Installation failed:`n`n$($_.Exception.Message)`n`nEnsure sideloading is enabled in Settings > Update & Security > For developers." `
        -Title "$AppName - Installation Error" -Icon 'Error'
    exit 1
}

# ════════════════════════════════════════════════════════════════
# STEP 6: Verify installation
# ════════════════════════════════════════════════════════════════
$stepNum = 6
Show-InstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

$installed = Get-AppxPackage -Name $AppIdentity -ErrorAction SilentlyContinue

if ($installed) {
    Write-Host "  Verified: $($installed.Name) v$($installed.Version)" -ForegroundColor Green
    Write-Host "  Install location: $($installed.InstallLocation)" -ForegroundColor Green
    Write-Host "  Status: $($installed.Status)" -ForegroundColor Green
}
else {
    Write-Host '  WARNING: Package not found after installation' -ForegroundColor Yellow
}

# ════════════════════════════════════════════════════════════════
# STEP 7: Finalize
# ════════════════════════════════════════════════════════════════
$stepNum = 7
Show-InstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

Write-Progress -Activity "Installing $AppName" -Completed

# ─── Completion notification ───
Write-Host ''
Write-Host '══════════════════════════════════════════════════' -ForegroundColor Green
Write-Host "  $AppName installed successfully!" -ForegroundColor Green
if ($installed) {
    Write-Host "  Version:  $($installed.Version)" -ForegroundColor Green
    Write-Host "  Location: $($installed.InstallLocation)" -ForegroundColor Green
}
Write-Host '══════════════════════════════════════════════════' -ForegroundColor Green
Write-Host ''

Show-MessageBox -Message @"
$AppName has been installed successfully!

You can launch $AppName from:
  • Start Menu (search for "$AppName")
  • Windows search

To uninstall, use:
  • Settings > Apps > $AppName
  • Or run uninstall.ps1
"@ -Title "$AppName - Installation Complete" -Icon 'Information'
