#!/usr/bin/env node

/**
 * test.mjs — Tests for pacific-vibe skill scripts
 *
 * Uses Node's built-in test runner (node:test + node:assert).
 * Run: node --test test.mjs
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run a skill script and return parsed JSON stdout.
 * Throws on non-JSON output; returns { stdout, stderr, exitCode } for
 * scripts that exit non-zero.
 */
async function run(script, args = []) {
  const scriptPath = path.join(__dirname, script);
  try {
    const { stdout, stderr } = await execFileAsync('node', [scriptPath, ...args], {
      cwd: __dirname,
      timeout: 15_000,
    });
    return { data: JSON.parse(stdout), stdout, stderr, exitCode: 0 };
  } catch (err) {
    // execFile throws on non-zero exit — still try to parse stdout
    const stdout = err.stdout || '';
    const stderr = err.stderr || '';
    let data = null;
    try { data = JSON.parse(stdout); } catch { /* not JSON */ }
    return { data, stdout, stderr, exitCode: err.code ?? 1 };
  }
}

/** Create a unique temp dir that gets cleaned up after the test. */
function makeTempDir(prefix = 'pacific-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// ─── search.mjs ──────────────────────────────────────────────────────

describe('search.mjs', () => {
  it('empty query returns all components (count > 100)', async () => {
    const { data } = await run('search.mjs', ['']);
    assert.ok(Array.isArray(data), 'should return an array');
    assert.ok(data.length > 100, `expected >100 components, got ${data.length}`);
  });

  it('known component name returns exact match (score 100)', async () => {
    const { data } = await run('search.mjs', ['Typography']);
    assert.ok(data.length > 0, 'should find at least one result');
    const exact = data.find(c => c.name === 'Typography');
    assert.ok(exact, 'should include Typography');
    assert.equal(exact.score, 100);
  });

  it('--props flag includes prop details', async () => {
    const { data } = await run('search.mjs', ['Button', '--props']);
    assert.ok(data.length > 0);
    const first = data[0];
    assert.ok(Array.isArray(first.props), 'should have props array');
    assert.ok(first.props.length > 0, 'props should not be empty');
    assert.ok(first.props[0].name, 'each prop should have a name');
  });

  it('--category=form-inputs filters correctly', async () => {
    const { data } = await run('search.mjs', ['', '--category=form-inputs']);
    assert.ok(data.length > 0, 'should return some components');
    for (const c of data) {
      assert.ok(c.package.endsWith('form-inputs'), `expected form-inputs package, got ${c.package}`);
    }
  });

  it('unknown query returns empty array', async () => {
    const { data } = await run('search.mjs', ['zzz_nonexistent_xyz']);
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 0);
  });
});

// ─── search.mjs --type=icons ─────────────────────────────────────────

describe('search.mjs --type=icons', () => {
  it('empty query returns all icons', async () => {
    const { data } = await run('search.mjs', ['', '--type=icons']);
    assert.ok(Array.isArray(data), 'should return an array');
    assert.ok(data.length > 200, `expected >200 icons, got ${data.length}`);
  });

  it('known icon name returns exact match (score 100)', async () => {
    const { data } = await run('search.mjs', ['Settings', '--type=icons']);
    assert.ok(data.length > 0, 'should find at least one result');
    const exact = data.find(i => i.name === 'Settings');
    assert.ok(exact, 'should include Settings');
    assert.equal(exact.score, 100);
  });

  it('result includes import and usage snippets', async () => {
    const { data } = await run('search.mjs', ['Settings', '--type=icons']);
    const icon = data.find(i => i.name === 'Settings');
    assert.ok(icon.import.includes("import { Settings } from '@sofi-web-ui/icons'"));
    assert.ok(icon.usage.includes('Icon'));
  });

  it('--category filter works', async () => {
    const { data } = await run('search.mjs', ['', '--type=icons', '--category=Social']);
    assert.ok(data.length > 0, 'should return some icons');
    assert.ok(data.length <= 10, `Social should have few icons, got ${data.length}`);
    for (const i of data) {
      assert.equal(i.category, 'Social', `expected Social category, got ${i.category}`);
    }
  });

  it('unknown query returns empty array', async () => {
    const { data } = await run('search.mjs', ['zzz_nonexistent_xyz', '--type=icons']);
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 0);
  });
});

// ─── get-tokens.mjs ──────────────────────────────────────────────────

