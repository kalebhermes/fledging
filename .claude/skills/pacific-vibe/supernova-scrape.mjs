#!/usr/bin/env node

/**
 * supernova-scrape.mjs — Scrape component guidelines from Supernova
 *
 * BUILD-TIME SCRIPT — run by skill maintainers to regenerate data/supernova/.
 *
 * Usage: node supernova-scrape.mjs [component-name|all] [--headful]
 *
 * Navigates to the Pacific Supernova docs site, discovers component pages,
 * extracts design guidelines, accessibility, content, and usage.
 * Writes per-component markdown to data/supernova/ in the skill directory.
 *
 * The site is public — no authentication required.
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const SUPERNOVA_CACHE = path.join(DATA_DIR, 'supernova');
const URL_MAP_PATH = path.join(DATA_DIR, 'supernova-urls.json');
const SUPERNOVA_BASE = 'https://pacific.supernova-docs.io';
const COMPONENTS_INDEX = `${SUPERNOVA_BASE}/latest/components/overview/all-components-VJOacPtm`;

function isHeadful() {
  return process.argv.includes('--headful');
}

/**
 * Discover all component overview URLs from the Components navigation.
 * Returns a map of { componentName: overviewUrl }
 */
async function discoverComponentUrls(page) {
  await page.goto(COMPONENTS_INDEX, { waitUntil: 'networkidle', timeout: 30000 });

  const links = await page.evaluate(() => {
    const anchors = document.querySelectorAll('a[href*="/components/"]');
    const seen = new Map();
    for (const a of anchors) {
      const text = a.textContent?.trim();
      const href = a.href;
      if (
        text &&
        href.includes('/overview-') &&
        !href.includes('/overview/') && // skip "all components" and "implementation status"
        !seen.has(href)
      ) {
        seen.set(href, text);
      }
    }
    return [...seen.entries()].map(([href, text]) => ({ name: text, url: href }));
  });

  // Deduplicate by URL
  const urlMap = {};
  for (const { name, url } of links) {
    const cleanName = name.replace(/\s+/g, ' ').trim();
    if (cleanName && !urlMap[cleanName]) {
      urlMap[cleanName] = url;
    }
  }

  // Cache the URL map
  fs.writeFileSync(URL_MAP_PATH, JSON.stringify(urlMap, null, 2));
  return urlMap;
}

/**
 * For a given component overview URL, discover its sub-page URLs.
 * Uses property-based matching (.href) since DOM attributes use relative paths.
 */
async function discoverSubPages(page, overviewUrl) {
  // Extract the component path segment, e.g., "/latest/components/banners/"
  const basePath = overviewUrl.replace(/overview-[^/]+$/, '');

  const subLinks = await page.evaluate((base) => {
    const seen = new Map();
    for (const a of document.querySelectorAll('a')) {
      const href = a.href; // resolved absolute URL
      const text = a.textContent?.trim();
      if (text && href.includes(base) && !href.includes('#') && !seen.has(href)) {
        seen.set(href, text);
      }
    }
    return [...seen.entries()].map(([href, text]) => ({ label: text, url: href }));
  }, basePath);

  // Filter out Specifications (design specs, not useful for engineers — we have the API from sofi-web-ui)
  const filtered = subLinks.filter(l => !l.url.toLowerCase().includes('/specifications-'));

  // Order: Overview first, then others
  const order = ['overview', 'accessibility', 'content', 'usage'];
  return filtered.sort((a, b) => {
    const aIdx = order.findIndex(o => a.url.toLowerCase().includes(o));
    const bIdx = order.findIndex(o => b.url.toLowerCase().includes(o));
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
}

/**
 * Extract text content from the current page.
 * Uses the <main> element's innerText which reliably captures
 * all rendered content from the Supernova docs.
 */
async function extractPageContent(page) {
  const raw = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return document.body.innerText?.substring(0, 10000) || '';
    return main.innerText || '';
  });

  if (!raw) return '';
  return cleanSupernovaContent(raw);
}

