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

@test "FLEDGING_VERSION constant is defined" {
  [ -n "${FLEDGING_VERSION:-}" ]
}

@test "FLEDGING_TMP is under HOME" {
  [[ "${FLEDGING_TMP:-}" == "$HOME"* ]]
}
