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

**Corporate SSL proxies (optional):**
If your network uses SSL inspection (Zscaler, etc.), drop your org's root CA certificate(s) into `test/certificates/` before running. Any `.pem` or `.crt` files found there are injected into each Docker image's trust store at build time. The directory is gitignored — tests run fine without any certs present.

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
