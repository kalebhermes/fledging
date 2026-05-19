#!/usr/bin/env node

/**
 * scaffold.mjs — Generate a Vite + React + Pacific starter project
 *
 * Usage: node scaffold.mjs <target-directory> [--build-mode=single-file|normal] [--chrome=full|minimal|none]
 *
 * Copies templates/static-dashboard/ to the target directory and
 * adjusts package.json name based on the directory name.
 *
 * Build modes:
 *   single-file (default) — produces one self-contained HTML file via
 *     vite-plugin-singlefile + inline-css.mjs post-build script.
 *     Works from file:// without CORS issues.
 *   normal — standard multi-file Vite build.
 *
 * Chrome modes:
 *   none (default) — no SoFi app chrome. Plain header with dark mode toggle.
 *   minimal — ProductFlowHeader from @sofi-web-ui/core (logo + product name + dark mode). Light footer.
 *   full — SoFiHeader + Footer with legal links. Uses PageShell layout component.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, 'templates', 'static-dashboard');
const LAYOUTS_DIR = path.join(__dirname, 'templates', 'layouts');
const VERSION_PATH = path.join(__dirname, 'data', 'version.json');

const VALID_BUILD_MODES = ['single-file', 'normal'];
const VALID_CHROME_MODES = ['full', 'minimal', 'none'];

function parseArgs() {
  const raw = process.argv.slice(2);
  const positional = raw.filter(a => !a.startsWith('--'));
  const flags = raw.filter(a => a.startsWith('--'));
  const targetDir = positional[0] || null;
  const buildModeFlag = flags.find(f => f.startsWith('--build-mode='));
  const buildMode = buildModeFlag ? buildModeFlag.split('=')[1] : 'single-file';
  const chromeFlag = flags.find(f => f.startsWith('--chrome='));
  const chrome = chromeFlag ? chromeFlag.split('=')[1] : 'none';
  return { targetDir, buildMode, chrome };
}

function copyDir(src, dest, skip = new Set()) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, skip);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Strip single-file build artifacts from the scaffolded project:
 * - Remove vite-plugin-singlefile import + plugin registration from vite.config.ts
 * - Remove base: './' from vite.config.ts
 * - Remove vite-plugin-singlefile from package.json devDependencies
 * - Revert build/serve scripts to plain vite build
 */