/**
 * Post-process extracted Supernova content to remove noise.
 *
 * Each sub-page starts with a repeated header block:
 *   ComponentName
 *   Active|Draft|Deprecated
 *   Short description...
 *   Overview
 *   Specifications
 *   Accessibility
 *   [Content]
 *   Usage
 *   [actual content starts here]
 *
 * And ends with:
 *   ON THIS PAGE
 *   Nav item 1
 *   Nav item 2
 *   ...
 */
function cleanSupernovaContent(text) {
  const navLabels = new Set(['Overview', 'Specifications', 'Accessibility', 'Content', 'Usage']);
  const statusBadges = new Set(['Active', 'Draft', 'Deprecated', 'Beta', 'New', 'In Progress']);

  const lines = text.split('\n');
  const cleaned = [];
  let i = 0;
  let inOnThisPage = false;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // 1. Skip "ON THIS PAGE" and all following lines until next blank line pair
    if (trimmed === 'ON THIS PAGE') {
      inOnThisPage = true;
      i++;
      continue;
    }
    if (inOnThisPage) {
      // "ON THIS PAGE" sections end at a blank line (the nav items are short single lines)
      if (trimmed === '') {
        inOnThisPage = false;
      }
      i++;
      continue;
    }

    // 2. Skip nav label sequences (3+ consecutive nav labels)
    if (navLabels.has(trimmed) && isNavLabelSequence(lines, i, navLabels)) {
      while (i < lines.length && (navLabels.has(lines[i].trim()) || lines[i].trim() === '')) {
        i++;
      }
      continue;
    }

    // 3. Skip standalone status badges
    if (statusBadges.has(trimmed)) {
      i++;
      continue;
    }

    // Clean non-breaking space artifacts
    const cleanLine = lines[i].replace(/\u00a0/g, ' ').replace(/^ +$/, '');

    // Collapse multiple blank lines
    if (cleanLine.trim() === '' && cleaned.length > 0 && cleaned[cleaned.length - 1].trim() === '') {
      i++;
      continue;
    }

    cleaned.push(cleanLine);
    i++;
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Check if position i starts a sequence of 3+ nav labels.
 * Returns true if lines[i..i+n] are all nav labels.
 */
function isNavLabelSequence(lines, startIdx, navLabels) {
  let count = 0;
  let j = startIdx;
  while (j < lines.length) {
    const trimmed = lines[j].trim();
    if (navLabels.has(trimmed)) {
      count++;
      j++;
    } else if (trimmed === '') {
      j++; // skip blank lines within the sequence
    } else {
      break;
    }
  }
  return count >= 3;
}

/**
 * Strip the repeated component name and description from the start of section content.
 * Each sub-page starts with: ComponentName \n description \n [actual content]
 */
function stripRepeatedHeader(content, componentName, componentDesc) {
  const lines = content.split('\n');
  let startIdx = 0;

  // Skip leading blank lines
  while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;

  // Check if the first non-blank line is the component name
  if (startIdx < lines.length && lines[startIdx].trim() === componentName) {
    startIdx++;
    // Skip blank lines after component name
    while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;
  }

  // Check if the next non-blank line is the description
  if (componentDesc && startIdx < lines.length && lines[startIdx].trim() === componentDesc) {
    startIdx++;
    // Skip blank lines after description
    while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;
  }

  if (startIdx === 0) return content;
  return lines.slice(startIdx).join('\n');
}

// ---------------------------------------------------------------------------
// Post-processing: condense raw Supernova markdown into agent-friendly format
// ---------------------------------------------------------------------------

/**
 * Condense a full raw Supernova markdown document into a compact, agent-friendly
 * format. Drops noise (anatomy tables, resources, boilerplate) and keeps:
 *   - Introduction (what the component is)
 *   - Accessibility: labeling, keyboard navigation
 *   - Usage: when to use, do's/don'ts, content guidelines
 */
function condenseDoc(rawMarkdown, componentName) {
  // Split into major sections by the --- separator + ## heading
  const sections = splitMajorSections(rawMarkdown);

  const out = [`# ${componentName}\n`];

  // --- Overview / Introduction ---
  const overview = sections.find(s =>
    s.heading === componentName || s.heading === 'Overview' || s.heading.toLowerCase().includes('overview')
  );
  if (overview) {
    const intro = extractIntroduction(overview.body);
    if (intro) out.push(intro + '\n');
  }

  // --- Accessibility ---
  const a11y = sections.find(s => s.heading.toLowerCase().includes('accessibility'));
  if (a11y) {
    const condensed = condenseAccessibility(a11y.body);
    if (condensed) out.push('## Accessibility\n\n' + condensed + '\n');
  }

  // --- Content (if present) ---
  const content = sections.find(s => s.heading === 'Content');
  if (content) {
    const condensed = condenseContentSection(content.body);
    if (condensed) out.push('## Content Guidelines\n\n' + condensed + '\n');
  }

  // --- Usage ---
  const usage = sections.find(s => s.heading.toLowerCase().includes('usage'));
  if (usage) {
    const condensed = condenseUsage(usage.body);
    if (condensed) out.push('## Usage\n\n' + condensed + '\n');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/**
 * Split raw markdown into major sections (separated by --- + ## Heading).
 */
function splitMajorSections(rawMarkdown) {
  const sections = [];
  // Remove the # Title and metadata lines at the top
  const lines = rawMarkdown.split('\n');
  let startIdx = 0;
  // Skip # heading and _Source:/_Scraped: metadata
  while (startIdx < lines.length) {
    const trimmed = lines[startIdx].trim();
    if (trimmed.startsWith('# ') || trimmed.startsWith('_Source:') ||
        trimmed.startsWith('_Scraped:') || trimmed === '' || trimmed === '---') {
      startIdx++;
    } else {
      break;
    }
  }

  // Now find ## headings
  let currentHeading = null;
  let currentBody = [];

  for (let i = startIdx; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('## ')) {
      if (currentHeading !== null) {
        sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
      }
      currentHeading = trimmed.slice(3).trim();
      currentBody = [];
    } else if (trimmed === '---') {
      // section separator, skip
    } else {
      currentBody.push(lines[i]);
    }
  }
  if (currentHeading !== null) {
    sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
  }

  return sections;
}

/**
 * Extract the introduction paragraph(s) from the overview section.
 * Stops at "Anatomy" or "Resources" sub-heading.
 */
function extractIntroduction(body) {
  const lines = body.split('\n');
  const result = [];
  let foundIntro = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Stop at known sub-sections we want to drop
    if (/^(Anatomy|Resources|Type|#)$/i.test(trimmed)) break;

    // Skip the "Introduction" label itself
    if (trimmed.toLowerCase() === 'introduction') {
      foundIntro = true;
      continue;
    }

    if (trimmed === '' && result.length === 0) continue; // skip leading blanks
    result.push(line);
  }

  return result.join('\n').trim();
}

/**
 * Condense the Accessibility section: keep labeling notes and keyboard nav,
 * drop boilerplate text scaling and generic WCAG references.
 */
function condenseAccessibility(body) {
  const subSections = splitSubSections(body);
  const parts = [];

  // Labeling — keep only if it has real content beyond boilerplate.
  // When there are no sub-sections, the labeling content is mixed into the raw
  // body. In that case, extract everything up to the first key-action pattern.
  const labeling = subSections.find(s => s.heading.toLowerCase().includes('label'));
  if (labeling) {
    const text = labeling.body.trim();
    const boilerplate = /^elements should be labeled.*wcag guidelines\.?$/i;
    const lines = text.split('\n').filter(l => !boilerplate.test(l.trim()) && l.trim() !== '');
    if (lines.length > 0) {
      parts.push(lines.join('\n'));
    }
  } else if (subSections.length === 0) {
    // No sub-sections detected — extract labeling text from raw body
    // (everything before "Keys", "Key", "Focus Order", or keyboard patterns)
    const lines = body.split('\n');
    const labelLines = [];
    const boilerplate = /^elements should be labeled.*wcag guidelines\.?$/i;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(keys?|action|focus order|keyboard|text scal|minimum|default|maximum)$/i.test(trimmed)) break;
      if (boilerplate.test(trimmed)) continue;
      if (trimmed !== '') labelLines.push(line);
    }
    if (labelLines.length > 0) {
      parts.push(labelLines.join('\n'));
    }
  }

  // Disabled state (some components have this — match only short headings)
  const disabled = subSections.find(s =>
    s.heading.toLowerCase().includes('disabled') && s.heading.length < 30
  );
  if (disabled) {
    const text = disabled.body.trim();
    if (text.length > 10) parts.push(text);
  }

  // Focus Order — keep specific guidance, skip generic boilerplate
  const focus = subSections.find(s => s.heading.toLowerCase().includes('focus'));
  if (focus) {
    const lines = focus.body.split('\n').filter(l => {
      const t = l.trim();
      // Skip generic boilerplate
      if (/^(follow this focus order|a logical and predictable)/i.test(t)) return false;
      if (t === '') return false;
      return true;
    });
    if (lines.length > 0) {
      parts.push(lines.join('\n'));
    }
  }

  // Keyboard Navigation — reformat to bullet list.
  // Try dedicated sub-section first, then fall back to scanning the full body.
  const kbdSections = subSections.filter(s => s.heading.toLowerCase().includes('keyboard'));
  let kbdPairs = [];
  for (const kbd of kbdSections) {
    kbdPairs = extractKeyActionPairs(kbd.body);
    if (kbdPairs.length > 0) break;
  }
  // Fall back to full body if no sub-section had pairs
  if (kbdPairs.length === 0) {
    kbdPairs = extractKeyActionPairs(body);
  }
  if (kbdPairs.length > 0) {
    parts.push('Keyboard:\n' + kbdPairs.map(({ key, action }) => `- ${key}: ${action}`).join('\n'));
  }

  return parts.join('\n\n');
}

/**
 * Extract Key→Action pairs from keyboard navigation text.
 * The raw format is alternating lines: Key\n\nAction\nvalue\n...
 */
function extractKeyActionPairs(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
  const pairs = [];

  // Skip header lines like "Keys", "Action", "Ensure all elements are navigable..."
  const skipPatterns = /^(keys?|actions?|ensure|keyboard navigation)/i;

  let i = 0;
  while (i < lines.length) {
    if (skipPatterns.test(lines[i])) {
      i++;
      continue;
    }

    // Look for known key names
    const keyMatch = lines[i].match(/^(Tab|Space|Enter|Esc|Space or Enter|Shift\s?\+\s?Tab|Arrow\s?(up|down|left|right)|Home|End)/i);
    if (keyMatch && i + 1 < lines.length) {
      const key = lines[i];
      const action = lines[i + 1];
      if (!skipPatterns.test(action)) {
        pairs.push({ key, action });
        i += 2;
        continue;
      }
    }
    i++;
  }

  return pairs;
}

/**
 * Condense the Content section — keep guidelines, drop boilerplate headers.
 */
function condenseContentSection(body) {
  // Just clean up and return — Content sections tend to be mostly useful
  const lines = body.split('\n');
  const result = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip "Summary checklist" headers (just a repeat of prior content)
    if (/^summary checklist$/i.test(trimmed)) break;
    result.push(line);
  }

  return result.join('\n').trim();
}

