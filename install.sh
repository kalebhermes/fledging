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
