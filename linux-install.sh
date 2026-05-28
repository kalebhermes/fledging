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
FVM_INSTALL_URL="https://fvm.app/install.sh"

# Install path fragments (relative to $HOME). Single source of truth for any
# code that constructs or checks flutter/fvm bin directory paths.
FVM_BIN_DIR="fvm/default/bin"
FLUTTER_DIRECT_BIN_DIR="development/flutter/bin"

# Globals set during execution
FLEDGING_OS="linux"
FLEDGING_ARCH=""   # "x64" | "arm64"

# Flags (set by parse_args)
NO_FVM=false
FLUTTER_VERSION=""
HEADLESS=false
VERBOSE=false

# Accumulator for paths to clean up on EXIT. Use _register_cleanup instead of
# calling trap directly — multiple trap calls overwrite each other.
_CLEANUP_PATHS=()
_cleanup_on_exit() { for _p in "${_CLEANUP_PATHS[@]+"${_CLEANUP_PATHS[@]}"}"; do ignore rm -rf "$_p"; done; }
trap '_cleanup_on_exit' EXIT

_register_cleanup() { _CLEANUP_PATHS+=("$1"); }

# ============================================================
# TTY detection — evaluated once at startup, subshell-safe.
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
  YELLOW="\033[33m"
  CYAN="\033[36m"
  RESET="\033[0m"
else
  BOLD="" RED="" YELLOW="" CYAN="" RESET=""
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

need_cmd() {
  if ! command -v "$1" > /dev/null 2>&1; then
    error "Required command not found: $1"
    exit 1
  fi
}

ensure() {
  if ! "$@"; then
    error "Command failed: $*"
    exit 1
  fi
}

ignore() {
  "$@" 2>/dev/null || true
}

# ============================================================
# Environment recovery
# ============================================================
recover_env() {
  USER="${USER:-$(id -u -n)}"
  export USER

  HOME="${HOME:-$(getent passwd "$USER" 2>/dev/null | cut -d: -f6 || true)}"
  HOME="${HOME:-$(eval echo ~"$USER")}"
  export HOME

  if [[ -n "${POSIXLY_CORRECT+1}" ]]; then
    error "POSIXLY_CORRECT is set. Please unset it and re-run:"
    error "  unset POSIXLY_CORRECT && bash linux-install.sh"
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
        error "Usage: linux-install.sh [--no-fvm] [--flutter-version <ver>] [--headless|-y] [-v|--verbose]"
        exit 1
        ;;
    esac
  done

  if [[ "${FLEDGING_NONINTERACTIVE:-}" == "1" ]]; then
    HEADLESS=true
  fi
}

# ============================================================
# Platform detection
# ============================================================
_get_raw_arch()  { uname -m; }
_get_long_bit()  { getconf LONG_BIT 2>/dev/null || echo "64"; }
_get_curl_path() { command -v curl 2>/dev/null || echo ""; }

detect_platform() {
  local arch
  arch="$(_get_raw_arch)"

  # 64-bit kernel with 32-bit userspace guard
  if [[ "$arch" == "x86_64" && "$(_get_long_bit)" == "32" ]]; then
    error "Unsupported architecture: 32-bit userspace on 64-bit kernel (x32 ABI)"
    exit 1
  fi

  case "$arch" in
    x86_64)        FLEDGING_ARCH="x64" ;;
    aarch64|arm64) FLEDGING_ARCH="arm64" ;;
    *)
      error "Unsupported architecture: $arch"
      exit 1
      ;;
  esac
}