/**
 * Condense the Usage section: keep when-to-use, do's/don'ts as bullet lists,
 * content guidelines.
 */
function condenseUsage(body) {
  const subSections = splitSubSections(body);
  const parts = [];

  // Free-form intro text (before any sub-heading)
  const preamble = extractPreamble(body);
  if (preamble) parts.push(preamble);

  // When to Use
  const whenUse = subSections.find(s =>
    /^when to use$/i.test(s.heading) || /^where to use$/i.test(s.heading)
  );
  if (whenUse) {
    parts.push('**When to use:** ' + whenUse.body.trim());
  }

  // When to Use Something Else / When to not use
  const whenNot = subSections.find(s =>
    /when to use something else/i.test(s.heading) ||
    /when to use.*(instead|bottom sheet)/i.test(s.heading) ||
    /where to not use/i.test(s.heading) ||
    /when not to use/i.test(s.heading)
  );
  if (whenNot) {
    parts.push('**Don\'t use when:** ' + whenNot.body.trim());
  }

  // General Principles (if any)
  const principles = subSections.find(s => /general principles/i.test(s.heading));
  if (principles) {
    parts.push(principles.body.trim());
  }

  // Do's and Don'ts — reformat to compact bullet lists.
  // Try the dedicated section first, then scan the full body for scattered pairs.
  const dosDonts = subSections.find(s =>
    /do.?s and don.?ts/i.test(s.heading) || /best practices/i.test(s.heading)
  );
  if (dosDonts) {
    const formatted = formatDosDonts(dosDonts.body);
    if (formatted) parts.push(formatted);
  } else {
    // Some components scatter Do/Don't pairs throughout sub-sections (e.g. Cards)
    const formatted = formatDosDonts(body);
    if (formatted) parts.push(formatted);
  }

  // Content Guidelines
  const contentGuidelines = subSections.find(s =>
    /content guidelines?/i.test(s.heading)
  );
  if (contentGuidelines) {
    parts.push('**Content:** ' + contentGuidelines.body.trim());
  }

  return parts.join('\n\n');
}

