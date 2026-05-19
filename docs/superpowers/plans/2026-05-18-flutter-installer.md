# Flutter Installer (`install.sh`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `install.sh`, a macOS bash bootstrap that installs Xcode CLT, Homebrew, Flutter (via fvm or direct zip), then hands off to `dart pub global run fledging`.

**Architecture:** Single bash script (~450 lines). One function per step. Functions are individually testable via BATS by sourcing the script — a `return 0 2>/dev/null` guard at the bottom prevents `main()` from running when sourced. External command calls are wrapped in thin `_get_*` helpers so tests can override them via function shadowing without PATH manipulation.

**Tech Stack:** bash 4+, `bats-core` for testing, `python3` for Flutter releases JSON parsing (available on macOS after CLT, pre-installed on most Linux).

---

## File Map

| File | Purpose |
|---|---|
| `install.sh` | Complete bootstrap script |
| `test/test_helper.bash` | Shared BATS helpers: `mock_cmd`, `stub_fn` |
| `test/install.bats` | All unit tests |

---

### Task 1: Test Infrastructure

**Files:**
- Create: `test/test_helper.bash`
- Create: `test/install.bats`

- [ ] **Step 1: Install bats-core**

```bash
brew install bats-core
```

Expected: `bats --version` prints something like `Bats 1.x.x`

- [ ] **Step 2: Create test helper**

```bash
# test/test_helper.bash

# Override a shell function for a single test.
# Usage: stub_fn <name> <body>
# Example: stub_fn xcode-select 'return 0'
stub_fn() {
  local name="$1"
  local body="$2"
  eval "${name}() { ${body}; }"
}
```

- [ ] **Step 3: Create test skeleton**

```bash
# test/install.bats
#!/usr/bin/env bats

load 'test_helper'

setup() {
  source "${BATS_TEST_DIRNAME}/../install.sh"
}

@test "sourcing the script does not call main" {
  # If main() ran, FLEDGING_OS would be set by detect_platform
  # We verify it's empty, proving main() did not execute
  [ -z "${FLEDGING_OS:-}" ]
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `1 test, 0 failures` (the source test fails until install.sh exists — that's fine, it's a failing test first)

- [ ] **Step 5: Create empty install.sh to make the source test pass**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Sourceable for testing — return exits without running main when sourced
return 0 2>/dev/null
```

- [ ] **Step 6: Run tests again**

```bash
bats test/install.bats
```

Expected: `1 test, 0 failures`

- [ ] **Step 7: Commit**

```bash
git add install.sh test/test_helper.bash test/install.bats
git commit -m "feat: add test infrastructure and empty install.sh scaffold"
```

---

### Task 2: Script Constants and Skeleton

**Files:**
- Modify: `install.sh`

- [ ] **Step 1: Write the failing test**

Add to `test/install.bats`:

```bash
@test "FLEDGING_VERSION constant is defined" {
  [ -n "$FLEDGING_VERSION" ]
}

@test "FLEDGING_TMP is under HOME" {
  [[ "$FLEDGING_TMP" == "$HOME"* ]]
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 2 new tests fail with `FLEDGING_VERSION: unbound variable`

- [ ] **Step 3: Add constants to install.sh**

Replace the content of `install.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Constants
# ============================================================

FLEDGING_VERSION="0.1.0"
FLEDGING_TMP="${HOME}/.fledging/tmp"

FLUTTER_RELEASES_BASE="https://storage.googleapis.com/flutter_infra_release/releases"

# Globals set during execution
FLEDGING_OS=""     # "macos" | "linux"
FLEDGING_ARCH=""   # "arm64" | "x64"

# Flags (set by parse_args)
NO_FVM=false
FLUTTER_VERSION=""
HEADLESS=false
VERBOSE=false

# ============================================================
# Sourceable for testing — return exits without running main
# ============================================================
return 0 2>/dev/null

main "$@"
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `3 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add script constants and skeleton"
```

---

### Task 3: Utility Functions

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "need_cmd: exits 1 for missing command" {
  run need_cmd "definitely-not-a-real-cmd-xyz-abc"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Required command not found: definitely-not-a-real-cmd-xyz-abc" ]]
}

@test "need_cmd: succeeds for present command" {
  run need_cmd bash
  [ "$status" -eq 0 ]
}

@test "ensure: exits 1 when command fails" {
  run ensure false
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Command failed: false" ]]
}

@test "ensure: succeeds when command succeeds" {
  run ensure true
  [ "$status" -eq 0 ]
}

@test "ignore: swallows errors from failing commands" {
  run ignore false
  [ "$status" -eq 0 ]
}

