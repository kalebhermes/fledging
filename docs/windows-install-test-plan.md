# Windows Installer Test Plan (`windows-install.ps1`)

A manual verification runbook for confirming `windows-install.ps1` works end-to-end
on a **clean Windows machine**. The Pester unit tests in `test/windows-install.tests.ps1`
cover logic and orchestration with mocks; this plan covers the real installs, real
PATH persistence, real registry/Defender changes, and the handoff to the fledging
Dart tool — the things unit tests can't exercise.

Every step lists the exact command to run and a **✅ Verify** block with a command
and the expected result. A scenario passes only when every Verify in it passes.

---

## 1. Scope

| In scope | Out of scope |
|---|---|
| fvm (default) path | Actually shipping a Flutter app |
| `-NoFvm` direct-download path | Android Studio / VS Code installs (not installed by this script) |
| `-Headless` / `FLEDGING_NONINTERACTIVE` CI mode | Visual Studio Build Tools (Windows-desktop target) |
| `-FlutterVersion` pinning | Chocolatey fallback (not implemented) |
| Admin vs non-admin behavior | |
| Re-run idempotency | |
| PATH persistence across a new shell | |
| Corporate SSL proxy (schannel) — optional | |

---

## 2. Test environments

Pick at least one clean environment per run. **Windows Sandbox** is the fastest because
it resets to a pristine state every time it closes.

### Option A — Windows Sandbox (recommended for repeatable clean runs)
Requires Windows 10/11 Pro or Enterprise with virtualization enabled.

1. Enable once (admin PowerShell), then reboot:
   ```powershell
   Enable-WindowsOptionalFeature -FeatureName "Containers-DisposableClientVM" -All -Online
   ```
2. Launch **Windows Sandbox** from the Start menu. Every launch is a fresh Windows install.

> ⚠️ Sandbox limitation: it always runs **elevated**, so it can't exercise the
> non-admin graceful-skip paths. Use a standard user account (Option B) for those.

### Option B — Fresh VM or spare machine
A clean Windows 11 VM (Hyper-V, VMware, Parallels, UTM on Apple Silicon for arm64).
Create a **standard (non-admin) user** to test the graceful-skip behavior, and test
again from an **elevated** session for the admin paths.

### Coverage matrix

| Environment | x64 | arm64 | admin | non-admin |
|---|:---:|:---:|:---:|:---:|
| Sandbox | ✔ | ✔ (on ARM host) | ✔ | — |
| VM / machine (std user) | ✔ | ✔ | — | ✔ |
| VM / machine (elevated) | ✔ | ✔ | ✔ | — |

Aim to cover at least: **x64 non-admin fvm**, **x64 admin fvm**, and **x64 `-NoFvm`**.
Add **arm64 fvm** if ARM hardware is available.

---

## 3. Baseline — confirm the machine is actually clean

Run in PowerShell **before** installing. Every command should report *absent*.

```powershell
Get-Command scoop, flutter, dart, fvm, git -ErrorAction SilentlyContinue
```
✅ **Verify:** prints nothing (no commands found). If any resolve, the machine is not
clean — reset the Sandbox or use a fresh user profile.

```powershell
[Environment]::GetEnvironmentVariable('PATH','User')
```
✅ **Verify:** no `flutter`, `fvm`, or `scoop\shims` entries present.

Record whether the session is elevated — it changes which admin steps run:
```powershell
([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
```
✅ **Verify:** note the result (`True` = admin, `False` = standard). Used in §5.

---

## 4. Getting the script onto the test machine

**For the piped one-liner (default interactive fvm path):**
```powershell
powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/kalebhermes/fledging/main/windows-install.ps1 | iex"
```

