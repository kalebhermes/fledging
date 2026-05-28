# Installer Script Comparison

Comparison of fledging's install scripts against five widely-used installer scripts in the developer tooling space. Each script is rated 1–5 on five criteria.

## Criteria

| Criterion | What it measures |
|---|---|
| **Understandability** | Code reads clearly to a human; logical structure, good naming, not spaghetti |
| **Flexibility** | Safe fallbacks, handles known platform quirks (Rosetta, musl, snap curl, ARM variants, etc.) |
| **Ease of install** | How many steps the user must take; complexity of the install command |
| **Environment impact** | How much is left on the user's machine; manual cleanup required; disk footprint |
| **Rerunability** | Safe to run twice; upgrades in place; skips already-installed tools |

---

## Scores

| Script | Understandability | Flexibility | Ease of install | Environment impact | Rerunability |
|---|:---:|:---:|:---:|:---:|:---:|
| **rustup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Homebrew** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **fvm** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **nvm** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **mise** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **fledging (macOS)** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **fledging (Linux)** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## Notes per script

### rustup
- **Understandability:** `main()` reads like a prose outline; `ensure`/`ignore`/`need_cmd` wrappers make call sites read like English; inline comments explain non-obvious decisions throughout.
- **Flexibility:** Best-in-class — Rosetta 2, musl vs glibc via `ldd --version`, snap curl fallback, BusyBox wget without TLS enforcement, 32-bit userland on 64-bit kernels, ARM NEON feature check, LoongArch UAPI via embedded base64 probe binary, `noexec /tmp` detection.
- **Ease of install:** Single command with `-y` for fully unattended; `--default-toolchain`, `--profile`, and `--component` flags for customization without post-install steps.
- **Environment impact:** Installs to `~/.cargo` and `~/.rustup`, modifies shell profile, several hundred MB toolchain footprint. `rustup self uninstall` provides a clean removal path.
- **Rerunability:** Fully idempotent — detects existing install and updates in place rather than reinstalling from scratch.

### Homebrew
- **Understandability:** Clear utility-functions block followed by labeled execution section; every function has a single descriptive name; non-obvious decisions like the four-step git init for reinstall safety are commented.
- **Flexibility:** Snap curl explicitly rejected; custom `which()` shim; git remotes overridable via env vars; Linux with outdated glibc falls back to vendored Ruby; container root-execution carve-out.
- **Ease of install:** Single curl-pipe-bash command; handles everything including Xcode CLT installation; prints exact copy-paste shell config commands in "Next steps" at the end.
- **Environment impact:** Creates ~20 directories under `HOMEBREW_PREFIX`, drops a full git repo, writes to `/etc/paths.d/homebrew` on ARM Macs, populates `HOMEBREW_CACHE`. Heavy but transparent — all announced up front.
- **Rerunability:** Directory creation guarded, uses `git config` instead of `git remote add` to avoid failure on existing remotes; always runs `brew update --force` on re-run, which is slow but not destructive.

### fvm
- **Understandability:** Labeled `readonly` constants, named helper functions, single `main()` that reads top-to-bottom — any developer can follow without prior context.
- **Flexibility:** Rosetta/Apple Silicon via `sysctl`, musl via three independent detection methods, glibc tarball fallback if musl-specific isn't published, six ARM variant normalizations, PATH output tailored for 10+ CI providers.
- **Ease of install:** Single command; no sudo required; the one knock is PATH setup is entirely manual — the script intentionally doesn't write to shell config files.
- **Environment impact:** One binary in `~/fvm/bin/`, temp dir cleaned via EXIT trap, cached Flutter SDKs in `~/fvm/versions/` are intentionally preserved on uninstall. Manual shell-config edit required to remove PATH line.
- **Rerunability:** `cp -a` overwrites on re-run; v1 migration guarded by existence checks; `set -euo pipefail` ensures unexpected state fails loudly rather than silently corrupting an existing install.

### nvm
- **Understandability:** Small single-purpose functions, `nvm_do_install` reads like a checklist; the git install block (clone-vs-init, tag-vs-ref branching) gets dense and takes a few readings.
- **Flexibility:** curl/wget fallback with flag translation, git/script/auto-detect method selection, `$NVM_DIR`/`$NVM_SOURCE` overrides, XDG config home, snap-curl workaround, macOS Xcode guard, `$PROFILE=/dev/null` opt-out.
- **Ease of install:** Single command; optionally installs a Node version if `$NODE_VERSION` is set; zero follow-up steps beyond reopening the terminal.
- **Environment impact:** Full git repo left in `~/.nvm`, permanently appends init lines to shell profile, no uninstall path mentioned or provided.
- **Rerunability:** Detects existing `.git` and fetches instead of re-cloning; script mode checks for existing `nvm.sh`; profile writes gated on grep check so init block is never appended twice.

