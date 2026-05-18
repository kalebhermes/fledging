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
# Sourceable for testing — return exits without running main
# ============================================================
return 0 2>/dev/null

main "$@"
