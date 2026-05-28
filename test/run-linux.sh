#!/usr/bin/env bash
# Run linux-install.sh against multiple Linux distros via Docker.
# Success = Flutter installed (pub.dev handoff always fails until fledging is published).
#
# Usage:
#   ./test/run-linux.sh                  # run all variants
#   ./test/run-linux.sh ubuntu-arm64     # run a specific variant

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LINUX_SCRIPT="${REPO_ROOT}/linux-install.sh"

if [[ ! -f "$LINUX_SCRIPT" ]]; then
  echo "Error: linux-install.sh not found at ${REPO_ROOT}"
  exit 1
fi

if [[ ! -f "${SCRIPT_DIR}/zscaler-ca.pem" ]]; then
  echo "Error: zscaler-ca.pem not found. Copy it to test/ before running."
  exit 1
fi

# ── Test variants ────────────────────────────────────────────
# Format: "name|platform|image-tag|dockerfile"
ALL_VARIANTS=(
  "Ubuntu 24.04 arm64|linux/arm64|fledging-test-ubuntu-arm64|Dockerfile.linux-test"
  "Ubuntu 24.04 x64|linux/amd64|fledging-test-ubuntu-x64|Dockerfile.linux-test"
  "Fedora 40 x64|linux/amd64|fledging-test-fedora|Dockerfile.linux-test-fedora"
  "Arch Linux x64|linux/amd64|fledging-test-arch|Dockerfile.linux-test-arch"
  "Alpine 3.21 x64|linux/amd64|fledging-test-alpine|Dockerfile.linux-test-alpine"
)

# Filter to requested variant if one was passed
if [[ $# -gt 0 ]]; then
  FILTER="$1"
  VARIANTS=()
  for v in "${ALL_VARIANTS[@]}"; do
    tag="$(echo "$v" | cut -d'|' -f3)"
    if [[ "$tag" == *"$FILTER"* ]]; then
      VARIANTS+=("$v")
    fi
  done
  if [[ ${#VARIANTS[@]} -eq 0 ]]; then
    echo "No variant matching '$FILTER'. Available:"
    for v in "${ALL_VARIANTS[@]}"; do echo "  $(echo "$v" | cut -d'|' -f3)"; done
    exit 1
  fi
else
  VARIANTS=("${ALL_VARIANTS[@]}")
fi

# ── Run each variant ─────────────────────────────────────────
pass=0
fail=0
declare -a results=()

for variant in "${VARIANTS[@]}"; do
  IFS='|' read -r name platform image dockerfile <<< "$variant"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Testing: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Build image
  echo "--> Building $image..."
  if ! docker build --platform "$platform" -t "$image" \
      -f "${SCRIPT_DIR}/${dockerfile}" "$SCRIPT_DIR" 2>&1 | tail -3; then
    echo "❌ FAIL: $name — image build failed"
    results+=("❌ $name — image build failed")
    ((fail++))
    continue
  fi

  # Run script, capture output
  tmplog=$(mktemp)
  set +e
  docker run --platform "$platform" --rm \
    -v "${LINUX_SCRIPT}:/home/fledger/linux-install.sh" \
    "$image" \
    bash linux-install.sh --headless 2>&1 | tee "$tmplog"
  exit_code=${PIPESTATUS[0]}
  set -e

  # Success = Flutter installed (handoff always fails until fledging is on pub.dev)
  if grep -q "Flutter is installed\." "$tmplog"; then
    echo ""
    echo "✅ PASS: $name"
    results+=("✅  $name")
    ((pass++))
  else
    echo ""
    echo "❌ FAIL: $name (exit $exit_code — Flutter install did not complete)"
    results+=("❌  $name (exit $exit_code)")
    ((fail++))
  fi

  rm -f "$tmplog"
done

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Results: $pass passed, $fail failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for r in "${results[@]}"; do
  echo "  $r"
done
echo ""

[[ $fail -eq 0 ]]
