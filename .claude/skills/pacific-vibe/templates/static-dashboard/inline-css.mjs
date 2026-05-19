/**
 * Post-build script: inlines assets/stylex.css into dist/index.html.
 * The StyleX unplugin emits CSS outside Vite's normal pipeline,
 * so vite-plugin-singlefile doesn't catch it.
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(import.meta.dirname, 'dist');
const htmlPath = resolve(dist, 'index.html');
const cssPath = resolve(dist, 'assets', 'stylex.css');

if (!existsSync(cssPath)) {
  console.log('No stylex.css found — nothing to inline.');
  process.exit(0);
}

const html = readFileSync(htmlPath, 'utf-8');
const css = readFileSync(cssPath, 'utf-8');

// Inject the CSS as a <style> tag right before </head>
const inlined = html.replace('</head>', `<style>${css}</style>\n</head>`);

writeFileSync(htmlPath, inlined);
rmSync(resolve(dist, 'assets'), { recursive: true, force: true });

console.log(`Inlined stylex.css (${(css.length / 1024).toFixed(1)} KB) into index.html`);
console.log(`Final: ${(inlined.length / 1024).toFixed(1)} KB`);