**For any scenario that needs flags** (`-NoFvm`, `-FlutterVersion`, `-Headless`), the
`irm | iex` form can't pass parameters — download first, then invoke:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
irm https://raw.githubusercontent.com/kalebhermes/fledging/main/windows-install.ps1 -OutFile "$env:TEMP\windows-install.ps1"
& "$env:TEMP\windows-install.ps1" <flags>
```

> When testing an unmerged branch, replace `main` in the URL with the branch name,
> or copy the local `windows-install.ps1` into the VM and run it directly.

---

## 5. Scenarios

Reset to a clean baseline (§3) between scenarios. In a Sandbox, close and relaunch.

---

### Scenario A — Default fvm path, interactive

**Run:**
```powershell
& "$env:TEMP\windows-install.ps1"
```
- At the `Press ENTER to continue…` prompt, press **ENTER**.

**Expected console flow (order matters):**
1. `This script will install:` summary listing Scoop, Git, fvm, Flutter (latest stable)
2. Long-path step (enables it if admin, or warns + continues if not)
3. `Installing Scoop...` → `Scoop installed`
4. `Adding Scoop extras bucket...`
5. `Installing git via Scoop...`
6. `Installing fvm...` → `Installing Flutter stable via fvm...` → `Flutter stable installed via fvm`
7. Git schannel + Developer Mode + Defender steps (each runs or warns based on admin)
8. `Added …\fvm\default\bin to your user PATH`
9. `Flutter is installed. Handing off to fledging...`

✅ **Verify — tools present in a NEW shell** (open a fresh PowerShell window so PATH is reloaded):
```powershell
scoop --version
fvm --version
fvm dart --version
Get-Command flutter, dart, fvm, git
```
Expected: all resolve; `fvm dart --version` prints a Dart version.

✅ **Verify — Flutter is functional:**
```powershell
fvm flutter doctor -v
```
Expected: runs and reports Flutter/Dart from the fvm-managed SDK. Android/VS toolchain
warnings are acceptable (this script installs neither).

✅ **Verify — install locations:**
```powershell
Test-Path "$env:USERPROFILE\fvm\default\bin\dart.exe"
Test-Path "$env:USERPROFILE\fvm\default\bin\flutter.bat"
```
Expected: both `True`.

✅ **Verify — PATH persisted to the User scope (survives reboot / new shells):**
```powershell
[Environment]::GetEnvironmentVariable('PATH','User') -split ';' | Select-String 'fvm\\default\\bin'
```
Expected: one matching entry.

✅ **Verify — git safe.directory set** (fvm uses a git checkout):
```powershell
git config --global --get-all safe.directory
```
Expected: includes `*`.

---

### Scenario B — Direct download path (`-NoFvm`)

**Run:**
```powershell
& "$env:TEMP\windows-install.ps1" -NoFvm -Headless
```

✅ **Verify — Flutter installed to the direct location** (no fvm):
```powershell
# Standard profile (no spaces in username):
Test-Path "$env:USERPROFILE\develop\flutter\bin\flutter.bat"
```
Expected: `True`. (If the username contains a space, the script uses `C:\dev\flutter\bin`
instead — check there: `Test-Path 'C:\dev\flutter\bin\flutter.bat'`.)

✅ **Verify — fvm was NOT installed on this path:**
```powershell
Get-Command fvm -ErrorAction SilentlyContinue
```
Expected: nothing (fvm is only installed on the default path).

✅ **Verify — flutter works from a new shell:**
```powershell
flutter --version
```
Expected: prints a stable Flutter version.

✅ **Verify — PATH persisted:**
```powershell
[Environment]::GetEnvironmentVariable('PATH','User') -split ';' | Select-String 'flutter\\bin'
```
Expected: one matching entry.

---

### Scenario C — Headless / CI mode

Purpose: confirm no interactive prompt when non-interactive is signaled.

**Run (env-var form, as CI would):**
```powershell
$env:FLEDGING_NONINTERACTIVE = '1'
& "$env:TEMP\windows-install.ps1"
```

✅ **Verify:** the script runs to completion **without** stopping at the
`Press ENTER to continue…` prompt.

✅ **Verify (flag form):** on a clean machine, `& "$env:TEMP\windows-install.ps1" -Headless`
also runs with no prompt.

Clean up the env var afterward: `Remove-Item Env:\FLEDGING_NONINTERACTIVE`.

---

### Scenario D — Pinned Flutter version

**Run** (pick a real published stable, e.g. `3.19.0`):
```powershell
& "$env:TEMP\windows-install.ps1" -FlutterVersion 3.19.0 -Headless
```

✅ **Verify (fvm path):**
```powershell
fvm flutter --version
```
Expected: reports `3.19.0`.

✅ **Verify (direct path):** repeat with `-NoFvm -FlutterVersion 3.19.0`, then:
```powershell
flutter --version
```
Expected: reports `3.19.0`.

✅ **Verify — bogus version fails cleanly:**
```powershell
& "$env:TEMP\windows-install.ps1" -NoFvm -FlutterVersion 9.99.99 -Headless
```
Expected: exits with an error mentioning `9.99.99 not found` — **not** a crash or a
half-installed state, and it must not kill the shell.

---

### Scenario E — Admin session (system-level steps applied)

Run any scenario from an **elevated** PowerShell, then confirm the admin-only changes landed.

✅ **Verify — long paths enabled:**
```powershell
(Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled).LongPathsEnabled
git config --global --get core.longpaths
```
Expected: `1` and `true`.

✅ **Verify — Developer Mode enabled (for fvm symlinks):**
```powershell
(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' -Name AllowDevelopmentWithoutDevLicense).AllowDevelopmentWithoutDevLicense
```
Expected: `1`.

✅ **Verify — Defender exclusions added:**
```powershell
(Get-MpPreference).ExclusionPath
```
Expected: includes the Flutter SDK path and `...\Pub\Cache`.

✅ **Verify — git uses the Windows cert store:**
```powershell
git config --global --get http.sslBackend
```
Expected: `schannel`.

---

### Scenario F — Non-admin graceful skip

Run a scenario from a **standard (non-admin)** session (Option B environment).

✅ **Verify — the install still completes** and Flutter is usable (repeat the
Scenario A/B tool checks).

✅ **Verify — admin-only steps warned instead of failing.** In the console output, confirm
warnings like:
- `Skipping long-path support (needs admin)...`
- `Skipping Developer Mode (needs admin)...`
- `Skipping Windows Defender exclusions (needs admin)...`

The script must **not** throw or abort because it lacks admin.

✅ **Verify — git schannel still applied** (needs no admin):
```powershell
git config --global --get http.sslBackend
```
Expected: `schannel`.

---

### Scenario G — Re-run idempotency

Run the **same** scenario a second time on a machine where it already succeeded.

✅ **Verify — the script skips already-installed tools** rather than reinstalling. Expected
console messages:
- `Scoop already installed`
- `Scoop extras bucket already present`
- `fvm already installed` (fvm path) **or** `Flutter already installed` (direct path)
- `PATH already contains …` (no duplicate PATH entry)

✅ **Verify — PATH has no duplicate entry:**
```powershell
$p = [Environment]::GetEnvironmentVariable('PATH','User') -split ';'
($p | Where-Object { $_ -match 'fvm\\default\\bin|flutter\\bin' }).Count
```
Expected: `1`.

✅ **Verify — second run exits 0:**
```powershell
$LASTEXITCODE
```
Expected: `0`.

---

### Scenario H — Corporate SSL proxy (optional, corp network only)

On a machine behind a TLS-inspecting proxy (e.g. Zscaler) with the corporate root CA
already trusted by Windows:

✅ **Verify — downloads succeed** (the script's `Invoke-WebRequest`/`Invoke-RestMethod`
calls use .NET, which honors the Windows cert store).

✅ **Verify — git operations through fvm succeed** after `http.sslBackend schannel` is set
(Scenario A already installs it). `fvm flutter doctor` should not report TLS/cert errors
fetching from pub.dev.

---

## 6. Cross-cutting checks (run after any successful scenario)

✅ **iex one-liner does not kill the shell on error.** From a session you care about, run a
guaranteed-to-fail invocation and confirm the PowerShell window stays open:
```powershell
& "$env:TEMP\windows-install.ps1" -NoFvm -FlutterVersion 9.99.99 -Headless
"still alive: $?"
```
Expected: an error is printed, then `still alive:` prints — the session survives.

✅ **New shell inherits PATH.** Close every PowerShell window, open a brand-new one, and run
`flutter --version` (or `fvm --version`). Expected: resolves without re-sourcing anything.

---

## 7. Teardown (reset for the next run)

In **Windows Sandbox**, just close it — state is discarded. On a persistent VM/machine:

```powershell
scoop uninstall flutter fvm git -g 2>$null
scoop uninstall scoop 2>$null
Remove-Item -Recurse -Force "$env:USERPROFILE\scoop","$env:USERPROFILE\fvm","$env:USERPROFILE\develop","C:\dev\flutter" -ErrorAction SilentlyContinue

# Strip installer-added entries from the User PATH
$clean = ([Environment]::GetEnvironmentVariable('PATH','User') -split ';' |
    Where-Object { $_ -and $_ -notmatch 'scoop\\shims|fvm\\default\\bin|flutter\\bin' }) -join ';'
[Environment]::SetEnvironmentVariable('PATH', $clean, 'User')

# Optional: revert git globals set by the installer
git config --global --unset http.sslBackend
git config --global --unset core.longpaths
git config --global --unset-all safe.directory
```

> Registry changes (LongPaths, Developer Mode) and Defender exclusions are system-wide.
> Prefer a disposable Sandbox/VM so you never have to hand-revert these.

---

## 8. Sign-off checklist

A release of `windows-install.ps1` is verified when:

- [ ] Baseline (§3) confirmed clean before each scenario
- [ ] **Scenario A** — fvm path: tools present in a new shell, `fvm flutter doctor` runs, PATH persisted
- [ ] **Scenario B** — `-NoFvm`: Flutter at the direct path, no fvm, `flutter --version` works
- [ ] **Scenario C** — headless: no prompt via env var and via `-Headless`
- [ ] **Scenario D** — pinned version installs; bogus version fails cleanly
- [ ] **Scenario E** — admin: long paths, Developer Mode, Defender exclusions, schannel all applied
- [ ] **Scenario F** — non-admin: completes with warnings, no abort
- [ ] **Scenario G** — re-run skips installed tools, no duplicate PATH, exits 0
- [ ] **Scenario H** — corp proxy (if applicable): downloads and git succeed
- [ ] **Cross-cutting** — iex error doesn't kill the shell; new shell inherits PATH
- [ ] Tested on x64; arm64 tested if hardware available
