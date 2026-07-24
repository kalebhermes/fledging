<#
.SYNOPSIS
    fledging Flutter dev environment installer for Windows.
.DESCRIPTION
    Installs Scoop, Git, Flutter (via fvm or direct download), configures PATH and
    Windows-specific settings, then hands off to the fledging Dart tool.

    One-liner:
    powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/kalebhermes/fledging/main/windows-install.ps1 | iex"
#>

#Requires -Version 5.1

param(
    [switch]$NoFvm,
    [string]$FlutterVersion = '',
    [switch]$Headless,
    [switch]$VerboseOutput
)

# ============================================================
# Safety
# ============================================================
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProgressPreference = 'SilentlyContinue'   # prevents a 10-100x download slowdown

# ============================================================
# Constants
# ============================================================
$script:FLEDGING_VERSION = '0.1.0'
$script:FLUTTER_RELEASES_BASE = 'https://storage.googleapis.com/flutter_infra_release/releases'

# Globals set during execution
$script:FledgingArch = ''   # "arm64" | "x64"

# Flags — populated by Initialize-Flags from the param() block
$script:NoFvm = $false
$script:FlutterVersion = ''
$script:Headless = $false
$script:VerboseOutput = $false

# When executed via `irm ... | iex`, there is no script file on disk, so
# $PSCommandPath is empty; when run as a real .ps1 it holds the file path.
# We use $PSCommandPath (an automatic variable) rather than
# $MyInvocation.MyCommand.Path because under `iex` that object has no Path
# property, and Set-StrictMode turns a missing property into a hard error.
# Calling `exit` under iex would kill the user's whole session — Exit-Installer
# returns instead.
$script:IsExecutedFromIex = [string]::IsNullOrEmpty($PSCommandPath)

# ============================================================
# Output — all diagnostic functions write to the information stream (6) via
# Write-Host so the success (output) stream stays clean for value-returning calls.
# ============================================================
function Write-Info { param([string]$Message) Write-Host "==> $Message" -ForegroundColor Cyan }
function Write-Warn { param([string]$Message) Write-Host "Warning: $Message" -ForegroundColor Yellow }
function Write-Err  { param([string]$Message) Write-Host "Error: $Message" -ForegroundColor Red }

# ============================================================
# Utility wrappers
# ============================================================