@test "info/warn/error: output goes to stderr" {
  run bash -c 'source install.sh; info "hello" 2>/dev/null'
  [ "$status" -eq 0 ]
  [ -z "$output" ]  # stdout is empty

  run bash -c 'source install.sh; info "hello" 2>&1 >/dev/null'
  [[ "$output" =~ "hello" ]]  # stderr has content
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 6 new tests fail

- [ ] **Step 3: Implement utilities — add to install.sh before the return guard**

```bash
# ============================================================
# TTY detection — evaluated once at startup, subshell-safe.
# Subshells always have fd 1 as a pipe, so [ -t 1 ] inside
# $(...) always returns false. Baking the result here fixes that.
# ============================================================
if [ -t 1 ]; then
  is_tty() { true; }
else
  is_tty() { false; }
fi

# ============================================================
# Colors — empty strings when not a TTY; no per-call branching
# ============================================================
if is_tty; then
  BOLD="\033[1m"
  RED="\033[31m"
  GREEN="\033[32m"
  YELLOW="\033[33m"
  CYAN="\033[36m"
  RESET="\033[0m"
else
  BOLD="" RED="" GREEN="" YELLOW="" CYAN="" RESET=""
fi

# ============================================================
# Output — ALL diagnostic output goes to stderr so stdout
# stays clean for command substitution
# ============================================================
info()  { command printf "${CYAN}==>${RESET} ${BOLD}%s${RESET}\n" "$*" >&2; }
warn()  { command printf "${YELLOW}Warning${RESET}: %s\n" "$*" >&2; }
error() { command printf "${RED}Error${RESET}: %s\n" "$*" >&2; }

# ============================================================
# Utility wrappers
# ============================================================

# Exit 1 if a required command is not in PATH
need_cmd() {
  if ! command -v "$1" > /dev/null 2>&1; then
    error "Required command not found: $1"
    exit 1
  fi
}

# Run a command; exit 1 with a clear message if it fails.
# Use for operations that should never fail.
ensure() {
  if ! "$@"; then
    error "Command failed: $*"
    exit 1
  fi
}

# Run a command, swallowing all errors.
# Use in error-path cleanup so cleanup never masks the real error.
ignore() {
  "$@" 2>/dev/null || true
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `9 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add utility functions (need_cmd, ensure, ignore, TTY, colors, output)"
```

---

### Task 4: Environment Recovery

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "recover_env: sets USER from id -u -n when unset" {
  (
    unset USER
    source "${BATS_TEST_DIRNAME}/../install.sh"
    recover_env
    [ -n "$USER" ]
  )
}

@test "recover_env: sets HOME from eval echo ~USER when unset" {
  (
    unset HOME
    source "${BATS_TEST_DIRNAME}/../install.sh"
    recover_env
    [ -n "$HOME" ]
    [[ "$HOME" == /* ]]  # must be an absolute path
  )
}

@test "recover_env: aborts if POSIXLY_CORRECT is set" {
  run bash -c 'POSIXLY_CORRECT=1 source install.sh; recover_env'
  [ "$status" -eq 1 ]
  [[ "$output" =~ "POSIXLY_CORRECT" ]]
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 3 new tests fail

- [ ] **Step 3: Implement recover_env — add to install.sh**

```bash
# ============================================================
# Environment recovery
# ============================================================
recover_env() {
  # USER is defined by login(1) which is not always executed (e.g. containers)
  USER="${USER:-$(id -u -n)}"
  export USER

  # HOME multi-level recovery: getent (Linux) → eval echo ~USER (macOS/all)
  HOME="${HOME:-$(getent passwd "$USER" 2>/dev/null | cut -d: -f6)}"
  HOME="${HOME:-$(eval echo ~"$USER")}"
  export HOME

  # POSIXLY_CORRECT changes bash word splitting and disables arrays.
  # Our script relies on bash arrays; abort with an explanation.
  if [[ -n "${POSIXLY_CORRECT+1}" ]]; then
    error "POSIXLY_CORRECT is set. Please unset it and re-run:"
    error "  unset POSIXLY_CORRECT && bash install.sh"
    exit 1
  fi
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `12 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add environment recovery (USER, HOME, POSIXLY_CORRECT guard)"
```

---

### Task 5: Arg Parsing

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "parse_args: --no-fvm sets NO_FVM=true" {
  parse_args --no-fvm
  [ "$NO_FVM" = "true" ]
}

@test "parse_args: --flutter-version sets FLUTTER_VERSION" {
  parse_args --flutter-version 3.19.0
  [ "$FLUTTER_VERSION" = "3.19.0" ]
}

@test "parse_args: --flutter-version requires a value" {
  run parse_args --flutter-version
  [ "$status" -eq 1 ]
  [[ "$output" =~ "--flutter-version requires a value" ]]
}

@test "parse_args: --headless sets HEADLESS=true" {
  parse_args --headless
  [ "$HEADLESS" = "true" ]
}

@test "parse_args: -y sets HEADLESS=true" {
  parse_args -y
  [ "$HEADLESS" = "true" ]
}

@test "parse_args: -v sets VERBOSE=true" {
  parse_args -v
  [ "$VERBOSE" = "true" ]
}

@test "parse_args: --verbose sets VERBOSE=true" {
  parse_args --verbose
  [ "$VERBOSE" = "true" ]
}

@test "parse_args: unknown flag exits 1" {
  run parse_args --does-not-exist
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Unknown flag: --does-not-exist" ]]
}

@test "parse_args: FLEDGING_NONINTERACTIVE=1 env var sets HEADLESS" {
  FLEDGING_NONINTERACTIVE=1 parse_args
  [ "$HEADLESS" = "true" ]
}

@test "parse_args: accepts multiple flags together" {
  parse_args --no-fvm --flutter-version 3.19.0 -v
  [ "$NO_FVM" = "true" ]
  [ "$FLUTTER_VERSION" = "3.19.0" ]
  [ "$VERBOSE" = "true" ]
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 10 new tests fail

- [ ] **Step 3: Implement parse_args — add to install.sh**

```bash
# ============================================================
# Arg parsing
# ============================================================
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --no-fvm)
        NO_FVM=true
        shift
        ;;
      --flutter-version)
        if [[ $# -lt 2 || "$2" == --* ]]; then
          error "--flutter-version requires a value (e.g. --flutter-version 3.19.0)"
          exit 1
        fi
        FLUTTER_VERSION="$2"
        shift 2
        ;;
      --headless|-y)
        HEADLESS=true
        shift
        ;;
      -v|--verbose)
        VERBOSE=true
        shift
        ;;
      *)
        error "Unknown flag: $1"
        error "Usage: install.sh [--no-fvm] [--flutter-version <ver>] [--headless|-y] [-v]"
        exit 1
        ;;
    esac
  done

  # Honor env var override
  if [[ "${FLEDGING_NONINTERACTIVE:-}" == "1" ]]; then
    HEADLESS=true
  fi
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `22 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add arg parsing (flags, env var override, unknown-flag guard)"
```

---

### Task 6: Platform Detection

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "detect_platform: arm64 arch sets FLEDGING_ARCH=arm64" {
  stub_fn _get_raw_os 'echo Darwin'
  stub_fn _get_raw_arch 'echo arm64'
  stub_fn _get_proc_translated 'echo 0'
  detect_platform
  [ "$FLEDGING_ARCH" = "arm64" ]
  [ "$FLEDGING_OS" = "macos" ]
}

@test "detect_platform: aarch64 also maps to arm64" {
  stub_fn _get_raw_os 'echo Linux'
  stub_fn _get_raw_arch 'echo aarch64'
  stub_fn _get_long_bit 'echo 64'
  detect_platform
  [ "$FLEDGING_ARCH" = "arm64" ]
}

@test "detect_platform: x86_64 maps to x64" {
  stub_fn _get_raw_os 'echo Darwin'
  stub_fn _get_raw_arch 'echo x86_64'
  stub_fn _get_proc_translated 'echo 0'
  detect_platform
  [ "$FLEDGING_ARCH" = "x64" ]
}

@test "detect_platform: Rosetta 2 remaps x86_64 to arm64" {
  stub_fn _get_raw_os 'echo Darwin'
  stub_fn _get_raw_arch 'echo x86_64'
  stub_fn _get_proc_translated 'echo 1'
  detect_platform
  [ "$FLEDGING_ARCH" = "arm64" ]
}

@test "detect_platform: Linux 64-bit kernel with 32-bit userspace maps to i686" {
  stub_fn _get_raw_os 'echo Linux'
  stub_fn _get_raw_arch 'echo x86_64'
  stub_fn _get_long_bit 'echo 32'
  run detect_platform
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Unsupported architecture" ]]
}

@test "detect_platform: unsupported OS exits 1" {
  stub_fn _get_raw_os 'echo FreeBSD'
  run detect_platform
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Unsupported OS" ]]
}

@test "is_snap_curl: returns true when curl is in /snap/" {
  stub_fn _get_curl_path 'echo /snap/bin/curl'
  is_snap_curl && true || false
}

@test "is_snap_curl: returns false for normal curl" {
  stub_fn _get_curl_path 'echo /usr/bin/curl'
  ! is_snap_curl
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 8 new tests fail

- [ ] **Step 3: Implement platform detection — add to install.sh**

```bash
# ============================================================
# Platform detection — thin wrappers around system calls so
# tests can override them via function shadowing
# ============================================================
_get_raw_os()          { uname -s; }
_get_raw_arch()        { uname -m; }
_get_proc_translated() { sysctl -n sysctl.proc_translated 2>/dev/null || echo "0"; }
_get_long_bit()        { getconf LONG_BIT 2>/dev/null || echo "64"; }
_get_curl_path()       { command -v curl 2>/dev/null || echo ""; }

detect_platform() {
  # Windows check before uname — reliable under Git Bash/MSYS2
  if [[ "${OS:-}" == "Windows_NT" ]]; then
    error "Windows is not yet supported. Please use install.ps1 (coming soon)."
    exit 1
  fi

  local os arch
  os="$(_get_raw_os)"
  arch="$(_get_raw_arch)"

  case "$os" in
    Darwin)
      FLEDGING_OS="macos"
      # Rosetta 2: uname -m returns x86_64 even on Apple Silicon when the
      # shell itself is running under Rosetta. sysctl.proc_translated=1 means
      # this process is translated, so the real hardware is arm64.
      if [[ "$arch" == "x86_64" && "$(_get_proc_translated)" == "1" ]]; then
        arch="arm64"
      fi
      ;;
    Linux)
      FLEDGING_OS="linux"
      # 64-bit kernel with 32-bit userspace: uname -m returns x86_64 but
      # getconf LONG_BIT reveals the actual userspace word size is 32.
      if [[ "$arch" == "x86_64" && "$(_get_long_bit)" == "32" ]]; then
        error "Unsupported architecture: 32-bit userspace on 64-bit kernel (x32 ABI)"
        exit 1
      fi
      ;;
    *)
      error "Unsupported OS: $os. Only macOS and Linux are supported."
      exit 1
      ;;
  esac

  # Normalize arch: both Linux (aarch64) and macOS (arm64) mean the same thing
  case "$arch" in
    arm64|aarch64) FLEDGING_ARCH="arm64" ;;
    x86_64)        FLEDGING_ARCH="x64" ;;
    *)
      error "Unsupported architecture: $arch"
      exit 1
      ;;
  esac
}