/**
 * Extract preamble text before the first sub-heading in a section.
 * Stops at recognized sub-headings and filters out noise sections
 * (Figma discoverability, button groups, priority/type prose, etc.)
 */
function extractPreamble(body) {
  const lines = body.split('\n');
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Stop at any recognized sub-heading
    if (/^(when to|where to|do.?s and|best practices|general principles|content guidelines?|discoverability|button groups|priority|intro to usage|common layouts|hot zone|carousel|banners and labels|grids|lists|degraded|global cards|breakpoint|mode)/i.test(trimmed)) break;
    if (trimmed !== '') result.push(line);
  }
  return result.join('\n').trim();
}

/**
 * Format Do/Don't alternating pairs into compact bullet lists.
 */
function formatDosDonts(body) {
  const lines = body.split('\n').map(l => l.trim()).filter(l => l !== '');
  const dos = [];
  const donts = [];

  let mode = null; // 'do' or 'dont'

  for (const line of lines) {
    if (/^do$/i.test(line)) {
      mode = 'do';
      continue;
    }
    if (/^don.?t$/i.test(line)) {
      mode = 'dont';
      continue;
    }

    if (mode === 'do') {
      dos.push(line);
      mode = null; // reset — each Do/Don't has one line
    } else if (mode === 'dont') {
      donts.push(line);
      mode = null;
    }
  }

  const parts = [];
  if (dos.length > 0) {
    parts.push('**Do:**\n' + dos.map(d => `- ${d}`).join('\n'));
  }
  if (donts.length > 0) {
    parts.push('**Don\'t:**\n' + donts.map(d => `- ${d}`).join('\n'));
  }

  return parts.join('\n\n');
}

