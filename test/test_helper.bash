# Override a shell function for a single test.
# Usage: stub_fn <name> <body>
# Example: stub_fn xcode-select 'return 0'
stub_fn() {
  local name="$1"
  local body="$2"
  eval "${name}() { ${body}; }"
}