# Returns true if curl lives under /snap/ (Ubuntu snap curl has broken SSL)
is_snap_curl() {
  local path
  path="$(_get_curl_path)"
  [[ "$path" == /snap/* ]]
}

# Returns true if the system uses musl libc (Alpine Linux etc.)
is_musl() {
  if command -v ldd > /dev/null 2>&1; then
    ldd /bin/ls 2>/dev/null | grep -q musl
  elif [[ -f /etc/alpine-release ]]; then
    return 0
  else
    return 1
  fi
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `30 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add platform detection (Rosetta 2, aarch64/arm64, musl, snap curl)"
```

---

### Task 7: Download Helpers

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "setup_tmp: creates FLEDGING_TMP directory" {
  FLEDGING_TMP="$(mktemp -d)/fledging-test-tmp"
  setup_tmp
  [ -d "$FLEDGING_TMP" ]
}

@test "download_file: uses wget when curl is snap" {
  stub_fn is_snap_curl 'return 0'
  # wget stub that creates the output file
  stub_fn wget 'touch "$3"; return 0'
  local dest
  dest="$(mktemp)"
  run download_file "http://example.com/file" "$dest"
  [ "$status" -eq 0 ]
}

@test "download_file: exits 1 when neither curl nor wget available" {
  stub_fn is_snap_curl 'return 0'
  # Remove wget from PATH
  wget() { return 127; }
  command() {
    if [[ "$2" == "wget" ]]; then return 1; fi
    builtin command "$@"
  }
  run download_file "http://example.com/file" "/tmp/test-out"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Neither curl nor wget" ]]
}

@test "verify_sha256: passes when hash matches" {
  local tmpfile
  tmpfile="$(mktemp)"
  echo -n "hello" > "$tmpfile"
  # sha256 of "hello" (no newline)
  local expected="2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
  run verify_sha256 "$tmpfile" "$expected"
  [ "$status" -eq 0 ]
  rm -f "$tmpfile"
}

@test "verify_sha256: exits 1 and removes file on mismatch" {
  local tmpfile
  tmpfile="$(mktemp)"
  echo "hello" > "$tmpfile"
  run verify_sha256 "$tmpfile" "000000000000000000000000000000000000000000000000000000000000dead"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "SHA256 mismatch" ]]
  [ ! -f "$tmpfile" ]  # file was cleaned up
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 5 new tests fail

- [ ] **Step 3: Implement download helpers — add to install.sh**

```bash
# ============================================================
# Download helpers
# ============================================================

setup_tmp() {
  mkdir -p "$FLEDGING_TMP"
  # Clean up temp dir on any exit — success or failure
  trap 'ignore rm -rf "$FLEDGING_TMP"' EXIT
}

# Download a URL to a destination path.
# Uses curl if available and not a snap package; falls back to wget.
# Downloads to <dest>.part first; renames to <dest> only on success.
# Usage: download_file <url> <dest>
download_file() {
  local url="$1" dest="$2"
  local part="${dest}.part"

  mkdir -p "$(dirname "$dest")"

  if command -v curl > /dev/null 2>&1 && ! is_snap_curl; then
    ensure curl --fail --location --show-error --retry 3 \
      --output "$part" "$url"
  elif command -v wget > /dev/null 2>&1; then
    ensure wget --quiet --output-document="$part" "$url"
  else
    error "Neither curl nor wget found. Please install one and re-run."
    exit 1
  fi

  mv "$part" "$dest"
}

# Verify the SHA256 of a file against an expected hex digest.
# Deletes the file and exits 1 on mismatch.
# Usage: verify_sha256 <file> <expected_sha256>
verify_sha256() {
  local file="$1" expected="$2"
  local actual

  if command -v shasum > /dev/null 2>&1; then
    actual="$(shasum -a 256 "$file" | cut -d' ' -f1)"
  elif command -v sha256sum > /dev/null 2>&1; then
    actual="$(sha256sum "$file" | cut -d' ' -f1)"
  else
    warn "No SHA256 tool found (shasum/sha256sum). Skipping integrity check."
    return 0
  fi

  if [[ "$actual" != "$expected" ]]; then
    error "SHA256 mismatch for $(basename "$file")"
    error "  Expected: $expected"
    error "  Actual:   $actual"
    ignore rm -f "$file"
    exit 1
  fi
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `35 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add download helpers (curl/wget fallback, .part pattern, SHA256 verify)"
```

---

### Task 8: Xcode CLT Step

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "install_xcode_clt: skips when already installed" {
  stub_fn xcode-select 'return 0'  # simulates xcode-select -p succeeding
  run install_xcode_clt
  [ "$status" -eq 0 ]
  [[ "$output" =~ "already installed" ]]
}

@test "install_xcode_clt: in headless mode calls softwareupdate" {
  # Simulate CLT not installed
  xcode-select() { return 1; }
  HEADLESS=true
  local su_called=false
  softwareupdate() { su_called=true; return 0; }
  # Also stub the wait loop
  stub_fn _xcode_clt_installed 'return 0'
  install_xcode_clt
  [ "$su_called" = "true" ]
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 2 new tests fail

- [ ] **Step 3: Implement install_xcode_clt — add to install.sh**

```bash
# ============================================================
# Xcode Command Line Tools
# ============================================================

# Thin wrapper for testability
_xcode_clt_installed() {
  xcode-select -p > /dev/null 2>&1
}

install_xcode_clt() {
  if _xcode_clt_installed; then
    info "Xcode Command Line Tools already installed"
    return 0
  fi

  info "Installing Xcode Command Line Tools..."

  if [[ "$HEADLESS" == "true" ]]; then
    # Headless install via softwareupdate (no GUI dialog)
    # Create the placeholder file that triggers CLT availability in the catalog
    local placeholder="/tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress"
    ensure touch "$placeholder"
    local clt_label
    clt_label="$(softwareupdate -l 2>&1 \
      | grep -B 1 "Command Line Tools" \
      | awk -F'*' '/^\*/ {print $2}' \
      | sed -e 's/^ Label: //' -e 's/^ *//' \
      | sort -V \
      | tail -n1)"
    ignore rm -f "$placeholder"

    if [[ -z "$clt_label" ]]; then
      error "Could not find Command Line Tools in softwareupdate catalog."
      error "Try running: xcode-select --install"
      exit 1
    fi

    ensure softwareupdate -i "$clt_label" --agree-to-license
  else
    # Interactive: trigger the system dialog and wait
    xcode-select --install 2>/dev/null || true
    info "A dialog appeared to install Xcode Command Line Tools."
    info "Complete the installation, then press ENTER to continue."
    set +e; read -r < /dev/tty; set -e

    # Poll until installed (max 5 min)
    local elapsed=0
    until _xcode_clt_installed; do
      sleep 5; elapsed=$((elapsed + 5))
      if [[ $elapsed -ge 300 ]]; then
        error "Timed out waiting for Xcode Command Line Tools."
        exit 1
      fi
    done
  fi

  info "Xcode Command Line Tools installed"
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `37 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add Xcode CLT install step (headless softwareupdate + interactive dialog)"
```

---

### Task 9: Homebrew Step

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "install_homebrew: skips when brew already in PATH" {
  stub_fn _brew_installed 'return 0'
  run install_homebrew
  [ "$status" -eq 0 ]
  [[ "$output" =~ "already installed" ]]
}

@test "install_homebrew: in headless mode sets NONINTERACTIVE=1" {
  stub_fn _brew_installed 'return 1'
  HEADLESS=true
  local captured_env=""
  _run_brew_installer() { captured_env="${NONINTERACTIVE:-unset}"; }
  install_homebrew
  [ "$captured_env" = "1" ]
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 2 new tests fail

- [ ] **Step 3: Implement install_homebrew — add to install.sh**

```bash
# ============================================================
# Homebrew
# ============================================================

_brew_installed() {
  command -v brew > /dev/null 2>&1
}

# Thin wrapper so tests can override without a network call
_run_brew_installer() {
  bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
}

install_homebrew() {
  if _brew_installed; then
    info "Homebrew already installed"
    return 0
  fi

  info "Installing Homebrew..."

  if [[ "$HEADLESS" == "true" ]]; then
    NONINTERACTIVE=1 _run_brew_installer
  else
    _run_brew_installer
  fi

  # Make brew available in this session (Homebrew doesn't update PATH itself)
  if [[ -f "/opt/homebrew/bin/brew" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -f "/usr/local/bin/brew" ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi

  if ! _brew_installed; then
    error "Homebrew installation succeeded but 'brew' is still not in PATH."
    error "Open a new terminal and re-run the installer."
    exit 1
  fi

  info "Homebrew installed"
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `39 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add Homebrew install step"
```

---

### Task 10: FVM Install Step

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "install_via_fvm: skips brew install when fvm already present" {
  stub_fn _fvm_installed 'return 0'
  local brew_called=false
  _brew_install_fvm() { brew_called=true; }
  stub_fn _fvm_install 'return 0'
  stub_fn _fvm_global 'return 0'
  stub_fn _dart_installed 'return 0'
  install_via_fvm
  [ "$brew_called" = "false" ]
}

@test "install_via_fvm: passes flutter version to fvm install when set" {
  stub_fn _fvm_installed 'return 0'
  FLUTTER_VERSION="3.19.0"
  local installed_version=""
  _fvm_install() { installed_version="$1"; }
  stub_fn _fvm_global 'return 0'
  stub_fn _dart_installed 'return 0'
  install_via_fvm
  [ "$installed_version" = "3.19.0" ]
}

@test "install_via_fvm: installs stable when no version flag" {
  stub_fn _fvm_installed 'return 0'
  FLUTTER_VERSION=""
  local installed_version=""
  _fvm_install() { installed_version="$1"; }
  stub_fn _fvm_global 'return 0'
  stub_fn _dart_installed 'return 0'
  install_via_fvm
  [ "$installed_version" = "stable" ]
}

@test "install_via_fvm: exits 1 if dart not in PATH after install" {
  stub_fn _fvm_installed 'return 0'
  stub_fn _fvm_install 'return 0'
  stub_fn _fvm_global 'return 0'
  stub_fn _dart_installed 'return 1'
  run install_via_fvm
  [ "$status" -eq 1 ]
  [[ "$output" =~ "dart not found" ]]
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 4 new tests fail

- [ ] **Step 3: Implement install_via_fvm — add to install.sh**

```bash
# ============================================================
# FVM + Flutter install
# ============================================================

_fvm_installed()  { command -v fvm > /dev/null 2>&1; }
_dart_installed() { command -v dart > /dev/null 2>&1; }
_brew_install_fvm() { ensure brew install fvm; }
_fvm_install() { ensure fvm install "$1"; }
_fvm_global()  { ensure fvm global "$1"; }

install_via_fvm() {
  if ! _fvm_installed; then
    info "Installing fvm..."
    _brew_install_fvm
  else
    info "fvm already installed"
  fi

  local version="${FLUTTER_VERSION:-stable}"
  info "Installing Flutter ${version} via fvm..."

  _fvm_install "$version"
  _fvm_global "$version"

  # Expose flutter/dart binaries in this session.
  # fvm global creates $HOME/fvm/default → symlink to the active version.
  export PATH="${HOME}/fvm/default/bin:${PATH}"

  if ! _dart_installed; then
    error "dart not found after fvm install."
    error "Expected it at: ${HOME}/fvm/default/bin/dart"
    error "Try running: fvm global ${version}"
    exit 1
  fi

  info "Flutter ${version} installed via fvm"
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `43 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add FVM install step"
```

---

### Task 11: Direct Flutter Download Step

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "install_flutter_direct: skips when flutter already in PATH" {
  stub_fn _flutter_installed 'return 0'
  run install_flutter_direct
  [ "$status" -eq 0 ]
  [[ "$output" =~ "already installed" ]]
}

@test "_parse_flutter_release: returns archive, sha256, base_url for stable" {
  # Create a minimal releases JSON fixture
  local json
  json="$(mktemp)"
  cat > "$json" <<'JSON'
{
  "base_url": "https://storage.example.com/releases",
  "current_release": { "stable": "abc123" },
  "releases": [
    {
      "hash": "abc123",
      "channel": "stable",
      "version": "3.19.0",
      "archive": "stable/macos/flutter_macos_arm64_3.19.0-stable.zip",
      "sha256": "deadbeef",
      "dart_sdk_arch": "arm64"
    }
  ]
}
JSON
  FLEDGING_ARCH="arm64"
  FLUTTER_VERSION=""
  run _parse_flutter_release "$json"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "stable/macos/flutter_macos_arm64_3.19.0-stable.zip" ]]
  [[ "$output" =~ "deadbeef" ]]
  [[ "$output" =~ "https://storage.example.com/releases" ]]
  rm -f "$json"
}

@test "_parse_flutter_release: exits 1 when requested version not found" {
  local json
  json="$(mktemp)"
  cat > "$json" <<'JSON'
{
  "base_url": "https://storage.example.com/releases",
  "current_release": { "stable": "abc123" },
  "releases": []
}
JSON
  FLEDGING_ARCH="x64"
  FLUTTER_VERSION="9.99.99"
  run _parse_flutter_release "$json"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "not found" ]]
  rm -f "$json"
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 3 new tests fail

- [ ] **Step 3: Implement install_flutter_direct — add to install.sh**

```bash
# ============================================================
# Direct Flutter download (--no-fvm path)
# ============================================================

_flutter_installed() { command -v flutter > /dev/null 2>&1; }

# Parse the Flutter releases JSON and print: archive sha256 base_url
# Exits 1 with a message if the requested version/arch combo is not found.
# Usage: _parse_flutter_release <releases_json_path>
# Reads: FLEDGING_ARCH, FLUTTER_VERSION (global)
_parse_flutter_release() {
  local json_file="$1"
  need_cmd python3

  python3 - "$json_file" "$FLEDGING_ARCH" "${FLUTTER_VERSION:-}" <<'PYEOF'
import json, sys

json_file = sys.argv[1]
dart_arch = sys.argv[2]
requested_version = sys.argv[3]

with open(json_file) as f:
    data = json.load(f)

base_url = data["base_url"]
stable_hash = data["current_release"]["stable"]

for r in data["releases"]:
    # Flutter releases JSON uses "x64" for Intel and "arm64" for Apple Silicon.
    # Entries without dart_sdk_arch are x64 (older format).
    release_arch = r.get("dart_sdk_arch", "x64")
    if release_arch != dart_arch:
        continue
    if requested_version:
        if r.get("version") == requested_version:
            print(r["archive"])
            print(r["sha256"])
            print(base_url)
            sys.exit(0)
    else:
        if r["hash"] == stable_hash:
            print(r["archive"])
            print(r["sha256"])
            print(base_url)
            sys.exit(0)

if requested_version:
    print(f"ERROR: Flutter {requested_version} not found for {dart_arch}", file=sys.stderr)
else:
    print(f"ERROR: No stable Flutter release found for {dart_arch}", file=sys.stderr)
sys.exit(1)
PYEOF
}

install_flutter_direct() {
  if _flutter_installed; then
    info "Flutter already installed"
    return 0
  fi

  setup_tmp

  local releases_url="${FLUTTER_RELEASES_BASE}/releases_${FLEDGING_OS}.json"
  local releases_json="${FLEDGING_TMP}/releases.json"

  info "Fetching Flutter release information..."
  download_file "$releases_url" "$releases_json"

  local archive sha256 base_url
  # _parse_flutter_release prints three lines; read them into variables
  { read -r archive; read -r sha256; read -r base_url; } \
    < <(_parse_flutter_release "$releases_json") || {
      error "Could not find a matching Flutter release."
      [[ -n "${FLUTTER_VERSION:-}" ]] && \
        error "Version '${FLUTTER_VERSION}' may not exist for ${FLEDGING_ARCH}."
      exit 1
    }

  local zip_url="${base_url}/${archive}"
  local zip_path="${FLEDGING_TMP}/flutter.zip"

  info "Downloading Flutter..."
  download_file "$zip_url" "$zip_path"

  info "Verifying download..."
  verify_sha256 "$zip_path" "$sha256"

  info "Extracting Flutter..."
  local install_dir="${HOME}/development"
  mkdir -p "$install_dir"
  ensure unzip -q "$zip_path" -d "$install_dir"
  ignore rm -f "$zip_path"

  # chmod before moving into place — a killed process between mv and chmod
  # would leave a non-executable binary at the target path
  ensure chmod +x "${install_dir}/flutter/bin/flutter"
  ensure chmod +x "${install_dir}/flutter/bin/dart"

  export PATH="${install_dir}/flutter/bin:${PATH}"

  if ! _flutter_installed; then
    error "Flutter install completed but 'flutter' is not in PATH."
    error "Expected it at: ${install_dir}/flutter/bin/flutter"
    exit 1
  fi

  info "Flutter installed to ${install_dir}/flutter"
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `46 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add direct Flutter download step (zip, SHA256, python3 JSON parsing)"
```

---

### Task 12: PATH Persistence

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "persist_path: skips when dir already in config" {
  local config
  config="$(mktemp)"
  echo 'export PATH="/home/user/fvm/default/bin:$PATH"' > "$config"
  stub_fn _shell_config_file 'echo '"$config"
  stub_fn _shell_name 'echo zsh'
  run persist_path "/home/user/fvm/default/bin"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "already configured" ]]
  rm -f "$config"
}

@test "persist_path: appends export PATH for bash" {
  local config
  config="$(mktemp)"
  stub_fn _shell_config_file 'echo '"$config"
  stub_fn _shell_name 'echo bash'
  FLEDGING_OS="macos"
  persist_path "/home/user/.fledging/bin"
  grep -q 'export PATH="/home/user/.fledging/bin' "$config"
  rm -f "$config"
}

@test "persist_path: uses fish_add_path syntax for fish" {
  local config
  config="$(mktemp)"
  stub_fn _shell_config_file 'echo '"$config"
  stub_fn _shell_name 'echo fish'
  persist_path "/home/user/.fledging/bin"
  grep -q 'fish_add_path "/home/user/.fledging/bin"' "$config"
  rm -f "$config"
}

@test "persist_path: creates a timestamped backup before modifying" {
  local config
  config="$(mktemp)"
  echo "# existing content" > "$config"
  stub_fn _shell_config_file 'echo '"$config"
  stub_fn _shell_name 'echo zsh'
  persist_path "/some/new/bin"
  # At least one backup file should exist alongside the config
  local backup_count
  backup_count="$(ls "${config}.pre-fledging-"* 2>/dev/null | wc -l)"
  [ "$backup_count" -ge 1 ]
  rm -f "$config" "${config}.pre-fledging-"*
}

@test "persist_path: handles symlinked config files" {
  local real_config link_config
  real_config="$(mktemp)"
  link_config="$(mktemp)"
  rm -f "$link_config"
  ln -s "$real_config" "$link_config"
  stub_fn _shell_config_file 'echo '"$link_config"
  stub_fn _shell_name 'echo zsh'
  persist_path "/some/bin"
  grep -q 'export PATH="/some/bin' "$real_config"
  rm -f "$real_config" "$link_config"
}

@test "persist_path: prints manual instructions for unknown shell" {
  stub_fn _shell_name 'echo tcsh'
  run persist_path "/some/bin"
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Manually add" ]]
  [[ "$output" =~ "/some/bin" ]]
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 6 new tests fail

- [ ] **Step 3: Implement persist_path — add to install.sh**

```bash
# ============================================================
# PATH persistence
# ============================================================

_shell_name() { basename "${SHELL:-bash}"; }

# Returns the config file path for the current shell.
# Separated out so tests can stub it.
_shell_config_file() {
  local shell
  shell="$(_shell_name)"
  case "$shell" in
    zsh)  echo "${ZDOTDIR:-$HOME}/.zshrc" ;;
    bash)
      if [[ "${FLEDGING_OS:-}" == "macos" ]]; then
        echo "${HOME}/.bash_profile"
      else
        echo "${HOME}/.bashrc"
      fi
      ;;
    fish) echo "${HOME}/.config/fish/config.fish" ;;
    *)    echo "" ;;
  esac
}