/**
 * Split section body into sub-sections by detecting heading-like lines.
 * A heading-like line is a short line (< 60 chars) that appears alone,
 * followed by content, and matches common Supernova heading patterns.
 */
function splitSubSections(body) {
  const headingPatterns = /^(introduction|anatomy|resources|labeling|disabled state|focus order|keyboard navigation|text scal|minimum scal|default scal|maximum scal|when to use|where to use|when to use something else|when to use.*(instead|bottom)|where to not use|when not to use|general principles|do.?s and don.?ts|best practices|content guidelines?|types?$|sizes?$|discoverability|button groups|priority|intro to usage|common layouts|hot zone|carousel|banners and labels|grids$|lists$|degraded|global cards)/i;

  const lines = body.split('\n');
  const sections = [];
  let currentHeading = null;
  let currentBody = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (trimmed.length > 0 && trimmed.length < 60 && headingPatterns.test(trimmed)) {
      if (currentHeading !== null) {
        sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
      }
      currentHeading = trimmed;
      currentBody = [];
    } else if (currentHeading !== null) {
      currentBody.push(lines[i]);
    }
  }

  if (currentHeading !== null) {
    sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Search index generation — produces data/supernova-index.json from .md files
// ---------------------------------------------------------------------------

const SUPERNOVA_INDEX_PATH = path.join(DATA_DIR, 'supernova-index.json');

/**
 * Static synonym map: common conceptual terms → component name fragments.
 * Keyed by Supernova doc name, values are arrays of search keywords.
 */
const SYNONYM_MAP = {
  'Accordion':           ['collapsible', 'expandable', 'disclosure', 'panel', 'section', 'fold'],
  'Dialog':              ['modal', 'popup', 'overlay', 'confirm', 'alert dialog'],
  'Banners':             ['alert', 'notification', 'message', 'info', 'warning', 'caution', 'feedback'],
  'Toast':               ['snackbar', 'notification', 'flash', 'feedback', 'confirm'],
  'Buttons v2':          ['action', 'cta', 'submit', 'click', 'press'],
  'Button groups v2':    ['action', 'cta', 'submit', 'click', 'press'],
  'Toggle':              ['switch', 'on off', 'binary', 'setting'],
  'Loaders':             ['loading', 'spinner', 'skeleton', 'progress', 'wait'],
  'Bottom sheet':        ['drawer', 'panel', 'slide up', 'tray'],
  'Action sheet':        ['menu', 'options', 'actions', 'contextual'],
  'Tabs':                ['tab bar', 'navigation', 'tabbed', 'pane'],
  'Tooltip':             ['hint', 'popover', 'info bubble', 'help'],
  'Card container':      ['card', 'tile', 'surface', 'container'],
  'Steppers':            ['stepper', 'wizard', 'progress', 'multi step', 'flow'],
  'Progress meters':     ['progress bar', 'meter', 'completion', 'percentage'],
  'Text inputs':         ['text field', 'input', 'form field', 'text box'],
  'Dropdown inputs':     ['select', 'dropdown', 'picker', 'combobox', 'menu'],
  'Checkbox':            ['check', 'tick', 'multi select', 'boolean'],
  'Radio':               ['radio button', 'option', 'single select', 'choice'],
  'Selector tile':       ['selection', 'choice', 'option tile', 'picker'],
  'Search input':        ['search', 'find', 'filter', 'lookup'],
  'Rows':                ['list item', 'row', 'cell', 'list'],
  'Pagination':          ['paging', 'page', 'next previous', 'navigation'],
  'Date picker':         ['calendar', 'date', 'date select'],
  'Sliders':             ['range', 'slider', 'adjust', 'value picker'],
  'File uploader':       ['upload', 'file', 'attachment', 'browse'],
  'Segmented control':   ['segment', 'toggle group', 'button group', 'switcher'],
  'Table':               ['data table', 'grid', 'spreadsheet', 'data grid'],
  'Filter pill':         ['filter', 'tag', 'chip', 'facet'],
  'Control pill':        ['chip', 'tag', 'badge', 'label'],
  'Status pill':         ['status', 'badge', 'indicator', 'state'],
  'Marquee':             ['hero', 'banner', 'highlight', 'feature'],
};

/**
 * Extract first non-heading paragraph from condensed .md as a one-sentence description.
 */
function extractSearchDescription(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip headings, blank lines, metadata
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('_') || trimmed.startsWith('---')) continue;
    // Skip very short lines (likely sub-labels)
    if (trimmed.length < 20) continue;
    // Take first sentence
    const sentenceEnd = trimmed.search(/\.\s|\.$/);
    if (sentenceEnd > 0) {
      return trimmed.substring(0, sentenceEnd + 1);
    }
    // If no period, take the whole line (capped)
    return trimmed.length > 200 ? trimmed.substring(0, 200) + '...' : trimmed;
  }
  return null;
}