describe('get-tokens.mjs', () => {
  const validCategories = [
    'colors', 'spacing', 'typography', 'elevation', 'borders',
    'colorPrimitives', 'breakpoints', 'fonts', 'shadows', 'weights', 'easing',
  ];

  for (const cat of validCategories) {
    it(`category "${cat}" returns status ok`, async () => {
      const { data } = await run('get-tokens.mjs', [cat]);
      assert.equal(data.status, 'ok');
      assert.equal(data.category, cat);
      assert.ok(data.data && typeof data.data === 'object');
    });
  }

  it('"all" without search returns summary with counts', async () => {
    const { data } = await run('get-tokens.mjs', ['all']);
    assert.equal(data.status, 'ok');
    assert.equal(data.category, 'all');
    // Each category summary should have a count field
    const cats = Object.keys(data.data);
    assert.ok(cats.length > 5, `expected many categories, got ${cats.length}`);
    for (const cat of cats) {
      assert.ok(typeof data.data[cat].count === 'number', `${cat} should have count`);
    }
  });

  it('--search=surface within colors returns matches', async () => {
    const { data } = await run('get-tokens.mjs', ['colors', '--search=surface']);
    assert.equal(data.status, 'ok');
    const keys = Object.keys(data.data);
    assert.ok(keys.length > 0, 'should find some surface tokens');
    // Search matches on key OR description — verify at least some keys contain "surface"
    const surfaceKeys = keys.filter(k => k.toLowerCase().includes('surface'));
    assert.ok(surfaceKeys.length > 0, 'at least some keys should contain "surface"');
  });

  it('invalid category returns error with suggestions', async () => {
    const { data, exitCode } = await run('get-tokens.mjs', ['nonexistent']);
    assert.notEqual(exitCode, 0);
    assert.equal(data.status, 'error');
    assert.ok(data.message.includes('Unknown category'));
    assert.ok(data.message.includes('colors'), 'error should list available categories');
  });
});

// ─── scaffold.mjs ────────────────────────────────────────────────────

describe('scaffold.mjs', () => {
  it('no argument returns error JSON', async () => {
    const { data, exitCode } = await run('scaffold.mjs');
    assert.notEqual(exitCode, 0);
    assert.equal(data.status, 'error');
    assert.ok(data.message.includes('Usage'));
  });

  describe('single-file mode (default)', () => {
    let dir;
    let pkg;
    let viteConfig;

    before(async () => {
      dir = makeTempDir('scaffold-single-');
      // Remove the dir so scaffold can create it (it checks non-empty)
      fs.rmSync(dir, { recursive: true });
      const { data } = await run('scaffold.mjs', [dir]);
      assert.equal(data.status, 'ok');
      assert.equal(data.buildMode, 'single-file');
      pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      viteConfig = fs.readFileSync(path.join(dir, 'vite.config.ts'), 'utf-8');
    });

    after(() => {
      if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
    });

    it('creates expected files including inline-css.mjs', () => {
      assert.ok(fs.existsSync(path.join(dir, 'inline-css.mjs')));
      assert.ok(fs.existsSync(path.join(dir, 'vite.config.ts')));
      assert.ok(fs.existsSync(path.join(dir, 'package.json')));
      assert.ok(fs.existsSync(path.join(dir, 'index.html')));
      assert.ok(fs.existsSync(path.join(dir, 'src', 'App.tsx')));
      assert.ok(fs.existsSync(path.join(dir, 'src', 'main.tsx')));
    });

    it('build script chains inline-css.mjs', () => {
      assert.ok(
        pkg.scripts.build.includes('node inline-css.mjs'),
        `build script should chain inline-css.mjs, got: ${pkg.scripts.build}`,
      );
    });

    it('vite-plugin-singlefile is in devDependencies', () => {
      assert.ok(pkg.devDependencies['vite-plugin-singlefile']);
    });

    it('vite.config.ts includes viteSingleFile and base', () => {
      assert.ok(viteConfig.includes('viteSingleFile'), 'should import viteSingleFile');
      assert.ok(viteConfig.includes("base: './'"), 'should have base: ./');
    });

    it('package.json has pinned sofi-web-ui versions', () => {
      // versions.json has specific versions — they should NOT be PINNED_BY_SCAFFOLD
      for (const dep of ['@sofi-web-ui/core', '@sofi-web-ui/base', '@sofi-web-ui/form-inputs', '@sofi-web-ui/icons']) {
        assert.ok(pkg.dependencies[dep], `should have ${dep}`);
        assert.notEqual(pkg.dependencies[dep], 'PINNED_BY_SCAFFOLD', `${dep} should be pinned`);
      }
    });

    it('package.json name matches directory basename', () => {
      assert.equal(pkg.name, path.basename(dir));
    });
  });

  describe('normal mode (--build-mode=normal)', () => {
    let dir;
    let pkg;
    let viteConfig;

    before(async () => {
      dir = makeTempDir('scaffold-normal-');
      fs.rmSync(dir, { recursive: true });
      const { data } = await run('scaffold.mjs', [dir, '--build-mode=normal']);
      assert.equal(data.status, 'ok');
      assert.equal(data.buildMode, 'normal');
      pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      viteConfig = fs.readFileSync(path.join(dir, 'vite.config.ts'), 'utf-8');
    });

    after(() => {
      if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
    });

    it('omits inline-css.mjs', () => {
      assert.ok(!fs.existsSync(path.join(dir, 'inline-css.mjs')));
    });

    it('build script is plain vite build', () => {
      assert.equal(pkg.scripts.build, 'vite build');
    });

    it('vite-plugin-singlefile is NOT in devDependencies', () => {
      assert.ok(!pkg.devDependencies['vite-plugin-singlefile']);
    });

    it('vite.config.ts does NOT include viteSingleFile or base', () => {
      assert.ok(!viteConfig.includes('viteSingleFile'));
      assert.ok(!viteConfig.includes("base: './'"));
    });

    it('package.json has pinned sofi-web-ui versions', () => {
      for (const dep of ['@sofi-web-ui/core', '@sofi-web-ui/base']) {
        assert.notEqual(pkg.dependencies[dep], 'PINNED_BY_SCAFFOLD');
      }
    });
  });

  it('non-empty directory returns error', async () => {
    const dir = makeTempDir('scaffold-nonempty-');
    fs.writeFileSync(path.join(dir, 'existing.txt'), 'hi');
    try {
      const { data, exitCode } = await run('scaffold.mjs', [dir]);
      assert.notEqual(exitCode, 0);
      assert.equal(data.status, 'error');
      assert.ok(data.message.includes('not empty'));
    } finally {
      fs.rmSync(dir, { recursive: true });
    }
  });

  it('invalid build mode returns error', async () => {
    const dir = makeTempDir('scaffold-badmode-');
    fs.rmSync(dir, { recursive: true });
    try {
      const { data, exitCode } = await run('scaffold.mjs', [dir, '--build-mode=invalid']);
      assert.notEqual(exitCode, 0);
      assert.equal(data.status, 'error');
      assert.ok(data.message.includes('Invalid build mode'));
    } finally {
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
    }
  });
});