# Append <dir> to the active shell's config file if not already present.
# Usage: persist_path <dir>
persist_path() {
  local dir="$1"
  local shell config_file
  shell="$(_shell_name)"
  config_file="$(_shell_config_file)"

  if [[ -z "$config_file" ]]; then
    warn "Unknown shell: $shell. Manually add the following to your shell config:"
    warn "  export PATH=\"${dir}:\$PATH\""
    return 0
  fi

  mkdir -p "$(dirname "$config_file")"

  # Dedup: skip if this directory or a known flutter/fvm path is already present.
  # Uses [ -f ] || [ -h ] to handle symlinked config files (chezmoi, stow, etc.)
  if ([[ -f "$config_file" ]] || [[ -h "$config_file" ]]) && \
     grep -qE "(${dir}|fvm/default/bin|development/flutter/bin)" "$config_file" 2>/dev/null; then
    info "PATH already configured in ${config_file}"
    return 0
  fi

  # Back up before modifying — timestamped so multiple runs don't collide
  if [[ -f "$config_file" ]] || [[ -h "$config_file" ]]; then
    local backup="${config_file}.pre-fledging-$(date +%Y-%m-%d_%H-%M-%S)"
    cp "$config_file" "$backup"
  fi

  # Atomic write: write to .tmp, then mv -f to final.
  # Never write to the config file in-place.
  local tmp_config="${config_file}.fledging-tmp"
  if [[ -f "$config_file" ]] || [[ -h "$config_file" ]]; then
    cp "$config_file" "$tmp_config"
  else
    touch "$tmp_config"
  fi

  if [[ "$shell" == "fish" ]]; then
    printf '\n# Added by fledging installer\nfish_add_path "%s"\n' "$dir" >> "$tmp_config"
  else
    printf '\n# Added by fledging installer\nexport PATH="%s:$PATH"\n' "$dir" >> "$tmp_config"
  fi

  mv -f "$tmp_config" "$config_file"
  info "Added ${dir} to PATH in ${config_file}"
  info "Restart your shell or run: source ${config_file}"
}
```

- [ ] **Step 4: Run tests**

```bash
bats test/install.bats
```

Expected: `52 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add PATH persistence (per-shell, atomic write, backup, dedup, symlink-safe)"
```

---

### Task 13: main() and Handoff

**Files:**
- Modify: `install.sh`
- Modify: `test/install.bats`

- [ ] **Step 1: Write the failing tests**

Add to `test/install.bats`:

```bash
@test "main: calls steps in correct order with fvm path" {
  local call_log=()
  stub_fn recover_env       'call_log+=(recover_env)'
  stub_fn parse_args        'call_log+=(parse_args)'
  stub_fn detect_platform   'call_log+=(detect_platform); FLEDGING_OS=macos; FLEDGING_ARCH=arm64'
  stub_fn install_xcode_clt 'call_log+=(xcode_clt)'
  stub_fn install_homebrew  'call_log+=(homebrew)'
  stub_fn install_via_fvm   'call_log+=(fvm)'
  stub_fn persist_path      'call_log+=(persist_path)'
  stub_fn _handoff_to_dart  'call_log+=(handoff)'
  NO_FVM=false
  main
  [ "${call_log[0]}" = "recover_env" ]
  [ "${call_log[1]}" = "parse_args" ]
  [ "${call_log[2]}" = "detect_platform" ]
  [ "${call_log[3]}" = "xcode_clt" ]
  [ "${call_log[4]}" = "homebrew" ]
  [ "${call_log[5]}" = "fvm" ]
  [ "${call_log[6]}" = "persist_path" ]
  [ "${call_log[7]}" = "handoff" ]
}