/**
 * Extract keywords from .md content + static synonyms.
 * Sources: SYNONYM_MAP + "When to use" section terms.
 * Cap at 15 keywords per component.
 */
function extractKeywords(content, componentName) {
  const keywords = new Set();

  // 1. Static synonyms
  const synonyms = SYNONYM_MAP[componentName];
  if (synonyms) {
    for (const s of synonyms) keywords.add(s.toLowerCase());
  }

  // 2. Extract key terms from "When to use" sections
  const whenToUseMatch = content.match(/\*\*When to use:\*\*\s*([^*]+)/);
  if (whenToUseMatch) {
    const text = whenToUseMatch[1].toLowerCase();
    // Pull out meaningful nouns/phrases (4+ chars, not stop words)
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'that', 'this', 'with', 'from', 'they', 'will',
      'can', 'has', 'have', 'use', 'used', 'uses', 'using', 'such', 'when', 'each',
      'which', 'their', 'been', 'also', 'its', 'not', 'but', 'into', 'all', 'more',
      'than', 'does', 'should', 'would', 'could', 'being', 'about', 'over', 'only',
      'other', 'where', 'need', 'needs', 'like', 'most', 'some', 'them', 'then',
      'these', 'those', 'through', 'while', 'between', 'offer', 'offers', 'offered',
      'provide', 'provides', 'allow', 'allows', 'make', 'makes', 'making', 'keep',
      'keeping', 'must', 'want', 'wants', 'well', 'best', 'good', 'typically',
      'especially', 'effectively', 'effective', 'large', 'small', 'primarily',
      'initially', 'always', 'often', 'usually', 'user', 'users', 'include',
      'includes', 'display', 'displays', 'present', 'presenting', 'within',
      'without', 'before', 'after', 'frequently', 'quickly', 'specific',
      'related', 'multiple', 'single', 'different', 'current', 'three', 'five',
      'any', 'may', 'you', 'your', 'amount', 'amounts', 'many',
    ]);
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    for (const w of words) {
      if (!stopWords.has(w)) keywords.add(w);
    }
  }

  // 3. Extract from "Don't use when" sections too
  const dontUseMatch = content.match(/\*\*Don't use when:\*\*\s*([^*]+)/);
  if (dontUseMatch) {
    const text = dontUseMatch[1].toLowerCase();
    // Look for component-like nouns that indicate alternatives
    const altMatches = text.match(/\b(banner|dialog|toast|checkbox|radio|button|overlay|modal|sheet)\w*/gi) || [];
    // These are alternatives, not keywords for this component — skip them
  }

  // Cap at 15
  const result = [...keywords].slice(0, 15);
  return result;
}

