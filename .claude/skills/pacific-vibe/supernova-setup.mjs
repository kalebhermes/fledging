#!/usr/bin/env node

/**
 * supernova-setup.mjs — Verify Supernova access
 *
 * Usage: node supernova-setup.mjs
 *
 * The Pacific Supernova docs site is publicly accessible.
 * This script verifies connectivity and caches the URL map.
 */

import { chromium } from 'playwright';

const SUPERNOVA_BASE = 'https://pacific.supernova-docs.io';

async function main() {
  process.stderr.write('Checking Supernova access...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(SUPERNOVA_BASE, { waitUntil: 'networkidle', timeout: 15000 });
    const title = await page.title();
    const url = page.url();

    await context.close();
    await browser.close();

    if (title.includes('Pacific') || title.includes('Supernova')) {
      process.stderr.write(`Connected: ${title}\n`);
      process.stdout.write(JSON.stringify({
        status: 'ready',
        message: 'Supernova docs site is accessible (public, no auth required).',
        title,
        url,
      }) + '\n');
    } else {
      process.stdout.write(JSON.stringify({
        status: 'error',
        message: `Unexpected page title: "${title}". URL: ${url}`,
      }) + '\n');
    }
  } catch (err) {
    await context.close();
    await browser.close();
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: err.message,
    }) + '\n');
    process.exit(1);
  }
}

main();
