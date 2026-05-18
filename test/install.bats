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

@test "FLEDGING_TMP starts empty (initialized lazily in setup_tmp after recover_env)" {
  [ -z "${FLEDGING_TMP:-}" ]
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

@test "parse_args: --flutter-version rejects single-dash flag as value" {
  run parse_args --flutter-version -y
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

@test "detect_platform: Linux 64-bit kernel with 32-bit userspace exits 1" {
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

@test "setup_tmp: creates FLEDGING_TMP at ~/.fledging/tmp" {
  ignore rm -rf "$HOME/.fledging/tmp"
  setup_tmp
  [ -d "$HOME/.fledging/tmp" ]
}

@test "download_file: uses wget when curl is snap" {
  stub_fn is_snap_curl 'return 0'
  # wget stub that creates the .part output file (arg $2 is --output-document=<path>)
  stub_fn wget 'local f="${2#--output-document=}"; touch "$f"; return 0'
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