### mise
- **Understandability:** `#region` markers and short well-named functions make the overall flow easy to follow; the `get_checksum` function is a deeply nested block for every OS/arch/ext combo — there's even a `# TODO: refactor this, it's a bit messy` comment in the source.
- **Flexibility:** Musl auto-detection via `ldd` (Android/Termux special-cased), zstd support gated on tool presence and tar version, curl/wget fallback, `MISE_INSTALL_OS`/`MISE_INSTALL_ARCH`/`MISE_TARBALL_URL` env var overrides for every assumption, air-gapped install support.
- **Ease of install:** Single command; prints shell-specific `eval` activation lines tailored to zsh/bash/fish so the user knows exactly what to add.
- **Environment impact:** Only `~/.local/bin/mise` binary; both download and extract tmpdirs explicitly removed; no shell rc file touched. Minimal footprint, no uninstall needed beyond deleting the binary.
- **Rerunability:** `rm -f` before extraction cleanly overwrites; no version-check guard means every run unconditionally re-downloads and overwrites, even if already on latest.

### fledging (macOS)
- **Understandability:** Well-structured with section headers, thin `_wrapper()` functions for testability, and single-responsibility functions throughout. The awk-based JSON parser in `_parse_flutter_release` is the most complex section and takes some reading. On par with nvm and mise.
- **Flexibility:** Rosetta 2 detection, snap curl guard with wget fallback, `$HOME`/`$USER` recovery for container environments, `POSIXLY_CORRECT` guard, softwareupdate catalog approach for headless CLT, `/dev/tty` reconnection for piped execution, atomic shell config writes, symlink-safe config handling, `ZDOTDIR` support.
- **Ease of install:** Single `curl | bash` command; headless mode (`--headless`/`-y`) for CI/automation; `--flutter-version` and `--no-fvm` flags for customization without post-install steps.
- **Environment impact:** Heaviest footprint of any script in this comparison — Xcode CLT (GBs), Homebrew (large git repo), fvm binary, and the Flutter SDK (~500MB+). This is intentional for a full dev environment bootstrapper, but there is no uninstall path. Shell config is backed up before modification.
- **Rerunability:** Skips already-installed tools at each step (brew, fvm, flutter); PATH persistence is idempotent with dedup check; temp files cleaned via EXIT trap. Does not check existing versions or upgrade in place — re-running with a different `--flutter-version` installs an additional fvm version alongside, not instead of, the existing one.

### fledging (Linux)
- **Understandability:** Same structure and patterns as the macOS script. The package manager detection and distro-specific prereq branching is clean and well-labeled. awk JSON parser applies equally here.
- **Flexibility:** apt/dnf/pacman/apk support with appropriate packages per distro; arm64 fully supported on the fvm path; arm64 blocked on `--no-fvm` with a clear error pointing to the correct path; snap curl guard; musl detection with `gcompat` shim for Alpine; `$HOME`/`$USER` recovery.
- **Ease of install:** Same as macOS — single `curl | bash`; headless mode; customization flags. No sudo pre-setup required (the script elevates as needed inside `install_prereqs`).
- **Environment impact:** Lighter than macOS (no Xcode CLT or Homebrew), but system packages installed via the distro package manager are permanent and not tracked by the script. fvm + Flutter SDK still ~500MB+. No uninstall path.
- **Rerunability:** Same behavior as macOS — skips already-installed tools, dedup on PATH writes, temp cleanup. Package manager step reruns `apt-get update` on each invocation (slightly wasteful but not harmful).

---

## Takeaways

**Where fledging holds up well:**
- Flexibility is on par with the best in class — the edge case coverage (snap curl, Rosetta 2, container $HOME recovery, musl/gcompat) matches or exceeds most comparable scripts.
- Ease of install is as good as it gets — single command, headless mode, optional flags.

**Where fledging has room to improve:**
- **Environment impact** is the lowest-scoring criterion, primarily because there is no uninstall path and the macOS script installs a significant amount of tooling. This is appropriate for a dev environment bootstrapper (the user wants all this), but documenting what gets installed and how to remove it would improve the story.
- **Rerunability** could be improved by adding version-check logic — re-running with an already-current install should be a fast no-op rather than partially re-doing work.
- **Understandability** is solid but the awk JSON parser is the one section that requires close reading. Converting it to Python3 (which macOS ships with after CLT) or adding a comment block explaining the accumulator pattern would help.
