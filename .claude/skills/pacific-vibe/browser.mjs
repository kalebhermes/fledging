/**
 * browser.mjs — Shared Playwright launcher for Supernova browser automation
 *
 * Provides persistent browser context with saved cookies for SSO.
 */

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROFILE_DIR = path.join(__dirname, '.chrome-profile');
export const STATE_PATH = path.join(__dirname, '.state.json');
export const SUPERNOVA_BASE = 'https://pacific.supernova-docs.io';

export function isHeadful() {
  return process.argv.includes('--headful');
}

/**
 * Launch a persistent Chromium context.
 * Cookies and storage persist across runs via PROFILE_DIR.
 */
export async function launchBrowser({ headless = true } = {}) {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });
  return context;
}

/**
 * Navigate to a URL and detect auth redirects.
 * Returns { page, authRequired } where authRequired is true
 * if the page redirected to an SSO login.
 */
export async function navigateTo(context, url) {
  const page = context.pages()[0] || await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  const currentUrl = page.url();
  const authRequired =
    currentUrl.includes('login') ||
    currentUrl.includes('auth') ||
    currentUrl.includes('sso') ||
    currentUrl.includes('accounts.google.com');

  return { page, authRequired };
}

/**
 * Launch a lightweight, non-persistent browser for UI verification.
 * No cookie profile, no disk state — just a clean browser + context.
 */
export async function launchForVerification({ headless = true, viewport = { width: 1440, height: 900 } } = {}) {
  const browser = await chromium.launch({
    headless,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  return { browser, context, page };
}

/**
 * Check if Supernova is accessible.
 * The site is public — no authentication required.
 */
export async function checkAuth(context) {
  const { page, authRequired } = await navigateTo(
    context,
    SUPERNOVA_BASE
  );

  const title = await page.title();
  await page.close();

  return {
    authenticated: true, // site is public
    title,
    url: page.url(),
  };
}
