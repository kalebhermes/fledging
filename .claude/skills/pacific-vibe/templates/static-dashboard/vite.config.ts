import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

// @sofi-web-ui ships ESM with preserved JSX in .js files.
// Transform them to valid JS before other plugins process them.
function sofiJsxPlugin() {
  return {
    name: 'sofi-jsx-transform',
    enforce: 'pre' as const,
    async transform(code: string, id: string) {
      const cleanId = id.split('?')[0];
      if (
        cleanId.includes('node_modules/@sofi-web-ui') &&
        cleanId.endsWith('.js') &&
        code.includes('<')
      ) {
        return transformWithEsbuild(code, cleanId, {
          jsx: 'automatic',
          loader: 'jsx',
        });
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    sofiJsxPlugin(),
    stylex.vite({
      unstable_moduleResolution: {
        type: 'commonJS',
        rootDir: path.resolve(import.meta.dirname),
      },
      // sofi-web-ui doesn't declare @stylexjs/stylex as a dependency, so the
      // unplugin's auto-discovery misses it. Listing them here ensures the
      // unplugin excludes them from optimizeDeps and compiles their StyleX
      // calls (defineVars, create) via its Babel transform hook.
      externalPackages: [
        '@sofi-web-ui/base',
        '@sofi-web-ui/core',
        '@sofi-web-ui/form-inputs',
        '@sofi-web-ui/icons',
      ],
    }),
    react(),
    viteSingleFile(),
  ],
  optimizeDeps: {
    // sofi-web-ui is excluded from pre-bundling (via externalPackages above)
    // so its CJS transitive deps aren't auto-discovered by Vite's scanner.
    // Explicitly include them so Vite pre-bundles them with CJS→ESM interop.
    include: [
      'use-sync-external-store',
      'use-sync-external-store/with-selector',
      'react-aria',
      '@floating-ui/react',
      '@floating-ui/dom',
    ],
    esbuildOptions: {
      jsx: 'automatic',
      loader: { '.js': 'jsx' },
    },
  },
});
