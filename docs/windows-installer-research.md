# Windows Installer Research — fledging Flutter Dev Environment

Research into building a one-command Windows installer equivalent to `macos-install.sh` and
`linux-install.sh`. Covers package manager options, PowerShell patterns, Flutter-specific
gotchas, and a concrete implementation plan.

---

## The One-Liner

The Windows equivalent of `curl | bash` is:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/kalebhermes/fledging/main/windows-install.ps1 | iex"
```

`irm` (Invoke-RestMethod) downloads the script body as a string. `iex`
(Invoke-Expression) executes it. `-ExecutionPolicy Bypass` scopes the policy override
to this process only — no permanent system change.

---

## Package Manager Decision

### winget (Windows Package Manager)
Microsoft's official CLI. Ships with Windows 10 1809+ and Windows 11.

**Critical finding: No official Flutter package.** The Flutter team closed the winget
packaging request as "not planned" (GitHub issue #57674). winget IS useful for
installing prerequisites (Git, VS Code, Android Studio, Visual Studio Build Tools)
but cannot be the primary Flutter install mechanism.

**Useful winget package IDs:**
| Tool | Package ID |
|---|---|
| Git | `Git.Git` |
| VS Code | `Microsoft.VisualStudioCode` |
| Android Studio | `Google.AndroidStudio` |
| Visual Studio Build Tools | `Microsoft.VisualStudio.2022.BuildTools` |
| OpenJDK 17 | `Microsoft.OpenJDK.17` |

Silent install flags for any winget call:
```powershell
--silent --accept-source-agreements --accept-package-agreements --no-upgrade
```

"Already installed" exit codes to treat as success:
- `0x8A15010D` — another version already installed
- `0x8A15010E` — higher version already installed
- `0x8A150061` — at least one version installed

### Scoop ✅ Recommended for Flutter
Homebrew-equivalent. No admin required. Shim-based PATH (one folder, set once).
Has Flutter and fvm in the `extras` bucket.

```powershell
# Install Scoop (no admin needed)
irm get.scoop.sh | iex
# Add the extras bucket (required for Flutter, fvm, VS Code, Android Studio)
scoop bucket add extras
# Install Flutter dev stack
scoop install git extras/flutter extras/fvm extras/vscode extras/android-studio
```

Scoop is idempotent by design — re-running install skips already-present packages.
PATH updates automatically via the shims directory (`~\scoop\shims\`).

### Chocolatey
Larger package ecosystem. Requires admin elevation. Uses `C:\ProgramData\chocolatey`.

```powershell
# Requires admin
choco install git vscode flutter androidstudio fvm -y --no-progress
```

**Chocolatey has everything we need**, but the admin requirement makes it harder
for developer machines where users may not have elevated sessions.

### Recommendation
**Default path: Scoop.** No admin, clean per-user installs, has all required packages,
idempotent, shim-based PATH is elegant. Chocolatey is the fallback if Scoop fails or
the user is already on Chocolatey. Direct zip download (like our `--no-fvm` path on
Linux) is available as the final fallback.

---

## Critical Windows-Specific Gotchas

### 1. `exit` inside `iex` kills the user's shell

The single most important Windows gotcha for piped install scripts. When a script is
executed via `irm ... | iex`, calling `exit` terminates the entire PowerShell session
the user had open — not just the script.

Scoop's solution (required for us too):
```powershell
$IS_EXECUTED_FROM_IEX = ($null -eq $MyInvocation.MyCommand.Path)

function Exit-Installer {
    param([int]$Code = 0, [string]$Message = '')
    if ($Message) { Write-Host $Message }
    if ($IS_EXECUTED_FROM_IEX) {
        $Global:LASTEXITCODE = $Code
        return   # NOT exit
    }
    exit $Code
}
```

### 2. Long path limit (MAX_PATH = 260 characters)

Flutter's deeply nested pub cache paths routinely exceed 260 characters. This
causes cryptic build failures. Must be enabled before Flutter is installed. Requires
admin:

```powershell
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
    -Name "LongPathsEnabled" -Value 1 -Type DWord