# Returns $true if a command (cmdlet, function, or executable) is resolvable.
function Test-CommandExists {
    param([Parameter(Mandatory)][string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# Run a script block; throw a clear error if it fails. Handles both thrown
# exceptions (cmdlets under -ErrorActionPreference Stop) and native commands
# that signal failure via a non-zero exit code.
function Invoke-Ensure {
    param(
        [Parameter(Mandatory)][scriptblock]$Script,
        [string]$What = 'command'
    )
    $global:LASTEXITCODE = 0
    & $Script
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $What (exit code $LASTEXITCODE)"
    }
}

# Exit the installer safely. Under `iex` there is no separate process to exit —
# calling `exit` would terminate the user's shell — so we set LASTEXITCODE and
# return. When run as a real script file, we exit normally.
function Exit-Installer {
    param([int]$Code = 0, [string]$Message = '')
    if ($Message) {
        if ($Code -eq 0) { Write-Info $Message } else { Write-Err $Message }
    }
    if ($script:IsExecutedFromIex) {
        $global:LASTEXITCODE = $Code
        return
    }
    exit $Code
}

# ============================================================
# Scoop — the primary package manager (no admin, per-user, shim-based PATH)
# ============================================================

function _Test-ScoopInstalled { Test-CommandExists 'scoop' }

# Thin wrapper around the official Scoop installer so tests can override it.
function _Invoke-ScoopInstaller {
    Invoke-Expression (Invoke-RestMethod -Uri 'https://get.scoop.sh')
}

function Install-Scoop {
    if (_Test-ScoopInstalled) {
        Write-Info 'Scoop already installed'
        return
    }
    Write-Info 'Installing Scoop...'
    _Invoke-ScoopInstaller
    if (-not (_Test-ScoopInstalled)) {
        throw 'Scoop installation completed but scoop is not on PATH. Open a new terminal and re-run.'
    }
    Write-Info 'Scoop installed'
}

function _Test-ScoopBucketExists {
    param([Parameter(Mandatory)][string]$Name)
    return [bool]((scoop bucket list) -match "\b$Name\b")
}

function _Add-ScoopBucket {
    param([Parameter(Mandatory)][string]$Name)
    scoop bucket add $Name
}

# The extras bucket holds flutter, fvm, vscode, android-studio.
function Add-ScoopExtrasBucket {
    if (_Test-ScoopBucketExists -Name 'extras') {
        Write-Info 'Scoop extras bucket already present'
        return
    }
    Write-Info 'Adding Scoop extras bucket...'
    Invoke-Ensure -What 'scoop bucket add extras' -Script { _Add-ScoopBucket -Name 'extras' }
}

function _Install-ScoopPackage {
    param([Parameter(Mandatory)][string]$Package)
    scoop install $Package
}

function Install-ScoopPackage {
    param([Parameter(Mandatory)][string]$Package)
    Write-Info "Installing $Package via Scoop..."
    Invoke-Ensure -What "scoop install $Package" -Script { _Install-ScoopPackage -Package $Package }
}

# ============================================================
# Windows-specific configuration
#
# Several of these need admin. We never *require* elevation — if the session
# isn't elevated we log a warning and continue, matching Scoop's no-admin ethos.
# ============================================================

function Test-IsAdmin {
    $id = [System.Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object System.Security.Principal.WindowsPrincipal($id)
    return $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
}

function _Set-LongPathsRegistry {
    Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' `
        -Name 'LongPathsEnabled' -Value 1 -Type DWord
}
function _Set-GitLongPaths { git config --global core.longpaths true }

# Flutter's pub cache paths routinely exceed the 260-char MAX_PATH limit.
function Enable-LongPaths {
    if (-not (Test-IsAdmin)) {
        Write-Warn 'Skipping long-path support (needs admin). Flutter builds may fail on deep paths.'
        return
    }
    Write-Info 'Enabling long path support...'
    _Set-LongPathsRegistry
    _Set-GitLongPaths
}

function _Add-DefenderExclusion { param([Parameter(Mandatory)][string]$Path) Add-MpPreference -ExclusionPath $Path }

# Defender quarantines flutter.bat/dart.exe and slows builds badly.
function Add-DefenderExclusions {
    if (-not (Test-IsAdmin)) {
        Write-Warn 'Skipping Windows Defender exclusions (needs admin). Builds may be slow.'
        return
    }
    Write-Info 'Adding Windows Defender exclusions...'
    _Add-DefenderExclusion -Path "$env:USERPROFILE\scoop\apps\flutter"
    _Add-DefenderExclusion -Path "$env:LOCALAPPDATA\Pub\Cache"
}

function _Set-DeveloperModeRegistry {
    Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' `
        -Name 'AllowDevelopmentWithoutDevLicense' -Value 1 -Type DWord
}

# fvm uses symlinks, which need Developer Mode (or admin) on Windows.
function Enable-DeveloperMode {
    if (-not (Test-IsAdmin)) {
        Write-Warn 'Skipping Developer Mode (needs admin). fvm symlinks may fail without it.'
        return
    }
    Write-Info 'Enabling Developer Mode (for fvm symlinks)...'
    _Set-DeveloperModeRegistry
}

function _Set-GitSslBackendSchannel { git config --global http.sslBackend schannel }

# Git for Windows ships its own OpenSSL and ignores the Windows cert store.
# Switching to schannel makes Git trust corporate CAs (Zscaler etc.) pushed via
# Group Policy. No admin required.
function Set-GitSslBackend {
    Write-Info 'Configuring Git to use the Windows certificate store...'
    _Set-GitSslBackendSchannel
}

# ============================================================
# PATH persistence
#
# Always use [Environment]::SetEnvironmentVariable — never `setx`, which
# silently truncates PATH at 1024 characters and can destroy existing entries.
# ============================================================

function _Get-UserEnvPath { [Environment]::GetEnvironmentVariable('PATH', 'User') }
function _Set-UserEnvPath { param([Parameter(Mandatory)][AllowEmptyString()][string]$Value) [Environment]::SetEnvironmentVariable('PATH', $Value, 'User') }

# Pure PATH computation: returns the new PATH string with NewDir appended, or
# $null if NewDir is already present (nothing to do). Empty segments dropped.
function Get-UpdatedPath {
    param(
        [Parameter(Mandatory)][AllowEmptyString()][string]$CurrentPath,
        [Parameter(Mandatory)][string]$NewDir
    )
    $parts = @($CurrentPath -split ';' | Where-Object { $_ -ne '' })
    if ($parts -contains $NewDir) { return $null }
    return (($parts + $NewDir) -join ';')
}

function Add-ToUserPath {
    param([Parameter(Mandatory)][string]$NewDir)
    $current = [string](_Get-UserEnvPath)
    $updated = Get-UpdatedPath -CurrentPath $current -NewDir $NewDir
    if ($null -eq $updated) {
        Write-Info "PATH already contains $NewDir"
        return
    }
    _Set-UserEnvPath -Value $updated
    $env:PATH = "$NewDir;$env:PATH"   # also update the current session
    Write-Info "Added $NewDir to your user PATH"
}

# ============================================================
# Direct Flutter download (--no-fvm path)
# ============================================================

function _Test-FlutterInstalled { Test-CommandExists 'flutter' }

# Thin wrapper: fetch and parse the Windows releases manifest. Mockable in tests.
function _Get-FlutterReleasesJson {
    Invoke-RestMethod -Uri "$($script:FLUTTER_RELEASES_BASE)/releases_windows.json"
}

function _Expand-Zip {
    param([Parameter(Mandatory)][string]$ZipPath, [Parameter(Mandatory)][string]$Destination)
    Expand-Archive -Path $ZipPath -DestinationPath $Destination -Force
}

# Flutter breaks on SDK paths containing spaces or special characters, so a
# username like "John Doe" can't use the default %USERPROFILE%\develop location.
function Get-FlutterInstallDir {
    if ($env:USERPROFILE -match ' ') { return 'C:\dev' }
    return "$env:USERPROFILE\develop"
}

function Install-FlutterDirect {
    if (_Test-FlutterInstalled) {
        Write-Info 'Flutter already installed'
        return
    }

    Write-Info 'Fetching Flutter release information...'
    $releases = _Get-FlutterReleasesJson
    $release = Get-FlutterRelease -Releases $releases -Arch $script:FledgingArch -RequestedVersion $script:FlutterVersion

    # Build the URL from our own constant, never from the manifest's base_url.
    $zipUrl = "$($script:FLUTTER_RELEASES_BASE)/$($release.Archive)"
    $tmp = Join-Path ([System.IO.Path]::GetTempPath()) 'fledging'
    $zipPath = Join-Path $tmp 'flutter.zip'

    Write-Info 'Downloading Flutter...'
    Get-RemoteFile -Url $zipUrl -Dest $zipPath

    Write-Info 'Verifying download...'
    Test-Sha256 -Path $zipPath -Expected $release.Sha256

    Write-Info 'Extracting Flutter...'
    $installDir = Get-FlutterInstallDir
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    _Expand-Zip -ZipPath $zipPath -Destination $installDir
    Remove-Item -Force $zipPath -ErrorAction SilentlyContinue

    # Expose flutter/dart in the current session so the check below (and any
    # follow-on work) can find them before PATH persistence takes effect.
    $env:PATH = "$installDir\flutter\bin;$env:PATH"

    if (-not (_Test-FlutterInstalled)) {
        throw "Flutter install completed but flutter is not on PATH. Expected it under $installDir\flutter\bin"
    }
    Write-Info "Flutter installed to $installDir\flutter"
}

# ============================================================
# fvm + Flutter install (default path)
# ============================================================

function _Test-FvmInstalled  { Test-CommandExists 'fvm' }
function _Test-DartInstalled  { Test-CommandExists 'dart' }
function _Fvm-Install { param([Parameter(Mandatory)][string]$Version) fvm install $Version }
function _Fvm-Global  { param([Parameter(Mandatory)][string]$Version) fvm global $Version }

# fvm installs Flutter as a git checkout; Windows refuses git operations on
# repos it considers owned by another user unless they're marked safe.
function _Set-GitSafeDirectory { git config --global --add safe.directory '*' }

function Install-ViaFvm {
    if (-not (_Test-FvmInstalled)) {
        Write-Info 'Installing fvm...'
        Install-ScoopPackage -Package 'fvm'
    } else {
        Write-Info 'fvm already installed'
    }

    $version = if ($script:FlutterVersion) { $script:FlutterVersion } else { 'stable' }
    Write-Info "Installing Flutter $version via fvm..."
    Invoke-Ensure -What "fvm install $version" -Script { _Fvm-Install -Version $version }
    Invoke-Ensure -What "fvm global $version"  -Script { _Fvm-Global -Version $version }

    _Set-GitSafeDirectory

    if (-not (_Test-DartInstalled)) {
        throw "dart not found after fvm install. Expected it under $env:USERPROFILE\fvm\default\bin. Try: fvm global $version"
    }
    Write-Info "Flutter $version installed via fvm"
}

# ============================================================
# Flutter release selection
# ============================================================

# Select the matching Flutter release from a parsed releases_windows.json object.
# Returns an object with Archive and Sha256; throws if no match is found.
# The download URL is built from FLUTTER_RELEASES_BASE, not the JSON's base_url,
# so a compromised JSON can't redirect the download to an attacker-controlled host.
function Get-FlutterRelease {
    param(
        [Parameter(Mandatory)]$Releases,
        [Parameter(Mandatory)][string]$Arch,
        [string]$RequestedVersion = ''
    )
    $stableHash = $Releases.current_release.stable

    foreach ($r in $Releases.releases) {
        # Older release entries omit dart_sdk_arch and are implicitly x64.
        $releaseArch = if ($r.PSObject.Properties.Name -contains 'dart_sdk_arch') { $r.dart_sdk_arch } else { 'x64' }
        if ($releaseArch -ne $Arch) { continue }

        $match = if ($RequestedVersion) { $r.version -eq $RequestedVersion } else { $r.hash -eq $stableHash }
        if ($match) {
            return [pscustomobject]@{ Archive = $r.archive; Sha256 = $r.sha256 }
        }
    }

    if ($RequestedVersion) {
        throw "Flutter $RequestedVersion not found for $Arch"
    }
    throw "No stable Flutter release found for $Arch"
}

# ============================================================
# Download helpers
# ============================================================

# Thin wrapper around Invoke-WebRequest so tests can override the actual fetch.
function _Invoke-Download {
    param([Parameter(Mandatory)][string]$Url, [Parameter(Mandatory)][string]$OutFile)
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
}

# Download a URL to a destination. Writes to <dest>.part first and renames only
# on success, so an interrupted download never leaves a truncated file in place.
function Get-RemoteFile {
    param([Parameter(Mandatory)][string]$Url, [Parameter(Mandatory)][string]$Dest)
    $part = "$Dest.part"
    $dir = Split-Path -Parent $Dest
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    _Invoke-Download -Url $Url -OutFile $part
    Move-Item -Force -Path $part -Destination $Dest
}

# Verify a file's SHA256 against an expected hex digest. Deletes the file and
# throws on mismatch so a corrupted download is never used.
function Test-Sha256 {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Expected)
    $actual = (Get-FileHash -Path $Path -Algorithm SHA256).Hash.ToLower()
    if ($actual -ne $Expected.ToLower()) {
        Remove-Item -Force -Path $Path -ErrorAction SilentlyContinue
        throw "SHA256 mismatch for $(Split-Path -Leaf $Path): expected $Expected, got $actual"
    }
}

# ============================================================
# Architecture detection
# ============================================================

# Thin wrapper so tests can override the reported architecture.
# RuntimeInformation is reliable regardless of process bitness, unlike
# $env:PROCESSOR_ARCHITECTURE which lies under WOW64.
function _Get-OSArchitecture {
    [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
}

# Returns "x64" or "arm64"; throws on anything else.
function Get-FledgingArch {
    $osArch = "$(_Get-OSArchitecture)"
    switch ($osArch) {
        'X64'   { return 'x64' }
        'Arm64' { return 'arm64' }
        default { throw "Unsupported architecture: $osArch. Only x64 and arm64 are supported." }
    }
}

# ============================================================
# Flags
# ============================================================

# Copy the param() values into script-scoped flags and apply the
# FLEDGING_NONINTERACTIVE=1 env override (CI-friendly, mirrors the bash scripts).
function Initialize-Flags {
    param(
        [switch]$NoFvm,
        [string]$FlutterVersion = '',
        [switch]$Headless,
        [switch]$VerboseOutput
    )
    $script:NoFvm = [bool]$NoFvm
    $script:FlutterVersion = $FlutterVersion
    $script:Headless = [bool]$Headless
    $script:VerboseOutput = [bool]$VerboseOutput

    if ($env:FLEDGING_NONINTERACTIVE -eq '1') {
        $script:Headless = $true
    }
}

# ============================================================
# Dart tool handoff
# ============================================================

function _Invoke-DartHandoff {
    Invoke-Ensure -What 'dart pub global activate fledging' -Script { dart pub global activate fledging }
    Invoke-Ensure -What 'dart pub global run fledging'      -Script { dart pub global run fledging }
}

function _Invoke-FvmDartHandoff {
    Invoke-Ensure -What 'fvm dart pub global activate fledging' -Script { fvm dart pub global activate fledging }
    Invoke-Ensure -What 'fvm dart pub global run fledging'      -Script { fvm dart pub global run fledging }
}

function Invoke-Handoff {
    if ($script:NoFvm) { _Invoke-DartHandoff } else { _Invoke-FvmDartHandoff }
}

# ============================================================
# Main
# ============================================================
function Invoke-Main {
    Initialize-Flags -NoFvm:$NoFvm -FlutterVersion $FlutterVersion -Headless:$Headless -VerboseOutput:$VerboseOutput
    if ($script:VerboseOutput) { $VerbosePreference = 'Continue' }

    $script:FledgingArch = Get-FledgingArch

    if (-not $script:Headless) {
        Write-Info 'This script will install:'
        Write-Info '  - Scoop (per-user package manager)'
        Write-Info '  - Git'
        if ($script:NoFvm) {
            Write-Info "  - Flutter $(if ($script:FlutterVersion) { $script:FlutterVersion } else { 'latest stable' }) (direct download)"
        } else {
            Write-Info '  - fvm (Flutter version manager)'
            Write-Info "  - Flutter $(if ($script:FlutterVersion) { $script:FlutterVersion } else { 'latest stable' }) via fvm"
        }
        Read-Host 'Press ENTER to continue or Ctrl-C to cancel'
    }

    # Long paths first — must be enabled before Flutter's deep cache dirs exist.
    Enable-LongPaths

    Install-Scoop
    # git comes from Scoop's default 'main' bucket and must be installed BEFORE
    # adding the extras bucket — Scoop buckets are git repos, so `scoop bucket
    # add` fails without git. fvm/Flutter then come from the extras bucket.
    Install-ScoopPackage -Package 'git'
    Add-ScoopExtrasBucket

    if ($script:NoFvm) {
        Install-FlutterDirect
    } else {
        Install-ViaFvm
    }

    Set-GitSslBackend
    Enable-DeveloperMode
    Add-DefenderExclusions

    if ($script:NoFvm) {
        Add-ToUserPath -NewDir "$(Get-FlutterInstallDir)\flutter\bin"
    } else {
        Add-ToUserPath -NewDir "$env:USERPROFILE\fvm\default\bin"
    }

    Write-Info ''
    Write-Info 'Flutter is installed. Handing off to fledging...'
    Write-Info ''

    Invoke-Handoff
}

# ============================================================
# Sourceable for testing — tests set FLEDGING_NO_MAIN before dot-sourcing so
# Invoke-Main never runs. When executed or piped via iex, the guard is unset.
# ============================================================
if (-not $env:FLEDGING_NO_MAIN) {
    try {
        Invoke-Main
    } catch {
        # Route failures through Exit-Installer so an `irm | iex` run reports the
        # error cleanly instead of killing the user's PowerShell session.
        Exit-Installer -Code 1 -Message $_.Exception.Message
    }
}