function stripSingleFileSupport(absTarget) {
  // --- vite.config.ts ---
  const vitePath = path.join(absTarget, 'vite.config.ts');
  if (fs.existsSync(vitePath)) {
    let vite = fs.readFileSync(vitePath, 'utf-8');
    // Remove the import line
    vite = vite.replace(/import \{ viteSingleFile \} from 'vite-plugin-singlefile';\n/, '');
    // Keep base: './' — relative asset paths work at any URL prefix,
    // which is essential for hosting on webcore-static-proxy or any non-root path.
    // Remove viteSingleFile() plugin line
    vite = vite.replace(/    viteSingleFile\(\),\n/, '');
    fs.writeFileSync(vitePath, vite);
  }

  // --- package.json ---
  const pkgPath = path.join(absTarget, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    // Revert build scripts
    if (pkg.scripts) {
      pkg.scripts.build = 'vite build';
      pkg.scripts.serve = 'vite build && vite preview';
    }
    // Remove vite-plugin-singlefile dep
    if (pkg.devDependencies) {
      delete pkg.devDependencies['vite-plugin-singlefile'];
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

/**
 * Apply chrome mode to the scaffolded project:
 * - Copy the appropriate App.tsx variant
 * - Copy layout files if needed (full mode)
 * - Add chrome package dependencies
 * - Add chrome packages to externalPackages in vite.config.ts
 */
function applyChromeMode(absTarget, chrome) {
  const chromeTemplatePath = path.join(__dirname, 'templates', `chrome-${chrome}`, 'App.tsx');
  const targetAppPath = path.join(absTarget, 'src', 'App.tsx');

  // Overwrite App.tsx with the chrome variant
  if (fs.existsSync(chromeTemplatePath)) {
    fs.copyFileSync(chromeTemplatePath, targetAppPath);
  }

  // For full mode, copy PageShell and FullWidth layout components
  if (chrome === 'full') {
    const layoutsDest = path.join(absTarget, 'src', 'components', 'layouts');
    fs.mkdirSync(layoutsDest, { recursive: true });
    for (const file of ['PageShell.tsx', 'FullWidth.tsx', 'index.ts']) {
      const src = path.join(LAYOUTS_DIR, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(layoutsDest, file));
      }
    }
    // Trim barrel to only export what's copied
    const barrelPath = path.join(layoutsDest, 'index.ts');
    fs.writeFileSync(barrelPath, [
      'export { PageShell } from "./PageShell";',
      'export { FullWidth } from "./FullWidth";',
      '',
    ].join('\n'));
  }

  // Add chrome dependencies to package.json
  const pkgPath = path.join(absTarget, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    // Read pinned versions
    let pinnedVersions = {};
    if (fs.existsSync(VERSION_PATH)) {
      const version = JSON.parse(fs.readFileSync(VERSION_PATH, 'utf-8'));
      pinnedVersions = version.sofiWebUi?.packages || {};
    }

    if (chrome === 'full') {
      pkg.dependencies['@sofi-web-ui/sofi-header'] = pinnedVersions['@sofi-web-ui/sofi-header'] || '^4.11.3';
      pkg.dependencies['@sofi-web-ui/footer'] = pinnedVersions['@sofi-web-ui/footer'] || '^5.2.0';
    }
    // chrome=minimal uses ProductFlowHeader from @sofi-web-ui/core (already a base dependency)

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  // Add chrome packages to externalPackages in vite.config.ts
  const vitePath = path.join(absTarget, 'vite.config.ts');
  if (fs.existsSync(vitePath)) {
    let vite = fs.readFileSync(vitePath, 'utf-8');
    const newPackages = [];
    if (chrome === 'full') {
      newPackages.push("'@sofi-web-ui/sofi-header'", "'@sofi-web-ui/footer'");
    }
    if (newPackages.length > 0) {
      // Insert after the last existing entry in externalPackages
      vite = vite.replace(
        "'@sofi-web-ui/icons',",
        `'@sofi-web-ui/icons',\n        ${newPackages.join(',\n        ')},`
      );
    }
    fs.writeFileSync(vitePath, vite);
  }
}

function main() {
  const { targetDir, buildMode, chrome } = parseArgs();

  if (!targetDir) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: 'Usage: node scaffold.mjs <target-directory> [--build-mode=single-file|normal] [--chrome=full|minimal|none]',
    }) + '\n');
    process.exit(1);
  }

  if (!VALID_BUILD_MODES.includes(buildMode)) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: `Invalid build mode "${buildMode}". Must be one of: ${VALID_BUILD_MODES.join(', ')}`,
    }) + '\n');
    process.exit(1);
  }

  if (!VALID_CHROME_MODES.includes(chrome)) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: `Invalid chrome mode "${chrome}". Must be one of: ${VALID_CHROME_MODES.join(', ')}`,
    }) + '\n');
    process.exit(1);
  }

  const absTarget = path.resolve(targetDir);

  if (fs.existsSync(absTarget) && fs.readdirSync(absTarget).length > 0) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: `Directory "${absTarget}" already exists and is not empty.`,
    }) + '\n');
    process.exit(1);
  }

  if (!fs.existsSync(TEMPLATE_DIR)) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: `Template not found at ${TEMPLATE_DIR}. Skill may be incomplete.`,
    }) + '\n');
    process.exit(1);
  }

  // Copy template — skip inline-css.mjs for normal mode
  const skip = buildMode === 'normal' ? new Set(['inline-css.mjs']) : new Set();
  copyDir(TEMPLATE_DIR, absTarget, skip);

  // For normal mode, strip single-file build config from copied files
  if (buildMode === 'normal') {
    stripSingleFileSupport(absTarget);
  }

  // Apply chrome mode (must happen after base template copy)
  if (chrome !== 'none') {
    applyChromeMode(absTarget, chrome);
  }

  // Adjust package.json: name + pin sofi-web-ui versions from version.json
  const pkgPath = path.join(absTarget, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.name = path.basename(absTarget);

    // Pin exact sofi-web-ui versions from the skill's frozen data
    if (fs.existsSync(VERSION_PATH)) {
      const version = JSON.parse(fs.readFileSync(VERSION_PATH, 'utf-8'));
      const pinned = version.sofiWebUi?.packages || {};
      for (const [name, ver] of Object.entries(pinned)) {
        if (pkg.dependencies?.[name]) {
          pkg.dependencies[name] = ver;
        }
      }
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  process.stdout.write(JSON.stringify({
    status: 'ok',
    directory: absTarget,
    buildMode,
    chrome,
    nextSteps: [
      `cd ${absTarget}`,
      'npm install',
      'npm run dev',
    ],
  }, null, 2) + '\n');
}

main();
