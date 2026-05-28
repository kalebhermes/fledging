# Tests

## macOS unit tests (BATS)

Covers individual functions in `macos-install.sh` without running any actual installs. External calls are stubbed via function shadowing — no network, no disk writes.

**Install the test runner:**

```bash
brew install bats-core
```

**Run:**

```bash
bats test/install.bats
```

---

## Linux integration tests (Docker)

Runs `linux-install.sh` end-to-end in a clean Docker container for each supported distro. The test is considered passing when Flutter is fully installed — the final `dart pub global run fledging` handoff is expected to fail until the `fledging` package is published to pub.dev.

**Prerequisites:**

- Docker
- `test/zscaler-ca.pem` — required when running on a network with SSL inspection (e.g. corporate Zscaler proxy). Copy the root CA certificate into `test/` before running. This file is gitignored.

**Run all distros:**

```bash
bash test/run-linux.sh
```

**Run a specific distro:**

```bash
bash test/run-linux.sh ubuntu-arm64
bash test/run-linux.sh ubuntu-x64
bash test/run-linux.sh fedora
bash test/run-linux.sh arch
bash test/run-linux.sh alpine
```

**Tested distros:**

| Image | Arch | Package manager |
|---|---|---|
| Ubuntu 24.04 | arm64 | apt |
| Ubuntu 24.04 | x64 | apt |
| Fedora 40 | x64 | dnf |
| Arch Linux | x64 | pacman |
| Alpine 3.21 | x64 | apk |
