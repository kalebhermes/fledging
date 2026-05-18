# Flutter Dev Environment Installer — Design Spec

**Date:** 2026-05-18  
**Scope:** Phase 1 — bootstrap script through Flutter/Dart installed, hand off to Dart CLI tool  
**Status:** Draft

---

## Overview

A single command installs a complete Flutter development environment on a fresh machine. The user pastes one line into their terminal; the script handles everything from Xcode CLT through Flutter, then hands off to a Dart CLI tool (`fledging`) that finishes the rest of the setup (VS Code, Xcode, Android Studio, simulators, emulators, etc.).

This spec covers Phase 1: the shell bootstrap script (`install.sh`) for macOS. Windows and Linux are explicitly planned but out of scope for Phase 1.

---

## Architecture

**Thin shell bootstrap + Dart handles the rest.**

The shell script does only the minimum required to get Dart running:

1. Install system prerequisites (CLT, Homebrew)
2. Install Flutter (via fvm or direct download)
3. Activate and invoke the `fledging` Dart CLI tool from pub.dev

All remaining setup logic lives in the Dart tool (`packages/fledging_cli/`), which is published to pub.dev as `fledging`. This keeps the shell script small and stable; new install behaviors are added to the Dart side without touching the bootstrap.

**Why this split:** Dart is typed, testable, and cross-platform. When Windows and Linux support are added, each gets a thin OS-specific bootstrap (PowerShell for Windows, same bash script extended for Linux) that all converge on the same `dart pub global run fledging` handoff.

---

## Repo Structure

```
fledging/
├── install.sh               # macOS/Linux bootstrap
├── install.ps1              # Windows bootstrap (future)
├── packages/
│   └── fledging_cli/        # Dart tool, published to pub.dev as "fledging"
│       ├── pubspec.yaml
│       ├── bin/
│       │   └── fledging.dart
│       └── lib/
└── docs/
    └── superpowers/
        └── specs/
```

---

## User-Facing Interface

**Invocation:**
```sh
curl -fsSL https://raw.githubusercontent.com/<org>/fledging/main/install.sh | bash
```
`<org>` is a placeholder — exact hosting URL is a deployment decision; script logic is independent of it.

**Flags:**

| Flag | Default | Behavior |
|---|---|---|
| `--no-fvm` | off | Skip fvm; download Flutter zip directly from Google CDN |
| `--flutter-version <ver>` | latest stable | Install a specific Flutter version (works with or without `--no-fvm`) |
| `--headless` / `-y` | off | Skip all confirmations; also honored via `FLEDGING_NONINTERACTIVE=1` |
| `-v` / `--verbose` | off | Print every command and its output as the script runs |

**Default behavior (no flags):** install fvm via Homebrew, install latest stable Flutter through fvm.

---

## macOS Bootstrap Flow

Steps execute sequentially. The script exits immediately on any failure (`set -euo pipefail`).

### 1. Parse and validate args
Read all flags. Fail fast on **unknown flags** before touching the system. Abort with a clear error if `--headless` and `--interactive` are both set (contradictory).

### 2. Detect OS and architecture
- `uname -s` → OS  
- `uname -m` → machine type  
- **`$OS = Windows_NT`** checked before `uname` — reliable under Git Bash/MSYS2 where `uname` returns mangled strings  
- **Rosetta 2:** `sysctl -n sysctl.proc_translated 2>/dev/null` returns `1` when running under Rosetta on Apple Silicon — use `arm64` in that case regardless of what `uname -m` reports  
- **`aarch64` and `arm64`** both map to the same target (Linux reports the former, macOS the latter)  
- **`getconf LONG_BIT`** double-check on Linux: `uname -m` lies on a 64-bit kernel with 32-bit userspace (common on older ARM boards); `getconf LONG_BIT` checks actual C library word size  
- **musl detection:** `ldd /bin/ls | grep musl` — needed on Alpine Linux to select the right Flutter build  
- Maps final result to `arm64` or `x64` for Google's releases JSON

### 3. Check / install Xcode Command Line Tools
- Check: `xcode-select -p`
- If missing:
  - **Headless:** `softwareupdate --install "Command Line Tools*"`
  - **Interactive:** trigger `xcode-select --install` dialog, wait for completion
- Provides: git, curl, and other essentials

### 4. Check / install Homebrew
- Check: `command -v brew`
- If missing: run official Homebrew install script via curl
  - In headless mode, set `NONINTERACTIVE=1` before invoking (Homebrew respects this)
- Skip entirely if already present

### 5a. FVM path (default, no `--no-fvm`)
1. Skip if `fvm` already in PATH
2. `brew install fvm`
3. Determine Flutter version:
   - `--flutter-version` passed → `fvm install <version>`
   - No version flag → `fvm install stable`