@test "main: calls install_flutter_direct when --no-fvm" {
  stub_fn recover_env         'true'
  stub_fn parse_args          'NO_FVM=true'
  stub_fn detect_platform     'FLEDGING_OS=macos; FLEDGING_ARCH=arm64'
  stub_fn install_xcode_clt   'true'
  stub_fn install_homebrew    'true'
  local direct_called=false
  install_flutter_direct() { direct_called=true; }
  stub_fn persist_path        'true'
  stub_fn _handoff_to_dart    'true'
  main
  [ "$direct_called" = "true" ]
}
```

- [ ] **Step 2: Run to verify failure**

```bash
bats test/install.bats
```

Expected: 2 new tests fail

- [ ] **Step 3: Implement main() and handoff — replace the bottom of install.sh**

Find the existing `return 0 2>/dev/null` + `main "$@"` lines at the bottom and replace with:

```bash
# ============================================================
# Dart tool handoff
# ============================================================

# Separated for testability
_handoff_to_dart() {
  if [[ "$NO_FVM" == "true" ]]; then
    ensure dart pub global activate fledging
    ensure dart pub global run fledging
  else
    ensure fvm dart pub global activate fledging
    ensure fvm dart pub global run fledging
  fi
}

# ============================================================
# Preflight: check required commands are present
# ============================================================