is_snap_curl() {
  local path
  path="$(_get_curl_path)"
  [[ "$path" == /snap/* ]]
}

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
# Package manager detection
# ============================================================
_detect_pkg_manager() {
  if command -v apt-get > /dev/null 2>&1; then echo "apt"
  elif command -v dnf > /dev/null 2>&1; then echo "dnf"
  elif command -v pacman > /dev/null 2>&1; then echo "pacman"
  elif command -v apk > /dev/null 2>&1; then echo "apk"
  else echo "unknown"
  fi
}

# ============================================================
# System prerequisites
# Replaces the macOS Xcode CLT + Homebrew steps.
# ============================================================
install_prereqs() {
  local pkg_mgr
  pkg_mgr="$(_detect_pkg_manager)"

  if [[ "$pkg_mgr" == "unknown" ]]; then
    error "No supported package manager found (apt, dnf, pacman, apk)."
    error "Please install manually: curl git unzip xz-utils zip libglu1-mesa"
    exit 1
  fi

  info "Installing system prerequisites via ${pkg_mgr}..."

  case "$pkg_mgr" in
    apt)
      ensure sudo apt-get update -y
      ensure sudo apt-get install -y curl git unzip xz-utils zip libglu1-mesa
      ;;
    dnf)
      ensure sudo dnf install -y git curl unzip xz zip mesa-libGLU
      ;;
    pacman)
      ensure sudo pacman -Sy --noconfirm git curl unzip xz zip mesa
      ;;
    apk)
      # gcompat provides glibc compatibility shim required by Flutter/Dart binaries,
      # which are glibc-linked and won't run on Alpine's musl libc without it.
      ensure sudo apk add --no-cache git curl unzip xz zip mesa-gl gcompat
      ;;
  esac

  info "System prerequisites installed"
}

# ============================================================
# Download helpers
# ============================================================

setup_tmp() {
  FLEDGING_TMP="${HOME}/.fledging/tmp"
  mkdir -p "$FLEDGING_TMP"
  _register_cleanup "$FLEDGING_TMP"
}

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

verify_sha256() {
  local file="$1" expected="$2"
  local actual

  if command -v sha256sum > /dev/null 2>&1; then
    actual="$(sha256sum "$file" | cut -d' ' -f1)"
  elif command -v shasum > /dev/null 2>&1; then
    actual="$(shasum -a 256 "$file" | cut -d' ' -f1)"
  else
    warn "No SHA256 tool found (sha256sum/shasum). Skipping integrity check."
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
# FVM + Flutter install (fvm path)
# On Linux, fvm is installed via its official install script,
# not Homebrew.
# ============================================================

_fvm_installed()  { command -v fvm > /dev/null 2>&1; }
_dart_installed() { command -v dart > /dev/null 2>&1; }
_fvm_install() { ensure fvm install "$1"; }
_fvm_global()  { ensure fvm global "$1"; }

# Thin wrapper so tests can stub without a network call.
# Applies the same snap-curl guard as download_file — snap curl on Ubuntu
# has broken SSL and will fail on this HTTPS URL without the wget fallback.
_run_fvm_installer() {
  if is_snap_curl; then
    if command -v wget > /dev/null 2>&1; then
      wget -qO- "$FVM_INSTALL_URL" | bash
    else
      error "snap curl has broken SSL and wget is not available."
      error "Install wget (sudo apt-get install wget) and re-run."
      exit 1
    fi
  else
    ensure curl -fsSL "$FVM_INSTALL_URL" | bash
  fi
}

install_via_fvm() {
  if ! _fvm_installed; then
    info "Installing fvm..."
    # fvm.app/install.sh installs the fvm binary to $HOME/fvm/bin
    _run_fvm_installer
    # Make fvm callable in this session
    export PATH="${HOME}/fvm/bin:${PATH}"
  else
    info "fvm already installed"
  fi

  local version="${FLUTTER_VERSION:-stable}"
  info "Installing Flutter ${version} via fvm..."

  _fvm_install "$version"
  _fvm_global "$version"

  # After fvm global, flutter/dart are at $HOME/fvm/default/bin
  export PATH="${HOME}/${FVM_BIN_DIR}:${PATH}"

  if ! _dart_installed; then
    error "dart not found after fvm install."
    error "Expected it at: ${HOME}/${FVM_BIN_DIR}/dart"
    error "Try running: fvm global ${version}"
    exit 1
  fi

  info "Flutter ${version} installed via fvm"
}

# ============================================================
# Direct Flutter download (--no-fvm path)
# Linux archives are .tar.xz; only x64 is available.
# ============================================================

_flutter_installed() { command -v flutter > /dev/null 2>&1; }

# Parse the Flutter releases JSON using only awk — no python3 dependency.
# Prints: archive (line 1), sha256 (line 2). Exits 1 if not found.
# Reads globals: FLEDGING_ARCH, FLUTTER_VERSION
_parse_flutter_release() {
  local json_file="$1"
  local dart_arch="${FLEDGING_ARCH}"
  local req_version="${FLUTTER_VERSION:-}"

  # Extract the stable commit hash from the current_release section
  local stable_hash
  stable_hash=$(awk '/"stable":/ {
    val=$0; gsub(/.*"stable": "/, "", val); gsub(/".*/, "", val); print val; exit
  }' "$json_file")

  if [[ -z "$stable_hash" && -z "$req_version" ]]; then
    error "Could not parse stable hash from Flutter releases JSON."
    exit 1
  fi

  # Walk the releases array with plain awk (POSIX-compatible, no python3 needed).
  # Each release object has one JSON field per line; we accumulate fields until
  # we hit a closing brace and check if the record matches our target.
  local result
  result=$(awk \
    -v stable_hash="$stable_hash" \
    -v dart_arch="$dart_arch" \
    -v req_version="$req_version" \
  '
  /^[ \t]*\{/ { hash=""; version=""; arch="x64"; archive=""; sha256="" }
  /"hash":/ {
    val=$0; gsub(/.*"hash": "/, "", val); gsub(/".*/, "", val); hash=val
  }
  /"version":/ {
    val=$0; gsub(/.*"version": "/, "", val); gsub(/".*/, "", val); version=val
  }
  /"dart_sdk_arch":/ {
    val=$0; gsub(/.*"dart_sdk_arch": "/, "", val); gsub(/".*/, "", val); arch=val
  }
  /"archive":/ {
    val=$0; gsub(/.*"archive": "/, "", val); gsub(/".*/, "", val); archive=val
  }
  /"sha256":/ {
    val=$0; gsub(/.*"sha256": "/, "", val); gsub(/".*/, "", val); sha256=val
  }
  /^[ \t]*\},?[ \t]*$/ {
    if (hash != "" && archive != "" && sha256 != "" && arch == dart_arch) {
      matched = (req_version == "" && hash == stable_hash) || \
                (req_version != "" && version == req_version)
      if (matched) { print archive; print sha256; exit 0 }
    }
  }
  ' "$json_file")

  if [[ -z "$result" ]]; then
    if [[ -n "$req_version" ]]; then
      error "Flutter ${req_version} not found for ${dart_arch}."
    else
      error "No stable Flutter release found for ${dart_arch}."
    fi
    exit 1
  fi

  echo "$result"
}

install_flutter_direct() {
  [[ -n "${FLEDGING_OS:-}" && -n "${FLEDGING_ARCH:-}" ]] || {
    error "install_flutter_direct called before detect_platform"
    exit 1
  }

  # Google does not publish pre-built arm64 Linux Flutter archives.
  # The fvm path (default) handles arm64 via fvm's own arm64 binaries.
  if [[ "$FLEDGING_ARCH" == "arm64" ]]; then
    error "--no-fvm is not supported on arm64 Linux: Flutter has no pre-built arm64 Linux SDK."
    error "Remove --no-fvm to install Flutter via fvm, which supports arm64."
    exit 1
  fi

  if _flutter_installed; then
    info "Flutter already installed"
    return 0
  fi

  setup_tmp
  need_cmd tar

  local releases_url="${FLUTTER_RELEASES_BASE}/releases_${FLEDGING_OS}.json"
  local releases_json="${FLEDGING_TMP}/releases.json"

  info "Fetching Flutter release information..."
  download_file "$releases_url" "$releases_json"

  local archive sha256
  { read -r archive; read -r sha256; } \
    < <(_parse_flutter_release "$releases_json") || {
      error "Could not find a matching Flutter release."
      [[ -n "${FLUTTER_VERSION:-}" ]] && \
        error "Version '${FLUTTER_VERSION}' may not exist for ${FLEDGING_ARCH}."
      exit 1
    }

  local archive_url="${FLUTTER_RELEASES_BASE}/${archive}"
  local archive_path="${FLEDGING_TMP}/flutter.tar.xz"

  info "Downloading Flutter..."
  download_file "$archive_url" "$archive_path"

  info "Verifying download..."
  verify_sha256 "$archive_path" "$sha256"

  info "Extracting Flutter..."
  local install_dir="${HOME}/development"
  mkdir -p "$install_dir"
  # Linux archives are .tar.xz
  ensure tar xf "$archive_path" -C "$install_dir"
  ignore rm -f "$archive_path"

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

_shell_config_file() {
  local shell
  shell="$(_shell_name)"
  case "$shell" in
    zsh)  echo "${ZDOTDIR:-$HOME}/.zshrc" ;;
    bash) echo "${HOME}/.bashrc" ;;   # Linux always uses .bashrc
    fish) echo "${HOME}/.config/fish/config.fish" ;;
    *)    echo "" ;;
  esac
}

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

  if ([[ -f "$config_file" ]] || [[ -h "$config_file" ]]) && \
     { grep -qF "$dir" "$config_file" 2>/dev/null || \
       grep -qE "(${FVM_BIN_DIR}|${FLUTTER_DIRECT_BIN_DIR})" "$config_file" 2>/dev/null; }; then
    info "PATH already configured in ${config_file}"
    return 0
  fi

  if [[ -f "$config_file" ]] || [[ -h "$config_file" ]]; then
    local backup="${config_file}.pre-fledging-$(date +%Y-%m-%d_%H-%M-%S)"
    cp "$config_file" "$backup"
  fi

  local real_config="$config_file"
  if [[ -h "$config_file" ]]; then
    real_config="$(readlink -f "$config_file" 2>/dev/null || realpath "$config_file" 2>/dev/null || echo "$config_file")"
  fi

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

  if [[ "$VERBOSE" == "true" ]]; then
    set -x
  fi

  if [[ "$HEADLESS" == "false" ]]; then
    info "This script will install:"
    info "  - System prerequisites (git, curl, unzip, xz-utils, zip, libglu1-mesa)"
    if [[ "$NO_FVM" == "true" ]]; then
      info "  - Flutter ${FLUTTER_VERSION:-latest stable} (direct download, x64 only)"
    else
      info "  - fvm (Flutter version manager)"
      info "  - Flutter ${FLUTTER_VERSION:-latest stable} via fvm"
    fi
    info ""
    info "Press ENTER to continue or Ctrl-C to cancel."
    set +e; read -r < /dev/tty; set -e
  fi

  install_prereqs

  if [[ "$NO_FVM" == "true" ]]; then
    install_flutter_direct
    persist_path "${HOME}/${FLUTTER_DIRECT_BIN_DIR}"
  else
    install_via_fvm
    persist_path "${HOME}/${FVM_BIN_DIR}"
  fi

  info ""
  info "Flutter is installed. Handing off to fledging..."
  info ""

  _handoff_to_dart
}

# ============================================================
# Sourceable for testing — skip main when sourced, run when
# executed directly or piped (curl | bash).
# ============================================================
if [[ -n "${BASH_SOURCE[0]:-}" && "${BASH_SOURCE[0]}" != "${0}" ]]; then
  return 0
fi

main "$@"