/**
 * Build the search index from existing data/supernova/*.md files.
 * Writes data/supernova-index.json keyed by Supernova doc name.
 */
function buildSearchIndex() {
  if (!fs.existsSync(SUPERNOVA_CACHE)) {
    process.stderr.write('No supernova/ directory found — skipping index build.\n');
    return;
  }

  const files = fs.readdirSync(SUPERNOVA_CACHE).filter(f => f.endsWith('.md'));
  const index = {};

  for (const file of files) {
    const componentName = file.replace(/\.md$/, '');
    const content = fs.readFileSync(path.join(SUPERNOVA_CACHE, file), 'utf-8');
    const description = extractSearchDescription(content);
    const keywords = extractKeywords(content, componentName);

    if (description || keywords.length > 0) {
      index[componentName] = {};
      if (description) index[componentName].description = description;
      if (keywords.length > 0) index[componentName].keywords = keywords;
    }
  }

  fs.writeFileSync(SUPERNOVA_INDEX_PATH, JSON.stringify(index, null, 2));
  const count = Object.keys(index).length;
  process.stderr.write(`Built search index: ${count} entries → ${SUPERNOVA_INDEX_PATH}\n`);
  return index;
}

// ---------------------------------------------------------------------------
// Scraping
// ---------------------------------------------------------------------------

/**
 * Scrape all sub-pages for a single component.
 */