preflight_checks() {
  need_cmd uname
  need_cmd bash
  need_cmd curl  # checked again after snap detection; just verify it exists at all
  # python3 is only needed for --no-fvm; checked in install_flutter_direct
  if [[ "$NO_FVM" == "false" ]]; then
    need_cmd unzip  # needed for --no-fvm zip extraction
  fi
}

# ============================================================
# Main
# ============================================================

main() {
  recover_env
  parse_args "$@"
  detect_platform

  # macOS only for Phase 1
  if [[ "$FLEDGING_OS" != "macos" ]]; then
    error "Linux support is coming soon. Only macOS is supported in Phase 1."
    exit 1
  fi

  if [[ "$VERBOSE" == "true" ]]; then
    set -x
  fi

  if [[ "$HEADLESS" == "false" ]]; then
    info "This script will install:"
    info "  - Xcode Command Line Tools"
    info "  - Homebrew"
    if [[ "$NO_FVM" == "true" ]]; then
      info "  - Flutter ${FLUTTER_VERSION:-latest stable} (direct download)"
    else
      info "  - fvm (Flutter version manager)"
      info "  - Flutter ${FLUTTER_VERSION:-latest stable} via fvm"
    fi
    info ""
    info "Press ENTER to continue or Ctrl-C to cancel."
    set +e; read -r < /dev/tty; set -e
  fi

  install_xcode_clt
  install_homebrew

  if [[ "$NO_FVM" == "true" ]]; then
    install_flutter_direct
    persist_path "${HOME}/development/flutter/bin"
  else
    install_via_fvm
    persist_path "${HOME}/fvm/default/bin"
  fi

  info ""
  info "Flutter is installed. Handing off to fledging..."
  info ""

  _handoff_to_dart
}