4. `fvm global <version>` (or `fvm global stable`)
5. Export `$HOME/fvm/default/bin` to `$PATH` inline so `dart` is available for the rest of this session

### 5b. Direct download path (`--no-fvm`)
1. Skip if `flutter` already in PATH
2. Fetch `https://storage.googleapis.com/flutter_infra_release/releases/releases_macos.json`
3. Find the release entry matching:
   - `channel == stable` + detected arch (or `version == <requested>` if `--flutter-version` passed)
4. Build download URL: `base_url + "/" + archive`
5. Download zip to `$HOME/.fledging/tmp` (user-owned — avoids `/tmp` noexec mount issues)
   - Download to `$HOME/.fledging/tmp/flutter.zip.part` first; promote to `.zip` only on success
   - Use `curl --fail --location --show-error --retry 3`; fall back to `wget` if curl is absent or is a snap package (`command -v curl | grep /snap/` → skip it)
6. Verify SHA256 using `shasum -a 256` (macOS) or `sha256sum` (Linux) against the `sha256` field in the releases JSON — on mismatch, delete the download and exit with a clear error
7. Extract to `~/development/flutter`; `chmod +x` the flutter binary before moving it into place
8. Export `~/development/flutter/bin` to `$PATH` inline
9. `trap 'rm -rf "$HOME/.fledging/tmp"' EXIT` ensures temp files are cleaned up on both success and failure

**Upgrade path for `--no-fvm` users:** The zip includes a `.git` directory (Google ships it this way intentionally). `flutter upgrade` runs `git fetch --tags` + `git reset --hard` inside `~/development/flutter` and works exactly as it does with a git-cloned install.

### 6. Persist PATH changes
Detect active shell via `basename "$SHELL"`. Unknown shells fall through to a manual-instructions printout — never fail silently.

| Shell | Config file | Syntax |
|---|---|---|
| bash (macOS) | `~/.bash_profile` | `export PATH="<dir>:$PATH"` |
| bash (Linux) | `~/.bashrc` | `export PATH="<dir>:$PATH"` |
| zsh | `${ZDOTDIR:-$HOME}/.zshrc` | `export PATH="<dir>:$PATH"` |
| fish | `~/.config/fish/config.fish` | `fish_add_path <dir>` |
| unknown | — | print manual instructions |

Before appending: grep for an existing entry broad enough to catch manual additions (e.g. `grep -qE "(FLEDGING|fledging|flutter|fvm)" "$config"`). If found, skip. If the config file is a symlink (dotfile managers like chezmoi/stow use these), handle it — check `[ -f ] || [ -h ]`.

Write atomically: write to `$config.tmp`, then `mv -f` to final. Never write in-place.

Back up the config file before modifying it: `cp "$config" "$config.pre-fledging-$(date +%Y-%m-%d_%H-%M-%S)"`.

Changes take effect in new shells; the current session already has PATH set from step 5.

### 7. Hand off to Dart tool
```sh
# FVM path
fvm dart pub global activate fledging
fvm dart pub global run fledging

# No-FVM path
dart pub global activate fledging
dart pub global run fledging
```

Using `dart pub global run` rather than invoking `fledging` directly avoids depending on `~/.pub-cache/bin` being in `$PATH` at script execution time.

---

## Script Robustness

Patterns adopted from auditing Homebrew, rustup, bun, starship, mise, deno, volta, oh-my-zsh, flyctl, sdkman, and webi.

**Environment safety:**
- `$USER` recovery: `USER=${USER:-$(id -u -n)}` — containers often don't set it
- `$HOME` recovery: `HOME="${HOME:-$(getent passwd $USER 2>/dev/null | cut -d: -f6)}"` then `HOME="${HOME:-$(eval echo ~$USER)}"` — the `eval` fallback works on macOS where `getent` is absent
- `POSIXLY_CORRECT` detection: if set, bash changes word splitting and disables arrays — abort with an explanation
- All optional env vars accessed as `${VAR:-}` to be safe under `set -u`

**TTY handling:**
- `is_tty()` is evaluated **once at script startup** and baked into a function — subshells can't reliably re-check `[ -t 1 ]` because their fd 1 is always a pipe:
  ```sh
  if [ -t 1 ]; then is_tty() { true; }; else is_tty() { false; }; fi
  ```
- Color variables are defined as empty strings first; overridden only when `is_tty` is true — no per-call branching needed
- `read -r response </dev/tty` for any interactive prompt — stdin is consumed by the pipe in `curl | bash`; `/dev/tty` reconnects to the real keyboard
- `set +e` around `read`, capture `$?`, then `set -e` — `read` returns non-zero on EOF and would silently abort the script otherwise
- All diagnostic output (`info`, `warn`, `error`) goes to **stderr** (fd 2) — stdout must stay clean for command substitution

