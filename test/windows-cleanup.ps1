<#
.SYNOPSIS
    Reset a Windows test machine to a clean baseline after running windows-install.ps1.
.DESCRIPTION
    Removes everything windows-install.ps1 installs so you can re-test from scratch on
    a persistent VM (Windows Sandbox users don't need this — just relaunch the Sandbox).

    Removes: Scoop + all its apps (git, fvm, flutter), the fvm SDK cache, direct-download
    Flutter, the pub cache, and the installer-added User PATH entries and Scoop env vars.
    Reverts git globals set by the installer. With -RevertSystemChanges (admin only), also
    reverts the long-paths / Developer Mode registry keys and Defender exclusions.

    Safe to run when nothing is installed — every step tolerates missing targets.

.PARAMETER RevertSystemChanges
    Also revert system-wide changes (registry keys, Defender exclusions). Requires admin;
    warns and skips if not elevated.
.PARAMETER KeepPubCache
    Leave %LOCALAPPDATA%\Pub\Cache in place (it can be large and slow to repopulate).
.EXAMPLE
    .\windows-cleanup.ps1
.EXAMPLE
    .\windows-cleanup.ps1 -RevertSystemChanges
#>

param(
    [switch]$RevertSystemChanges,
    [switch]$KeepPubCache
)

$ErrorActionPreference = 'Continue'   # best-effort cleanup — never abort on a missing target

function Write-Step { param([string]$Message) Write-Host "==> $Message" -ForegroundColor Cyan }
function Write-Skip { param([string]$Message) Write-Host "    $Message" -ForegroundColor DarkGray }

function Test-IsAdmin {
    try {
        $id = [System.Security.Principal.WindowsIdentity]::GetCurrent()
        return (New-Object System.Security.Principal.WindowsPrincipal($id)).IsInRole(
            [System.Security.Principal.WindowsBuiltInRole]::Administrator)
    } catch { return $false }
}

# ── Remove install directories ────────────────────────────────────────────────
$dirs = @(
    "$env:USERPROFILE\scoop"           # Scoop root: apps, shims, buckets
    "$env:USERPROFILE\fvm"             # fvm SDK cache + default symlink
    "$env:USERPROFILE\develop\flutter" # direct-download install (no-spaces profile)
    "C:\dev\flutter"                   # direct-download install (spaces-in-username fallback)
)
if (-not $KeepPubCache) { $dirs += "$env:LOCALAPPDATA\Pub\Cache" }

Write-Step 'Removing install directories'
foreach ($d in $dirs) {
    if (Test-Path $d) {
        Remove-Item -Recurse -Force $d -ErrorAction SilentlyContinue
        if (Test-Path $d) { Write-Host "    ! could not fully remove $d (a process may be holding it)" -ForegroundColor Yellow }
        else { Write-Host "    removed $d" }
    } else {
        Write-Skip "not present: $d"
    }
}

# ── Clean the User PATH ───────────────────────────────────────────────────────
Write-Step 'Cleaning installer entries from the User PATH'
$pathPattern = 'scoop\\shims|fvm\\default\\bin|flutter\\bin'
$current = [Environment]::GetEnvironmentVariable('PATH', 'User')
if ($current) {
    $kept = @($current -split ';' | Where-Object { $_ -and ($_ -notmatch $pathPattern) })
    $removed = @($current -split ';' | Where-Object { $_ -and ($_ -match $pathPattern) })
    [Environment]::SetEnvironmentVariable('PATH', ($kept -join ';'), 'User')
    if ($removed.Count) { $removed | ForEach-Object { Write-Host "    removed from PATH: $_" } }
    else { Write-Skip 'no installer PATH entries found' }
} else {
    Write-Skip 'User PATH is empty'
}

# ── Remove Scoop env vars ─────────────────────────────────────────────────────
Write-Step 'Removing Scoop environment variables'
foreach ($v in 'SCOOP', 'SCOOP_GLOBAL') {
    if ([Environment]::GetEnvironmentVariable($v, 'User')) {
        [Environment]::SetEnvironmentVariable($v, $null, 'User')
        Write-Host "    removed $v"
    } else {
        Write-Skip "not set: $v"
    }
}

# ── Revert git globals set by the installer ───────────────────────────────────
Write-Step 'Reverting git global config set by the installer'
if (Get-Command git -ErrorAction SilentlyContinue) {
    git config --global --unset http.sslBackend  2>$null
    git config --global --unset core.longpaths   2>$null
    git config --global --unset-all safe.directory 2>$null
    Write-Host '    unset http.sslBackend, core.longpaths, safe.directory'
} else {
    Write-Skip 'git not on PATH (already removed) — nothing to unset'
}

# ── System-wide changes (admin only) ──────────────────────────────────────────
if ($RevertSystemChanges) {
    if (Test-IsAdmin) {
        Write-Step 'Reverting system-wide changes (registry + Defender)'
        Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' `
            -Name 'LongPathsEnabled' -Value 0 -Type DWord -ErrorAction SilentlyContinue
        Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' `
            -Name 'AllowDevelopmentWithoutDevLicense' -Value 0 -Type DWord -ErrorAction SilentlyContinue
        Remove-MpPreference -ExclusionPath "$env:USERPROFILE\scoop\apps\flutter" -ErrorAction SilentlyContinue
        Remove-MpPreference -ExclusionPath "$env:LOCALAPPDATA\Pub\Cache" -ErrorAction SilentlyContinue
        Write-Host '    LongPaths=0, DeveloperMode=0, Defender exclusions removed'
    } else {
        Write-Host 'Warning: -RevertSystemChanges needs admin. Skipping registry/Defender revert.' -ForegroundColor Yellow
    }
} else {
    Write-Skip 'Skipping system-wide changes (pass -RevertSystemChanges as admin to revert registry/Defender)'
}

# ── Remove a downloaded copy of the installer ─────────────────────────────────
Write-Step 'Removing any downloaded installer copy'
if (Test-Path "$env:TEMP\windows-install.ps1") {
    Remove-Item -Force "$env:TEMP\windows-install.ps1" -ErrorAction SilentlyContinue
    Write-Host "    removed $env:TEMP\windows-install.ps1"
} else {
    Write-Skip 'no downloaded installer copy found'
}

# ── Re-verify the baseline (test plan §3) ─────────────────────────────────────
Write-Step 'Verifying clean baseline in a fresh check'
$leftover = Get-Command scoop, flutter, dart, fvm -ErrorAction SilentlyContinue
if ($leftover) {
    Write-Host '    ! these commands still resolve in THIS session (PATH is cached here):' -ForegroundColor Yellow
    $leftover | ForEach-Object { Write-Host "      $($_.Name) -> $($_.Source)" -ForegroundColor Yellow }
    Write-Host '    Open a NEW PowerShell window and re-check — the User PATH is already cleaned.' -ForegroundColor Yellow
} else {
    Write-Host '    no scoop/flutter/dart/fvm on PATH' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Cleanup complete. Open a NEW PowerShell window before the next install run' -ForegroundColor Green
Write-Host '(this session still has the old PATH and any scoop shims cached in memory).' -ForegroundColor Green