async function scrapeComponent(page, componentName, overviewUrl) {
  process.stderr.write(`  Scraping ${componentName}...\n`);

  const allContent = [`# ${componentName}\n\n_Source: ${overviewUrl}_\n_Scraped: ${new Date().toISOString()}_\n`];

  try {
    // Navigate to overview first
    await page.goto(overviewUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Discover sub-pages from the navigation
    const subPages = await discoverSubPages(page, overviewUrl);

    // Get the component description (subtitle) from the overview page for dedup
    const componentDesc = await page.evaluate(() => {
      // The description is typically the second text block on the page
      const main = document.querySelector('main');
      if (!main) return '';
      const ps = main.querySelectorAll('p');
      // First short paragraph that isn't a nav label
      for (const p of ps) {
        const text = p.textContent?.trim();
        if (text && text.length > 15 && text.length < 200) return text;
      }
      return '';
    });

    if (subPages.length === 0) {
      // No sub-pages found — extract overview content directly
      const content = await extractPageContent(page);
      if (content && content.length > 50) {
        allContent.push(`\n## Overview\n\n${stripRepeatedHeader(content, componentName, componentDesc)}`);
      }
    } else {
      // Extract each sub-page
      for (const { label, url } of subPages) {
        if (url !== page.url()) {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(1000);
        }

        let sectionContent = await extractPageContent(page);
        if (sectionContent && sectionContent.length > 50) {
          sectionContent = stripRepeatedHeader(sectionContent, componentName, componentDesc);
          allContent.push(`\n---\n\n## ${label}\n\n${sectionContent}`);
        }
      }
    }

    // Condense the raw scrape into agent-friendly format
    const rawMarkdown = allContent.join('\n');
    const condensed = condenseDoc(rawMarkdown, componentName);

    // Write condensed markdown
    const mdPath = path.join(SUPERNOVA_CACHE, `${componentName.replace(/[^a-zA-Z0-9-_ ]/g, '')}.md`);
    fs.writeFileSync(mdPath, condensed);

    return {
      status: 'ok',
      component: componentName,
      url: overviewUrl,
      subPages: subPages.length,
      file: mdPath,
      rawLength: rawMarkdown.length,
      condensedLength: condensed.length,
      reduction: `${Math.round((1 - condensed.length / rawMarkdown.length) * 100)}%`,
    };
  } catch (err) {
    return {
      status: 'error',
      component: componentName,
      url: overviewUrl,
      message: err.message,
    };
  }
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const target = args[0] || 'all';

  // build-index: regenerate supernova-index.json from existing .md files (no browser needed)
  if (target === 'build-index') {
    buildSearchIndex();
    return;
  }

  const headless = !isHeadful();

  fs.mkdirSync(SUPERNOVA_CACHE, { recursive: true });

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Discover component URLs
    process.stderr.write('Discovering component URLs...\n');
    const urlMap = await discoverComponentUrls(page);
    const componentCount = Object.keys(urlMap).length;
    process.stderr.write(`Found ${componentCount} components on Supernova.\n`);

    let targets;
    if (target === 'all') {
      targets = Object.entries(urlMap);
    } else {
      // Find matching component (case-insensitive)
      const match = Object.entries(urlMap).find(
        ([name]) => name.toLowerCase() === target.toLowerCase()
      );
      if (!match) {
        // Try fuzzy match
        const fuzzy = Object.entries(urlMap).filter(
          ([name]) => name.toLowerCase().includes(target.toLowerCase())
        );
        if (fuzzy.length === 0) {
          process.stdout.write(JSON.stringify({
            status: 'not_found',
            message: `Component "${target}" not found. Available: ${Object.keys(urlMap).join(', ')}`,
          }) + '\n');
          await context.close();
          await browser.close();
          return;
        }
        targets = fuzzy;
      } else {
        targets = [match];
      }
    }

    process.stderr.write(`Scraping ${targets.length} component(s)...\n`);

    const results = [];
    for (const [name, url] of targets) {
      const result = await scrapeComponent(page, name, url);
      results.push(result);
      if (result.status === 'ok') {
        process.stderr.write(`  ✓ ${name} (${result.rawLength} → ${result.condensedLength} chars, ${result.reduction} reduction)\n`);
      } else {
        process.stderr.write(`  ✗ ${name}: ${result.message}\n`);
      }
    }

    await context.close();
    await browser.close();

    const ok = results.filter(r => r.status === 'ok').length;
    const failed = results.filter(r => r.status !== 'ok').length;

    // Build search index from the freshly written .md files
    buildSearchIndex();

    process.stdout.write(JSON.stringify({
      status: 'ok',
      summary: { total: results.length, ok, failed },
      components: results,
      cacheDir: SUPERNOVA_CACHE,
    }, null, 2) + '\n');
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
