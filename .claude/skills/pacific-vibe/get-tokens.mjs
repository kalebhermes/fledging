#!/usr/bin/env node

/**
 * get-tokens.mjs — Retrieve Pacific design tokens by category
 *
 * Usage: node get-tokens.mjs <category> [--search=<term>]
 *
 * Categories: colors, spacing, typography, elevation, borders, breakpoints,
 *             fonts, weights, easing, colorPrimitives, all
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const TOKENS_PATH = path.join(DATA_DIR, 'tokens.json');

function parseArgs() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
  const category = args[0] || 'all';
  const searchTerm = flags.find(f => f.startsWith('--search='))?.split('=')[1]?.toLowerCase();
  return { category, searchTerm };
}

function filterTokens(tokens, searchTerm) {
  if (!searchTerm) return tokens;

  const filtered = {};
  for (const [key, value] of Object.entries(tokens)) {
    const keyMatch = key.toLowerCase().includes(searchTerm);
    const descMatch = typeof value === 'object' && value?.description?.toLowerCase().includes(searchTerm);
    if (keyMatch || descMatch) {
      filtered[key] = value;
    }
  }
  return filtered;
}

function main() {
  const { category, searchTerm } = parseArgs();

  if (!fs.existsSync(TOKENS_PATH)) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: 'Data not found. The skill data/ directory is missing tokens.json.',
    }) + '\n');
    process.exit(1);
  }

  const allTokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'));

  let result;

  if (category === 'all') {
    if (searchTerm) {
      // Search across all categories
      result = {};
      for (const [cat, tokens] of Object.entries(allTokens)) {
        const filtered = typeof tokens === 'object' ? filterTokens(tokens, searchTerm) : {};
        if (Object.keys(filtered).length > 0) {
          result[cat] = filtered;
        }
      }
    } else {
      // Return category summary (not full data — too large)
      result = {};
      for (const [cat, tokens] of Object.entries(allTokens)) {
        if (typeof tokens === 'object' && tokens !== null) {
          result[cat] = {
            count: Object.keys(tokens).length,
            keys: Object.keys(tokens).slice(0, 10),
            truncated: Object.keys(tokens).length > 10,
          };
        }
      }
    }
  } else {
    const tokens = allTokens[category];
    if (!tokens) {
      process.stdout.write(JSON.stringify({
        status: 'error',
        message: `Unknown category "${category}". Available: ${Object.keys(allTokens).join(', ')}`,
      }) + '\n');
      process.exit(1);
    }
    result = searchTerm ? filterTokens(tokens, searchTerm) : tokens;
  }

  process.stdout.write(JSON.stringify({
    status: 'ok',
    category,
    searchTerm: searchTerm || null,
    data: result,
  }, null, 2) + '\n');
}

main();
