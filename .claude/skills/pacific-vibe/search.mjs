#!/usr/bin/env node

/**
 * search.mjs — Search Pacific components and icons by name or keyword
 *
 * Usage: node search.mjs <query> [--type=components|icons] [--category=...] [--props]
 *
 * --type=components (default): Search components.json
 *   --category=core|form-inputs|all
 *
 * --type=icons: Search icons.json
 *   --category=Interface|Products|Social|SoFiX|all
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const COMPONENTS_PATH = path.join(DATA_DIR, 'components.json');
const ICONS_PATH = path.join(DATA_DIR, 'icons.json');
const SUPERNOVA_INDEX_PATH = path.join(DATA_DIR, 'supernova-index.json');
const SUPERNOVA_MAP_PATH = path.join(DATA_DIR, 'supernova-map.json');

/**
 * Load a JSON file with graceful fallback. Returns null if missing.
 */
function loadJsonOptional(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
}

function parseArgs() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
  const query = args.join(' ').toLowerCase();
  const category = flags.find(f => f.startsWith('--category='))?.split('=')[1] || 'all';
  const showProps = flags.includes('--props');
  const type = flags.find(f => f.startsWith('--type='))?.split('=')[1] || 'components';
  return { query, category, showProps, type };
}

function fuzzyMatch(text, query) {
  if (!text) return 0;
  const lower = text.toLowerCase();

  // Exact match
  if (lower === query) return 100;

  // Starts with
  if (lower.startsWith(query)) return 90;

  // Contains as substring
  if (lower.includes(query)) return 70;

  // Word-boundary match (e.g. "btn" matches "ContainedButton")
  const words = query.split(/\s+/);
  const allWordsMatch = words.every(w => lower.includes(w));
  if (allWordsMatch) return 60;

  // Camel-case initial match (e.g. "ti" matches "TextInput")
  const initials = text.replace(/[a-z]/g, '').toLowerCase();
  if (initials.includes(query)) return 50;

  return 0;
}