**Dependency checks:**
- `need_cmd` function called upfront for every required tool before touching the system — one clear "command not found: X" beats a cryptic failure mid-install
- **Snap curl detection:** `command -v curl | grep /snap/` → fall back to `wget`. Ubuntu's snap-packaged curl has broken SSL cert handling for GitHub downloads (real, documented bug)
- curl → wget fallback with hard error if neither is present

**Process safety:**
- `ensure` wrapper for must-not-fail commands: `ensure() { if ! "$@"; then err "command failed: $*"; exit 1; fi }`
- `ignore` wrapper for error-path cleanup so cleanup failures never mask the real error
- Subshell failures in `$(...)` do not automatically propagate with `set -e` — always add `|| exit 1` after critical subshell assignments

---

## Error Handling

- `set -euo pipefail` — exit immediately on any unhandled error
- Each step checks its own precondition before running
- Failed steps print a human-readable message with the likely cause and, where applicable, a docs URL
- SHA256 mismatch on zip download: delete partial file, exit with message
- Partial installs: if the script exits mid-way, re-running is safe — already-installed steps are detected and skipped (idempotent)

---

## Verbose and Headless Modes

**Verbose (`-v`):**  
Every shell command is printed before execution. stdout/stderr from each command is shown in real time. Default (non-verbose) shows only high-level status lines: `==> Installing Homebrew...`, `==> Installing Flutter...`, etc. Errors print regardless of verbosity.

**Headless (`--headless` / `-y` / `FLEDGING_NONINTERACTIVE=1`):**  
- Pre-flight confirmation prompt is auto-accepted
- Xcode CLT uses `softwareupdate` (no interactive dialog)
- Homebrew install script runs with `NONINTERACTIVE=1`
- No user input is ever required

---

## Idempotency

The script is safe to re-run. Before each install step, the script checks whether the tool is already present and skips if so:

| Tool | Check |
|---|---|
| Xcode CLT | `xcode-select -p` |
| Homebrew | `command -v brew` |
| fvm | `command -v fvm` |
| Flutter (no-fvm) | `command -v flutter` |

No existing installs are overwritten or upgraded. If a user wants to upgrade, they use the tool's native mechanism (`brew upgrade fvm`, `flutter upgrade`, etc.).

---

## Future Platforms

**Linux:** Same `install.sh`. Replace CLT install step with a distro-aware package manager check (`apt`, `dnf`, etc.) for git/curl. Homebrew on Linux is supported; the rest of the flow is identical to macOS.

**Windows:** Separate `install.ps1`. Install git and Flutter via `winget` or `scoop`, then hand off to the same `dart pub global run fledging` command. All post-Flutter setup logic in the Dart tool requires no changes.

---

## Out of Scope (Phase 1)

- VS Code, Xcode, Android Studio, simulators, emulators — handled by the Dart tool
- Windows bootstrap (`install.ps1`)
- Linux bootstrap extensions to `install.sh`
- The `fledging_cli` Dart package itself (separate spec/phase)
- Hosted URL / custom domain for the install script
- pub.dev package name confirmation

---

## Nice to Have (Future)

These were identified during research but are explicitly deferred. Add them when polishing for broader adoption.

**`$CI` auto-detection → headless mode**
When any CI system (GitHub Actions, CircleCI, Bitrise, Jenkins, etc.) is active it sets `$CI=true`. The script should detect this automatically and enable headless mode without requiring `--headless` to be passed:
```sh
if [ -n "${CI-}" ]; then
  FLEDGING_NONINTERACTIVE=1
fi
```
This means CI pipelines that forget to pass `--headless` still work silently rather than hanging on a prompt.

**`verify_sha256` — fail instead of warn when no SHA tool available**
Currently `verify_sha256` warns and returns 0 when neither `shasum` nor `sha256sum` is found, allowing the Flutter zip to be extracted without integrity verification. In practice this never triggers (macOS ships `shasum`, Linux ships `sha256sum`), but the fail-open behavior is architecturally wrong. Future hardening: turn the `else` branch into `error + exit 1`, or at minimum make it fatal when `HEADLESS=true`. Low urgency — the only environment where this matters is a deliberately stripped container, and `unzip` (also required) would fail first.

**`FLEDGING_MIRROR` env var for download source override**
Allow the Google CDN base URL to be swapped out via env var:
```sh
FLEDGING_MIRROR="${FLEDGING_MIRROR:-https://storage.googleapis.com}"
```
Useful for corporate environments with GitHub/Google mirrors, air-gapped installs, and users in regions where Google CDN is blocked. The same pattern appears in rustup (`RUSTUP_UPDATE_ROOT`), bun (`GITHUB`), starship (`BASE_URL`), and Homebrew.