git config --global core.longpaths true
```

### 3. PATH — never use `setx`

`setx` has a hard 1024-character truncation bug that silently destroys PATH entries.
Use `[Environment]::SetEnvironmentVariable` instead:

```powershell
function Add-ToUserPath {
    param([string]$NewPath)
    $current = [Environment]::GetEnvironmentVariable('PATH', 'User')
    $parts = $current -split ';' | Where-Object { $_ -ne '' }
    if ($NewPath -notin $parts) {
        [Environment]::SetEnvironmentVariable('PATH', ($parts + $NewPath) -join ';', 'User')
        $env:PATH = "$NewPath;$env:PATH"  # also update current session
    }
}
```

### 4. Developer Mode required for fvm symlinks

`fvm use <version>` creates symlinks. Windows requires either Developer Mode or
admin elevation to create symlinks. Enable it programmatically (requires admin):

```powershell
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" `
    /t REG_DWORD /f /v "AllowDevelopmentWithoutDevLicense" /d "1"
```

### 5. Execution policy

Default policy blocks scripts. Set to Bypass at Process scope (no permanent change):

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
```

Check if Group Policy has locked it at Machine scope (enterprise machines):
```powershell
Get-ExecutionPolicy -List
# If MachinePolicy is Restricted, there's no scripted workaround
```

### 6. Windows Defender performance and quarantine

Defender frequently quarantines `flutter.bat` and Dart executables after download.
Also causes severe slowdowns during `flutter pub get` and builds.

Add exclusions (requires admin):
```powershell
Add-MpPreference -ExclusionPath "$env:USERPROFILE\scoop\apps\flutter"
Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\Pub\Cache"
```

### 7. TLS 1.2 on older Windows

Force it explicitly — older PS/Windows defaults to TLS 1.0/1.1 which many CDNs reject:

