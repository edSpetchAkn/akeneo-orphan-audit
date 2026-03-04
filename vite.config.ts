/**
 * Vite build configuration for the Akeneo Orphan Asset Audit extension.
 *
 * Produces a single self-contained ES module bundle suitable for upload
 * to the Akeneo PIM Extensions UI.
 *
 * Build modes:
 *   - production (npm run build): Minified, tree-shaken, console calls stripped.
 *   - development (npm run dev):  No minification, inline sourcemaps, fast rebuilds.
 *
 * The output filename matches the `file` field in extension_configuration.json.
 */

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ES_TARGET = 'es2020';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      lib: {
        // Entry point — must match the SDK convention of src/main.tsx
        entry: path.resolve(__dirname, 'src/main.tsx'),
        name: 'akeneo-orphan-audit',
        // Output filename must match extension_configuration.json → "file" field
        fileName: 'akeneo-orphan-audit',
        formats: ['es'],
      },

      minify: isProduction ? 'terser' : false,
      cssMinify: isProduction,

      ...(isProduction && {
        terserOptions: {
          compress: {
            // Strip all console calls in production (debug logs, etc.)
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            passes: 3,
          },
          format: {
            comments: false,
            ecma: 2020,
          },
        },
      }),

      sourcemap: isProduction ? false : 'inline',

      rollupOptions: {
        ...(isProduction && {
          treeshake: {
            moduleSideEffects: (id) => !id.includes('akeneo-design-system'),
          },
        }),
      },

      // CRITICAL: Enables tree-shaking for CommonJS modules.
      // Without this, bundle size can increase significantly.
      commonjsOptions: {
        strictRequires: 'auto',
      },
    },

    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },

    ...(mode === 'development' && {
      optimizeDeps: {
        include: ['react', 'react-dom'],
        esbuildOptions: {
          target: ES_TARGET,
        },
      },
      esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
        target: ES_TARGET,
        legalComments: 'none',
      },
    }),
  };
});
