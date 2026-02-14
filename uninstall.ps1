<#
.SYNOPSIS
    Devonz Windows Uninstaller (MSIX)
.DESCRIPTION
    Removes the Devonz AI Agent application installed via MSIX.
    Features:
      - Confirmation dialog before proceeding
      - Progress bar showing each removal step
      - Removes MSIX package via Windows APIs
      - Cleans up development certificates
      - Completion notification
.PARAMETER Quiet
    Run without confirmation dialog (for silent uninstall).
.NOTES
    Run with: powershell -ExecutionPolicy Bypass -File uninstall.ps1
#>

param(
    [switch]$Quiet
)

#Requires -RunAsAdministrator

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms

# ─── Constants ───
$AppName = 'Devonz'
$AppIdentity = 'Devonz.AIAgent'
$Publisher = 'CN=DevonzTeam'

# ─── Step definitions ───
$steps = @(
    'Confirming uninstall',
    'Locating installed package',
    'Removing MSIX package',
    'Removing development certificate',
    'Cleaning up app data',
    'Finalizing removal'
)
$totalSteps = $steps.Count

function Show-UninstallerProgress {
    param([int]$StepNumber, [string]$Status)
    $pct = [math]::Round(($StepNumber / $totalSteps) * 100)
    Write-Progress -Activity "Uninstalling $AppName" `
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
# STEP 1: Confirm uninstall
# ════════════════════════════════════════════════════════════════
$stepNum = 1
Show-UninstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Check if the package is installed
$installed = Get-AppxPackage -Name $AppIdentity -ErrorAction SilentlyContinue

$infoText = if ($installed) {
    "Version: $($installed.Version)`nLocation: $($installed.InstallLocation)"
}
else {
    '(Package not found — will clean up certificates and app data)'
}

if (-not $Quiet) {
    $confirm = Show-MessageBox `
        -Message "Are you sure you want to uninstall $AppName?`n`n$infoText`n`nThis will remove the application, certificates, and app data." `
        -Title "$AppName - Confirm Uninstall" `
        -Icon 'Warning' `
        -Buttons 'YesNo'

    if ($confirm -ne [System.Windows.Forms.DialogResult]::Yes) {
        Write-Host 'Uninstall cancelled by user.' -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Uninstalling $AppName..." -ForegroundColor Cyan

# ════════════════════════════════════════════════════════════════
# STEP 2: Locate installed package
# ════════════════════════════════════════════════════════════════
$stepNum = 2
Show-UninstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

if ($installed) {
    Write-Host "  Found: $($installed.PackageFullName)" -ForegroundColor Green
    Write-Host "  Version: $($installed.Version)" -ForegroundColor Green
    Write-Host "  Location: $($installed.InstallLocation)" -ForegroundColor Green
}
else {
    Write-Host '  Package not currently installed' -ForegroundColor Yellow
}

# ════════════════════════════════════════════════════════════════
# STEP 3: Remove MSIX package
# ════════════════════════════════════════════════════════════════
$stepNum = 3
Show-UninstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

if ($installed) {
    try {
        Write-Host '  Removing MSIX package...' -ForegroundColor Cyan
        Remove-AppxPackage -Package $installed.PackageFullName -ErrorAction Stop
        Write-Host '  Package removed successfully' -ForegroundColor Green
    }
    catch {
        Write-Host "  Warning: Package removal had issues: $_" -ForegroundColor Yellow

        # Try force removal
        try {
            Remove-AppxPackage -Package $installed.PackageFullName -AllUsers -ErrorAction SilentlyContinue
        }
        catch {
            Write-Host '  Could not force-remove for all users' -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host '  No package to remove' -ForegroundColor Yellow
}

# ════════════════════════════════════════════════════════════════
# STEP 4: Remove development certificate
# ════════════════════════════════════════════════════════════════
$stepNum = 4
Show-UninstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

$removedCerts = 0

# Check TrustedPeople store (where sideload certs are installed)
$certStores = @(
    'Cert:\LocalMachine\TrustedPeople',
    'Cert:\CurrentUser\My',
    'Cert:\LocalMachine\Root'
)

foreach ($store in $certStores) {
    $certs = Get-ChildItem -Path $store -ErrorAction SilentlyContinue |
    Where-Object { $_.Subject -eq $Publisher }

    foreach ($cert in $certs) {
        try {
            Remove-Item -Path $cert.PSPath -Force
            $removedCerts++
        }
        catch {
            Write-Host "  Warning: Could not remove cert from $store" -ForegroundColor Yellow
        }
    }
}

if ($removedCerts -gt 0) {
    Write-Host "  Removed $removedCerts development certificate(s)" -ForegroundColor Green
}
else {
    Write-Host '  No development certificates found' -ForegroundColor Yellow
}

# ════════════════════════════════════════════════════════════════
# STEP 5: Clean up app data
# ════════════════════════════════════════════════════════════════
$stepNum = 5
Show-UninstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# MSIX app data locations
$appDataPaths = @(
    (Join-Path $env:LOCALAPPDATA "Packages\$AppIdentity*"),
    (Join-Path $env:LOCALAPPDATA "Packages\${AppIdentity}_*")
)

$cleanedPaths = 0
foreach ($pattern in $appDataPaths) {
    $matches = Get-ChildItem -Path (Split-Path $pattern) -Filter (Split-Path $pattern -Leaf) -Directory -ErrorAction SilentlyContinue
    foreach ($dir in $matches) {
        try {
            # Show sub-progress for large directories
            $itemCount = (Get-ChildItem -Path $dir.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
            Write-Progress -Id 1 -Activity 'Cleaning app data' `
                -Status "$($dir.Name) ($itemCount files)" `
                -PercentComplete 50

            Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
            $cleanedPaths++
        }
        catch {
            Write-Host "  Warning: Could not fully clean $($dir.Name)" -ForegroundColor Yellow
        }
    }
}

Write-Progress -Id 1 -Activity 'Cleaning app data' -Completed

if ($cleanedPaths -gt 0) {
    Write-Host "  Cleaned $cleanedPaths app data location(s)" -ForegroundColor Green
}
else {
    Write-Host '  No app data to clean' -ForegroundColor Yellow
}

# ════════════════════════════════════════════════════════════════
# STEP 6: Finalize
# ════════════════════════════════════════════════════════════════
$stepNum = 6
Show-UninstallerProgress -StepNumber $stepNum -Status $steps[$stepNum - 1]

# Verify removal
$stillInstalled = Get-AppxPackage -Name $AppIdentity -ErrorAction SilentlyContinue

Write-Progress -Activity "Uninstalling $AppName" -Completed

# ─── Completion notification ───
Write-Host ''
if ($stillInstalled) {
    Write-Host '══════════════════════════════════════════════════' -ForegroundColor Yellow
    Write-Host "  $AppName partially removed (may require restart)" -ForegroundColor Yellow
    Write-Host '══════════════════════════════════════════════════' -ForegroundColor Yellow
}
else {
    Write-Host '══════════════════════════════════════════════════' -ForegroundColor Green
    Write-Host "  $AppName has been uninstalled successfully!" -ForegroundColor Green
    Write-Host '══════════════════════════════════════════════════' -ForegroundColor Green
}
Write-Host ''

if (-not $Quiet) {
    $statusMsg = if ($stillInstalled) {
        "$AppName was partially removed. A system restart may be needed to complete the uninstall."
    }
    else {
        "$AppName has been successfully uninstalled.`n`nAll application files, certificates, and app data have been removed."
    }

    Show-MessageBox -Message $statusMsg `
        -Title "$AppName - Uninstall Complete" -Icon 'Information'
}