function search(components, query, category) {
  let filtered = components;

  // Load Supernova enrichment data (optional — degrades gracefully)
  const snIndex = loadJsonOptional(SUPERNOVA_INDEX_PATH);
  const snMap = loadJsonOptional(SUPERNOVA_MAP_PATH);

  // Filter by category (package)
  if (category !== 'all') {
    const pkgSuffix = category; // "core" or "form-inputs"
    filtered = filtered.filter(c => c.package.endsWith(pkgSuffix));
  }

  if (!query) {
    // No query — list all
    return filtered.map(c => ({ ...c, score: 100 }));
  }

  // Score each component
  const scored = filtered.map(c => {
    const nameScore = fuzzyMatch(c.name, query);
    const descScore = fuzzyMatch(c.description || '', query) * 0.5;
    const propsScore = c.props.some(p =>
      p.name.toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query)
    ) ? 30 : 0;

    // Supernova enrichment signals
    let snDescScore = 0;
    let keywordScore = 0;
    const snDocName = snMap?.[c.name]; // e.g. "Banners", "Dialog"
    const snEntry = snDocName && snIndex?.[snDocName];

    if (snEntry) {
      // Supernova description match
      if (snEntry.description) {
        snDescScore = fuzzyMatch(snEntry.description, query) * 0.5;
      }

      // Keyword match — if any keyword contains or is contained by query
      if (snEntry.keywords) {
        for (const kw of snEntry.keywords) {
          if (kw.includes(query) || query.includes(kw)) {
            keywordScore = 60;
            break;
          }
        }
      }
    }

    let score = Math.max(nameScore, descScore, snDescScore, propsScore, keywordScore);

    // Tiebreaker: multi-signal bonus when more than one source matches
    let signalCount = 0;
    if (nameScore > 0) signalCount++;
    if (descScore > 0) signalCount++;
    if (snDescScore > 0) signalCount++;
    if (propsScore > 0) signalCount++;
    if (keywordScore > 0) signalCount++;
    if (signalCount >= 2) {
      score += 3;
    }

    return { ...c, score };
  });

  const matches = scored.filter(c => c.score > 0);

  // When a generic name matches exactly (e.g. "Button") but more-specific
  // variants also match (e.g. "ContainedButton", "OutlinedButton"), demote
  // the generic one so the actionable variants surface first. This handles
  // the common case where a base name is a callout/utility component while
  // prefixed variants are the intended user-facing components.
  const exactMatch = matches.find(c => c.name.toLowerCase() === query);
  if (exactMatch) {
    const hasSpecificVariants = matches.some(
      c => c !== exactMatch &&
        c.name.toLowerCase().endsWith(query) &&
        c.name.length > exactMatch.name.length
    );
    if (hasSpecificVariants) {
      exactMatch.score = 65; // below "contains" (70) so specific variants rank first
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

function searchIcons(icons, query, category) {
  let filtered = icons;

  if (category !== 'all') {
    filtered = filtered.filter(i => i.category.toLowerCase() === category.toLowerCase());
  }

  if (!query) {
    return filtered.map(i => ({ ...i, score: 100 }));
  }

  const scored = filtered.map(i => {
    const nameScore = fuzzyMatch(i.name, query);
    const titleScore = fuzzyMatch(i.iconTitle, query) * 0.8;
    const catScore = fuzzyMatch(i.category, query) * 0.3;
    const score = Math.max(nameScore, titleScore, catScore);
    return { ...i, score };
  });

  return scored
    .filter(i => i.score > 0)
    .sort((a, b) => b.score - a.score);
}

function main() {
  const { query, category, showProps, type } = parseArgs();

  if (type === 'icons') {
    if (!fs.existsSync(ICONS_PATH)) {
      process.stdout.write(JSON.stringify({
        status: 'error',
        message: 'Data not found. The skill data/ directory is missing icons.json.',
      }) + '\n');
      process.exit(1);
    }

    const icons = JSON.parse(fs.readFileSync(ICONS_PATH, 'utf-8'));
    const results = searchIcons(icons, query, category);

    const output = results.map(i => ({
      name: i.name,
      category: i.category,
      iconType: i.iconType,
      score: i.score,
      import: `import { ${i.name} } from '@sofi-web-ui/icons';`,
      usage: `<Icon icon={${i.name}} size={24} />`,
    }));

    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    return;
  }

  if (!fs.existsSync(COMPONENTS_PATH)) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: 'Data not found. The skill data/ directory is missing components.json.',
    }) + '\n');
    process.exit(1);
  }

  const components = JSON.parse(fs.readFileSync(COMPONENTS_PATH, 'utf-8'));
  const overrides = loadJsonOptional(path.join(DATA_DIR, 'component-overrides.json')) || {};
  const snIndex = loadJsonOptional(SUPERNOVA_INDEX_PATH);
  const snMap = loadJsonOptional(SUPERNOVA_MAP_PATH);
  const results = search(components, query, category);

  // Format output — include full props if --props, otherwise summary
  const output = results.map(c => {
    // Description priority: overrides > original (if not "None") > Supernova index
    let description = c.description;
    if ((!description || description === 'None') && !overrides[c.name]?.description) {
      const snDocName = snMap?.[c.name];
      const snEntry = snDocName && snIndex?.[snDocName];
      if (snEntry?.description) {
        description = snEntry.description;
      }
    }

    const base = {
      name: c.name,
      package: c.package,
      description: overrides[c.name]?.description || description,
      score: c.score,
      propCount: c.props.length,
    };
    if (c.supernovaFile) {
      base.supernovaFile = path.join(DATA_DIR, 'supernova', `${c.supernovaFile}.md`);
    }
    if (showProps) {
      base.props = c.props;
    } else {
      // Include prop names only for quick reference
      base.propNames = c.props.map(p => (p.required ? p.name : `${p.name}?`));
    }
    return base;
  });

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}

main();