```powershell
[Net.ServicePointManager]::SecurityProtocol = `
    [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
```

### 8. Slow downloads from Invoke-WebRequest

The progress bar causes a 10-100x download speed regression. Always suppress it:

```powershell
$ProgressPreference = 'SilentlyContinue'
```

### 9. Git safe directory after fvm installs

fvm installs Flutter via git on Windows, which marks repos as "unsafe" on Windows.
Add after fvm installs:

```powershell
git config --global --add safe.directory "*"
```

### 10. ARM64 Windows

No special handling needed in our installer. The Flutter SDK zip is a single archive;
Flutter automatically downloads native ARM64 engine binaries on first run when on
ARM64 hardware (this behavior was added in Flutter 3.19, Feb 2024).

---

## Flutter-Specific Windows Requirements

### Prerequisites by target platform

| Target | Requirements |
|---|---|
| Android only | Git, Android Studio (or cmdline-tools), JDK 17 |
| Web only | Git, Chrome |
| Windows desktop | Git + Visual Studio 2022 (or Build Tools) with "Desktop development with C++" workload |
| All targets | Git is always required |

To suppress the Windows desktop warning if not targeting it:
```powershell
flutter config --no-enable-windows-desktop
```

### Install Visual Studio Build Tools (Windows desktop target only)
```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools `
    --override "--add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended --quiet --wait" `
    --silent --accept-source-agreements --accept-package-agreements
```

### Flutter install paths on Windows

Recommended SDK location: `%USERPROFILE%\develop\flutter`
- No spaces in path — `C:\Users\John Doe\flutter` breaks Flutter
- No special characters (`!`, `@`, etc.)
- Must be user-writable without admin

If username has spaces, use `C:\flutter` or `C:\dev\flutter` instead.

### fvm paths on Windows

After `fvm global stable`:
- Flutter/Dart location: `%USERPROFILE%\fvm\default\bin`
- Flutter: `%USERPROFILE%\fvm\default\bin\flutter.bat`
- Dart: `%USERPROFILE%\fvm\default\bin\dart.exe`
- Versions cache: `%USERPROFILE%\fvm\versions\`

fvm has no standalone Windows binary in GitHub releases — must install via
Scoop, Chocolatey, or `dart pub global activate fvm`.

---

## Corporate SSL Proxy (Windows equivalent of `test/certificates/`)

Windows is actually better than macOS/Linux here, but each tool needs separate treatment.

### PowerShell / .NET
On domain-joined machines, corporate CAs pushed via Group Policy are already trusted
by PowerShell's `Invoke-WebRequest` natively. Nothing to do.

### Git (most important)
Git for Windows ships its own OpenSSL bundle and ignores the Windows cert store.
Fix by switching to the Windows certificate store:
```powershell
git config --global http.sslBackend schannel
```
After this, Git trusts whatever the Windows system trusts — including corporate CAs
pushed by Group Policy.

### Java / Gradle (Android builds)
Java has its own `cacerts` store. Must import the corporate CA:
```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -importcert `
    -alias "corporate-ca" -file "C:\certs\corp.pem" `
    -keystore "$env:JAVA_HOME\lib\security\cacerts" `
    -storepass changeit -noprompt
```
Without this, `sdkmanager`, Gradle, and Android SDK downloads will fail behind
a corporate proxy.

### Dart / Flutter pub.dev
```powershell
$env:SSL_CERT_FILE = "C:\certs\corp.pem"
[Environment]::SetEnvironmentVariable("SSL_CERT_FILE", "C:\certs\corp.pem", "User")
```

### Corporate cert detection from Windows store
For an installer that automatically exports the corporate CA:
```powershell
# Find and export any non-Microsoft CA from the trusted root store
$corpCerts = Get-ChildItem Cert:\LocalMachine\Root | Where-Object {
    $_.Subject -notlike "*Microsoft*" -and $_.Subject -notlike "*DigiCert*"
}
```

---

## Architecture Detection

```powershell
$osArch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
$arch = switch ($osArch) {
    'X64'   { 'x64' }
    'Arm64' { 'arm64' }
    default { throw "Unsupported architecture: $osArch" }
}
```

Note: `$env:PROCESSOR_ARCHITECTURE` lies under WOW64 (32-bit process on 64-bit OS).
The RuntimeInformation approach is reliable regardless of process bitness.

---

## Implementation Plan for `windows-install.ps1`

### Feature parity with macOS/Linux scripts

| macOS/Linux feature | Windows equivalent |
|---|---|
| `curl \| bash` one-liner | `irm ... \| iex` |
| `set -euo pipefail` | `$ErrorActionPreference = 'Stop'` + `Set-StrictMode -Version Latest` |
| `trap ... EXIT` | `try { } finally { }` |
| TTY detection | `$null -eq $MyInvocation.MyCommand.Path` |
| `--headless` / `-y` | `-Headless` parameter + `$env:FLEDGING_NONINTERACTIVE` |
| `--flutter-version` | `-FlutterVersion` parameter |
| `--no-fvm` | `-NoFvm` parameter |
| `-v` verbose | `-Verbose` (built-in PS flag) or `-VerboseOutput` |
| `$HOME` recovery | `$env:USERPROFILE` (always set on Windows) |
| Platform detection | `RuntimeInformation.OSArchitecture` |
| PATH persistence | `[Environment]::SetEnvironmentVariable(..., 'User')` |
| Temp cleanup | `try/finally` + `Remove-Item -Recurse -Force` |
| Idempotency | `Get-Command <tool> -ErrorAction SilentlyContinue` |

### Script structure

```powershell
<#
.SYNOPSIS
    fledging Flutter dev environment installer for Windows.
.DESCRIPTION
    One-liner:
    powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/kalebhermes/fledging/main/windows-install.ps1 | iex"
#>

#Requires -Version 5.1

# ── Safety ───────────────────────────────────────────────────────────────────
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProgressPreference = 'SilentlyContinue'   # prevent 100x download slowdown
[Net.ServicePointManager]::SecurityProtocol = `
    [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

# ── IEX detection ─────────────────────────────────────────────────────────
$IS_EXECUTED_FROM_IEX = ($null -eq $MyInvocation.MyCommand.Path)

# ── Parameters ───────────────────────────────────────────────────────────────
param(
    [switch]$NoFvm,
    [string]$FlutterVersion = '',
    [switch]$Headless,
    [switch]$VerboseOutput
)
# Also honor env var (CI-friendly)
if ($env:FLEDGING_NONINTERACTIVE -eq '1') { $Headless = $true }

# ── Main steps ───────────────────────────────────────────────────────────────
# 1. Enable long paths (requires admin — skip gracefully if not admin)
# 2. Set execution policy for process scope
# 3. Detect architecture
# 4. Check/install Scoop
# 5. Add extras bucket
# 6. Install Git via Scoop (required for fvm)
# 7a. (default)   Install fvm via Scoop → fvm install stable → fvm global stable
# 7b. (--no-fvm)  Download Flutter zip from storage.googleapis.com (same JSON as Linux)
# 8. Persist PATH (USERPROFILE\fvm\default\bin or USERPROFILE\develop\flutter\bin)
# 9. Add Windows Defender exclusions (requires admin — skip gracefully)
# 10. Configure git http.sslBackend schannel (corporate proxy fix)
# 11. Enable Developer Mode (requires admin — skip gracefully)
# 12. Hand off to dart pub global run fledging
```

### Step 7b — Direct download fallback (--no-fvm)

The releases JSON and Python/awk parsing from `linux-install.sh` works on Windows too,
but we can use PowerShell's native JSON parsing instead:

```powershell
$releasesUrl = "https://storage.googleapis.com/flutter_infra_release/releases/releases_windows.json"
$releases = (irm $releasesUrl)
$stableHash = $releases.current_release.stable
$release = $releases.releases | Where-Object {
    $_.hash -eq $stableHash -and $_.dart_sdk_arch -eq $arch
} | Select-Object -First 1

$zipUrl = "$($releases.base_url)/$($release.archive)"
```

PowerShell's `irm` deserializes JSON automatically — no awk or Python needed.
SHA256 verification:
```powershell
$actual = (Get-FileHash $zipPath -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $release.sha256) { throw "SHA256 mismatch" }
```

### Elevation strategy

**Do not require admin.** Following Scoop's philosophy:
- Scoop installation: user-level, no admin
- Flutter/fvm via Scoop: user-level, no admin
- PATH modification: User scope, no admin

Steps that benefit from admin but should skip gracefully if not available:
- Long path enablement (log a warning, continue)
- Developer Mode for symlinks (warn the user, fvm may fail without it)
- Windows Defender exclusions (warn, continue without)

If admin IS available, do all three silently. The script should detect and use
elevation opportunistically rather than requiring it.

### Handling `--flutter-version` flag

On the fvm path:
```powershell
$version = if ($FlutterVersion) { $FlutterVersion } else { 'stable' }
fvm install $version
fvm global $version
```

On the `--no-fvm` path: query the `releases_windows.json` for the requested version,
download the matching archive (same approach as `linux-install.sh`'s awk parser, but
using PowerShell's native JSON).

---

## Scoop Package Availability Confirmation

All required packages are available in Scoop:
- `git` — main bucket (default)
- `extras/flutter` — extras bucket
- `extras/fvm` — extras bucket
- `extras/vscode` — extras bucket
- `extras/android-studio` — extras bucket

One-time bucket setup: `scoop bucket add extras`

---

## Known Limitations vs. macOS/Linux

1. **No snap-curl equivalent issue** — winget in SYSTEM context doesn't work (App
   Execution Aliases require user session). For CI, use `Microsoft.WinGet.Client`
   PowerShell module instead of winget CLI.

2. **No `/etc/shells` equivalent** — PATH is modified via Windows registry, not
   shell config files. There's no per-shell (bash/zsh/fish) detection needed on Windows.

3. **musl/glibc detection irrelevant** — Windows uses a single ABI.

4. **Rosetta 2 detection irrelevant** — ARM64 emulation on Windows is transparent
   to the package layer; Flutter handles it internally since 3.19.

5. **fvm symlinks require Developer Mode** — this is a Windows-specific requirement
   with no direct macOS/Linux parallel. The installer should enable it if admin is
   available.