// ─── Data integrity ──────────────────────────────────────────────────

describe('data integrity', () => {
  const DATA_DIR = path.join(__dirname, 'data');

  it('components.json is a valid array with expected fields', () => {
    const components = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'components.json'), 'utf-8'));
    assert.ok(Array.isArray(components));
    assert.ok(components.length > 0);
    for (const c of components) {
      assert.ok(c.name, 'each component should have a name');
      assert.ok(c.package, 'each component should have a package');
      assert.ok(Array.isArray(c.props), 'each component should have a props array');
    }
  });

  it('tokens.json has required categories', () => {
    const tokens = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tokens.json'), 'utf-8'));
    const required = ['colors', 'spacing', 'typography', 'elevation', 'borders'];
    for (const cat of required) {
      assert.ok(tokens[cat], `tokens.json should have "${cat}" category`);
    }
  });

  it('icons.json is a valid array with expected fields', () => {
    const icons = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'icons.json'), 'utf-8'));
    assert.ok(Array.isArray(icons));
    assert.ok(icons.length > 200, `expected >200 icons, got ${icons.length}`);
    for (const i of icons) {
      assert.ok(i.name, 'each icon should have a name');
      assert.ok(i.category, 'each icon should have a category');
      assert.ok(i.iconType, 'each icon should have an iconType');
      assert.ok(i.iconTitle, 'each icon should have an iconTitle');
    }
    // Verify all 4 categories are present
    const categories = [...new Set(icons.map(i => i.category))];
    for (const cat of ['Interface', 'Products', 'Social', 'SoFiX']) {
      assert.ok(categories.includes(cat), `should have ${cat} category`);
    }
  });

  it('version.json iconCount matches icons.json length', () => {
    const version = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'version.json'), 'utf-8'));
    const icons = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'icons.json'), 'utf-8'));
    assert.equal(version.iconCount, icons.length);
  });

  it('version.json componentCount matches components.json length', () => {
    const version = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'version.json'), 'utf-8'));
    const components = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'components.json'), 'utf-8'));
    assert.equal(version.componentCount, components.length);
  });

  it('all supernovaFile references point to existing files', () => {
    const components = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'components.json'), 'utf-8'));
    const withSupernova = components.filter(c => c.supernovaFile);
    assert.ok(withSupernova.length > 0, 'should have some components with supernovaFile');
    for (const c of withSupernova) {
      const snPath = path.join(DATA_DIR, 'supernova', `${c.supernovaFile}.md`);
      assert.ok(
        fs.existsSync(snPath),
        `supernovaFile "${c.supernovaFile}" for ${c.name} should exist at ${snPath}`,
      );
    }
  });
});
