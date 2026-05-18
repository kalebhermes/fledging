#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Constants
# ============================================================

FLEDGING_VERSION="0.1.0"
# FLEDGING_TMP is initialized in setup_tmp() after recover_env() runs,
# so HOME is guaranteed to be set when this path is constructed.
FLEDGING_TMP=""

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

# ============================================================
# Environment recovery
# ============================================================
recover_env() {
  # USER is defined by login(1) which is not always executed (e.g. containers)
  USER="${USER:-$(id -u -n)}"
  export USER

  # HOME multi-level recovery: getent (Linux) → eval echo ~USER (macOS/all)
  # The || true prevents set -e from aborting when getent is absent (e.g. macOS)
  HOME="${HOME:-$(getent passwd "$USER" 2>/dev/null | cut -d: -f6 || true)}"
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
        if [[ $# -lt 2 || "$2" == -* ]]; then
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
        error "Usage: install.sh [--no-fvm] [--flutter-version <ver>] [--headless|-y] [-v|--verbose]"
        exit 1
        ;;
    esac
  done

  # Honor env var override
  if [[ "${FLEDGING_NONINTERACTIVE:-}" == "1" ]]; then
    HEADLESS=true
  fi
}

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

# ============================================================
# Download helpers
# ============================================================

setup_tmp() {
  FLEDGING_TMP="${HOME}/.fledging/tmp"
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

# ============================================================
# Xcode Command Line Tools
# ============================================================

# Thin wrapper for testability
_xcode_clt_installed() {
  xcode-select -p > /dev/null 2>&1
}

install_xcode_clt() {
  if xcode-select -p > /dev/null 2>&1; then
    info "Xcode Command Line Tools already installed"
    return 0
  fi

  info "Installing Xcode Command Line Tools..."

  if [[ "$HEADLESS" == "true" ]]; then
    # Headless install via softwareupdate (no GUI dialog)
    # Create the placeholder file that triggers CLT availability in the catalog
    local placeholder="/tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress"
    ensure touch "$placeholder"

    # Run softwareupdate -l as a direct call (not command substitution) so that
    # any shell-function stubs take effect in the current scope, then parse output
    local tmplist
    tmplist="$(mktemp)"
    softwareupdate -l > "$tmplist" 2>&1
    local clt_label
    clt_label="$(grep -B 1 "Command Line Tools" "$tmplist" \
      | awk -F'*' '/^\*/ {print $2}' \
      | sed -e 's/^ Label: //' -e 's/^ *//' \
      | sort -V \
      | tail -n1 || true)"
    ignore rm -f "$tmplist"
    ignore rm -f "$placeholder"

    if [[ -n "$clt_label" ]]; then
      ensure softwareupdate -i "$clt_label" --agree-to-license
    else
      # Fallback: install all available updates (works on some macOS versions)
      warn "Could not find a specific CLT label in softwareupdate catalog; falling back to --install --all"
      ensure softwareupdate --install --all --agree-to-license
    fi
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

# ============================================================
# Direct Flutter download (--no-fvm path)
# ============================================================

_flutter_installed() { command -v flutter > /dev/null 2>&1; }

# Parse the Flutter releases JSON and print: archive sha256 base_url (one per line)
# Exits 1 with a message if the requested version/arch combo is not found.
# Usage: _parse_flutter_release <releases_json_path>
# Reads: FLEDGING_ARCH, FLUTTER_VERSION (globals)
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
  need_cmd unzip
  local install_dir="${HOME}/development"
  mkdir -p "$install_dir"
  ensure unzip -q "$zip_path" -d "$install_dir"
  ignore rm -f "$zip_path"

  # unzip doesn't always preserve execute bits (especially on Linux when the
  # zip was created on macOS). Set them explicitly before using the binaries.
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

  # Resolve symlinks so mv -f doesn't replace the symlink itself with a new file.
  # If config_file is a symlink, we need to write to the real target so that tools
  # like chezmoi or stow (which use symlinks) see the change.
  local real_config
  if [[ -h "$config_file" ]]; then
    real_config="$(readlink -f "$config_file" 2>/dev/null || realpath "$config_file" 2>/dev/null || echo "$config_file")"
  else
    real_config="$config_file"
  fi

  # Atomic write: write to .tmp, then mv -f to the real (non-symlink) target.
  # Never write to the config file in-place.
  local tmp_config="${real_config}.fledging-tmp"
  if [[ -f "$real_config" ]]; then
    cp "$real_config" "$tmp_config"
  else
    touch "$tmp_config"
  fi

  if [[ "$shell" == "fish" ]]; then
    printf '\n# Added by fledging installer\nfish_add_path "%s"\n' "$dir" >> "$tmp_config"
  else
    printf '\n# Added by fledging installer\nexport PATH="%s:$PATH"\n' "$dir" >> "$tmp_config"
  fi

  mv -f "$tmp_config" "$real_config"
  info "Added ${dir} to PATH in ${config_file}"
  info "Restart your shell or run: source ${config_file}"
}

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
