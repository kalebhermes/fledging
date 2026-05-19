#!/usr/bin/env node

/**
 * verify-ui.mjs — UI verification tool for Pacific design system compliance.
 *
 * Takes screenshots, captures browser console output, and audits the DOM
 * for Pacific design system violations. Outputs structured JSON to stdout.
 *
 * Usage:
 *   node verify-ui.mjs <command> [options]
 *
 * Commands:
 *   all          screenshot + console + audit (default)
 *   screenshot   Take a screenshot only
 *   console      Capture console output only
 *   audit        Run DOM compliance audit only
 *
 * Options:
 *   --url=<url>         Dev server URL (default: http://localhost:5173)
 *   --output=<dir>      Directory for screenshot files (default: cwd)
 *   --selector=<css>    Scope screenshot/audit to a subtree
 *   --viewport=<WxH>    Viewport size (default: 1440x900)
 *   --full-page         Full-page screenshot instead of viewport-only
 *   --wait=<ms>         Extra wait after load for rendering (default: 1000)
 *   --headful           Show browser window for debugging
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchForVerification } from './browser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    command: 'all',
    url: 'http://localhost:5173',
    output: process.cwd(),
    selector: null,
    viewport: { width: 1440, height: 900 },
    fullPage: false,
    wait: 1000,
    headful: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      const value = rest.join('=') || 'true';
      switch (key) {
        case 'url':
          opts.url = value;
          break;
        case 'output':
          opts.output = path.resolve(value);
          break;
        case 'selector':
          opts.selector = value;
          break;
        case 'viewport': {
          const [w, h] = value.split('x').map(Number);
          if (w && h) opts.viewport = { width: w, height: h };
          break;
        }
        case 'full-page':
          opts.fullPage = true;
          break;
        case 'wait':
          opts.wait = parseInt(value, 10) || 1000;
          break;
        case 'headful':
          opts.headful = true;
          break;
      }
    } else if (!arg.startsWith('-')) {
      // Positional: command
      if (['all', 'screenshot', 'console', 'audit'].includes(arg)) {
        opts.command = arg;
      }
    }
  }

  return opts;
}

// ---------------------------------------------------------------------------
// Console capture
// ---------------------------------------------------------------------------

function attachConsoleListeners(page) {
  const messages = [];

  page.on('console', (msg) => {
    const location = msg.location();
    messages.push({
      type: msg.type(),  // log, warn, error, debug, info
      text: msg.text(),
      location: location.url
        ? { url: location.url, line: location.lineNumber }
        : undefined,
    });
  });

  page.on('pageerror', (error) => {
    messages.push({
      type: 'exception',
      text: error.message,
      stack: error.stack || undefined,
    });
  });

  page.on('requestfailed', (request) => {
    const failure = request.failure();
    messages.push({
      type: 'network-error',
      text: `${request.method()} ${request.url()} — ${failure ? failure.errorText : 'unknown'}`,
    });
  });

  return messages;
}

function summarizeConsole(messages) {
  const summary = { log: 0, warn: 0, error: 0, exception: 0, 'network-error': 0 };
  for (const msg of messages) {
    const key = msg.type === 'warning' ? 'warn' : msg.type;
    if (key in summary) {
      summary[key]++;
    } else {
      // info, debug → count as log
      summary.log++;
    }
  }
  return summary;
}

// ---------------------------------------------------------------------------
// Screenshot
// ---------------------------------------------------------------------------

async function takeScreenshot(page, opts) {
  const timestamp = Date.now();
  const filename = `screenshot-${timestamp}.png`;
  const filepath = path.join(opts.output, filename);

  if (opts.selector) {
    const locator = page.locator(opts.selector);
    await locator.screenshot({ path: filepath });
  } else {
    await page.screenshot({ path: filepath, fullPage: opts.fullPage });
  }

  return {
    path: filepath,
    viewport: opts.viewport,
  };
}

// ---------------------------------------------------------------------------
// DOM Audit
// ---------------------------------------------------------------------------

function buildAuditScript(selector) {
  // This runs inside the browser via page.evaluate().
  // Must be self-contained — no closures over Node variables.
  return `
    (() => {
      const MAX_PER_RULE = 10;
      const findings = [];
      const root = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : 'document.body'};
      if (!root) return { pass: true, findings: [], summary: { errors: 0, warnings: 0, info: 0 } };

      function selectorFor(el) {
        if (el.id) return '#' + el.id;
        let path = el.tagName.toLowerCase();
        if (el.parentElement) {
          const siblings = Array.from(el.parentElement.children).filter(
            c => c.tagName === el.tagName
          );
          if (siblings.length > 1) {
            const idx = siblings.indexOf(el) + 1;
            path += ':nth-of-type(' + idx + ')';
          }
          const parentSel = selectorFor(el.parentElement);
          if (parentSel) path = parentSel + ' > ' + path;
        }
        return path;
      }

      function snippet(el) {
        const outer = el.outerHTML;
        // Show opening tag only, truncated
        const close = outer.indexOf('>');
        const tag = outer.slice(0, close + 1);
        return tag.length > 120 ? tag.slice(0, 117) + '...' : tag;
      }

      function addFinding(rule, severity, el, message) {
        const count = findings.filter(f => f.rule === rule).length;
        if (count >= MAX_PER_RULE) return;
        findings.push({
          rule,
          severity,
          selector: selectorFor(el),
          element: snippet(el),
          message,
        });
      }

      // ---- Rule: no-inline-styles ----
      const allEls = root.querySelectorAll('*');
      for (const el of allEls) {
        const styleAttr = el.getAttribute('style');
        if (!styleAttr) continue;
        // Whitelist StyleX dynamic CSS custom property injections
        const props = styleAttr.split(';').map(s => s.trim()).filter(Boolean);
        const nonStyleX = props.filter(p => !p.match(/^--[a-zA-Z0-9]+:/));
        if (nonStyleX.length > 0) {
          addFinding(
            'no-inline-styles', 'error', el,
            'Inline style attribute. Use stylex.props() instead.'
          );
        }
      }

      // ---- Rule: no-hardcoded-colors ----
      const colorProps = [
        'color', 'background-color', 'border-color',
        'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
        'outline-color', 'fill', 'stroke',
      ];
      const colorPattern = /^(#[0-9a-f]{3,8}|rgba?\\(|hsla?\\()/i;
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;
          for (const rule of rules) {
            if (!rule.style) continue;
            for (const prop of colorProps) {
              const val = rule.style.getPropertyValue(prop);
              if (val && colorPattern.test(val.trim())) {
                // Find a matching element if possible
                try {
                  const match = root.querySelector(rule.selectorText);
                  if (match) {
                    addFinding(
                      'no-hardcoded-colors', 'error', match,
                      'Hardcoded color "' + val.trim() + '" in ' + prop + '. Use a var(--...) token instead.'
                    );
                  }
                } catch { /* invalid selector */ }
              }
            }
          }
        } catch { /* cross-origin stylesheet */ }
      }

      // ---- Rule: heading-hierarchy ----
      const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let prevLevel = 0;
      for (const h of headings) {
        const level = parseInt(h.tagName[1], 10);
        if (prevLevel > 0 && level > prevLevel + 1) {
          addFinding(
            'heading-hierarchy', 'warning', h,
            'Heading level skipped: h' + prevLevel + ' → h' + level + '. Expected h' + (prevLevel + 1) + ' or same/higher level.'
          );
        }
        prevLevel = level;
      }

      // ---- Rule: img-alt-text ----
      const images = root.querySelectorAll('img');
      for (const img of images) {
        if (!img.hasAttribute('alt')) {
          addFinding(
            'img-alt-text', 'error', img,
            'Image missing alt attribute. Add alt="" for decorative or descriptive text for meaningful images.'
          );
        }
      }

      // ---- Rule: empty-interactive-elements ----
      const interactives = root.querySelectorAll('button, a, [role="button"], [role="link"]');
      for (const el of interactives) {
        const text = (el.textContent || '').trim();
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const title = el.getAttribute('title');
        if (!text && !ariaLabel && !ariaLabelledBy && !title) {
          // Check for img/svg with alt inside
          const innerImg = el.querySelector('img[alt], svg[aria-label]');
          if (!innerImg) {
            addFinding(
              'empty-interactive-elements', 'error', el,
              'Interactive element has no accessible text. Add text content, aria-label, or aria-labelledby.'
            );
          }
        }
      }

      // ---- Rule: stylex-css-loaded ----
      const stylexLink = document.querySelector('link[href*="stylex"], script[src*="stylex"]');
      const stylexVirtual = document.querySelector('link[href*="virtual:stylex"], style[data-vite-dev-id*="stylex"]');
      if (!stylexLink && !stylexVirtual) {
        // Check for any stylesheet containing stylex-generated classes
        let found = false;
        for (const sheet of document.styleSheets) {
          try {
            if (sheet.href && sheet.href.includes('stylex')) { found = true; break; }
            const rules = sheet.cssRules || sheet.rules;
            if (rules && rules.length > 100) { found = true; break; } // heuristic: large sheet likely StyleX
          } catch { /* cross-origin */ }
        }
        if (!found) {
          addFinding(
            'stylex-css-loaded', 'error', document.documentElement,
            'No StyleX CSS detected. Ensure virtual:stylex.css is loaded in the document.'
          );
        }
      }

      // ---- Rule: pacific-coverage ----
      // StyleX generates class names that are short hashes (e.g., "x1abc23")
      const stylexClassPattern = /^x[a-z0-9]{4,}/;
      let withStyleX = 0;
      let withoutStyleX = 0;
      let withCustomClasses = 0;
      for (const el of allEls) {
        const classes = Array.from(el.classList);
        if (classes.length === 0) {
          withoutStyleX++;
          continue;
        }
        const hasStyleXClass = classes.some(c => stylexClassPattern.test(c));
        if (hasStyleXClass) {
          withStyleX++;
        } else {
          withCustomClasses++;
        }
      }
      findings.push({
        rule: 'pacific-coverage',
        severity: 'info',
        selector: ':root',
        element: '<body>',
        message: 'StyleX coverage: ' + withStyleX + ' elements with StyleX classes, ' +
          withCustomClasses + ' with non-StyleX classes, ' +
          withoutStyleX + ' with no classes.',
      });

      // Summary
      const summary = { errors: 0, warnings: 0, info: 0 };
      for (const f of findings) {
        if (f.severity === 'error') summary.errors++;
        else if (f.severity === 'warning') summary.warnings++;
        else summary.info++;
      }

      return {
        pass: summary.errors === 0 && summary.warnings === 0,
        findings,
        summary,
      };
    })()
  `;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv);
  const runScreenshot = opts.command === 'all' || opts.command === 'screenshot';
  const runConsole = opts.command === 'all' || opts.command === 'console';
  const runAudit = opts.command === 'all' || opts.command === 'audit';

  let browser, page;

  try {
    const launched = await launchForVerification({
      headless: !opts.headful,
      viewport: opts.viewport,
    });
    browser = launched.browser;
    page = launched.page;
  } catch (err) {
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: `Failed to launch browser: ${err.message}`,
    }, null, 2) + '\n');
    process.exit(1);
  }

  // Attach console listeners before navigation so module-load errors are caught
  const consoleMessages = runConsole ? attachConsoleListeners(page) : [];

  try {
    process.stderr.write(`Navigating to ${opts.url}...\n`);
    await page.goto(opts.url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
  } catch (err) {
    await browser.close();
    const isTimeout = err.message.includes('Timeout') || err.message.includes('timeout');
    const isRefused = err.message.includes('ECONNREFUSED') || err.message.includes('ERR_CONNECTION_REFUSED');
    let hint = '';
    if (isRefused) {
      hint = ' Is the dev server running? Try: npm run dev';
    } else if (isTimeout) {
      hint = ' The page took too long to load.';
    }
    process.stdout.write(JSON.stringify({
      status: 'error',
      message: `Navigation failed: ${err.message}.${hint}`,
    }, null, 2) + '\n');
    process.exit(1);
  }

  // Wait for rendering (React hydration, StyleX CSS application)
  if (opts.wait > 0) {
    process.stderr.write(`Waiting ${opts.wait}ms for rendering...\n`);
    await page.waitForTimeout(opts.wait);
  }

  const result = {
    status: 'ok',
    url: opts.url,
    timestamp: new Date().toISOString(),
  };

  // Screenshot
  if (runScreenshot) {
    try {
      result.screenshot = await takeScreenshot(page, opts);
      process.stderr.write(`Screenshot saved: ${result.screenshot.path}\n`);
    } catch (err) {
      result.screenshot = { error: err.message };
    }
  }

  // Console
  if (runConsole) {
    result.console = {
      messages: consoleMessages,
      summary: summarizeConsole(consoleMessages),
    };
  }

  // Audit
  if (runAudit) {
    try {
      const auditResult = await page.evaluate(buildAuditScript(opts.selector));
      result.audit = auditResult;
    } catch (err) {
      result.audit = { error: err.message };
    }
  }

  await browser.close();

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main();