# ============================================================
# Sourceable for testing — return exits without running main
# when sourced; falls through to main when executed directly
# ============================================================
return 0 2>/dev/null

main "$@"
```

- [ ] **Step 4: Run full test suite**

```bash
bats test/install.bats
```

Expected: `54 tests, 0 failures`

- [ ] **Step 5: Manual smoke test — verify the script is valid bash and can be sourced**

```bash
bash -n install.sh && echo "Syntax OK"
source install.sh && echo "Sourceable OK"
```

Expected:
```
Syntax OK
Sourceable OK
```

- [ ] **Step 6: Commit**

```bash
git add install.sh test/install.bats
git commit -m "feat: add main() orchestration and Dart tool handoff"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| `--no-fvm` flag | Task 5 (parse_args), Task 11 (install_flutter_direct), Task 13 (main routing) |
| `--flutter-version` flag | Task 5 (parse_args), Task 10 (fvm), Task 11 (direct download) |
| `--headless` / `-y` / `FLEDGING_NONINTERACTIVE=1` | Task 5 (parse_args) |
| `-v` / `--verbose` | Task 5 (parse_args), Task 13 (main `set -x`) |
| Rosetta 2 detection | Task 6 (detect_platform) |
| musl detection | Task 6 (is_musl — defined, used in future Linux expansion) |
| aarch64/arm64 normalization | Task 6 (detect_platform) |
| `getconf LONG_BIT` check | Task 6 (detect_platform) |
| Snap curl detection | Task 6 (is_snap_curl), Task 7 (download_file) |
| Xcode CLT (headless + interactive) | Task 8 |
| Homebrew (headless) | Task 9 |
| FVM install + PATH | Task 10 |
| Flutter zip download + SHA256 | Task 11 |
| `~/development/flutter` extract path | Task 11 |
| PATH persistence (per-shell, dedup, atomic, backup, symlink) | Task 12 |
| `dart pub global run fledging` handoff | Task 13 |
| `$USER` / `$HOME` recovery | Task 4 |
| `POSIXLY_CORRECT` guard | Task 4 |
| `set -euo pipefail` | Task 2 |
| `trap EXIT` cleanup of tmp | Task 7 (setup_tmp) |
| Unknown flags exit 1 | Task 5 |
| Pre-flight confirmation prompt | Task 13 (main) |
| `read </dev/tty` for piped execution | Task 8 (CLT wait), Task 13 (confirmation) |
| `is_tty()` subshell-safe baking | Task 3 |
| All output to stderr | Task 3 |
| `.part` file pattern | Task 7 (download_file) |
| `ZDOTDIR` for zsh | Task 12 (persist_path) |
| Fish `fish_add_path` syntax | Task 12 (persist_path) |
| Linux `.bashrc` vs macOS `.bash_profile` | Task 12 (persist_path) |
