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
    source "${BATS_TEST_DIRNAME}/../install.sh"
    unset HOME
    recover_env
    [ -n "$HOME" ]
    [[ "$HOME" == /* ]]  # must be an absolute path
  )
}

@test "recover_env: aborts if POSIXLY_CORRECT is set" {
  run bash -c "POSIXLY_CORRECT=1 source \"${BATS_TEST_DIRNAME}/../install.sh\"; recover_env"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "POSIXLY_CORRECT" ]]
}
