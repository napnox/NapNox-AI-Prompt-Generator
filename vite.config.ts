import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Dev-only API routes. Production is served by the WordPress plugin. */
const DEV_ROUTES: Record<string, string> = {
  '/api/session': '/api/session.ts',
  '/api/generate': '/api/generate.ts',
};

/**
 * Runs the `api/*` handlers inside the Vite dev server so the app can be
 * developed without a WordPress install. The Gemini key stays in this Node
 * process and is never exposed to the browser bundle.
 */
function devApiPlugin(): Plugin {
  return {
    name: 'napnox-dev-api',
    configureServer(server) {
      for (const [route, modulePath] of Object.entries(DEV_ROUTES)) {
        server.middlewares.use(route, async (req, res) => {
          try {
            const mod = await server.ssrLoadModule(modulePath);
            const handler = mod.default ?? mod.handleGenerate ?? mod.handleSession;

            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(chunk as Buffer);
            const body = Buffer.concat(chunks);

            const request = new Request(`http://localhost${route}`, {
              method: req.method,
              headers: req.headers as HeadersInit,
              body: body.length ? body : undefined,
            });

            const response: Response = await handler(request);
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch (error) {
            server.ssrFixStacktrace(error as Error);
            console.error(`[dev-api] ${route} failed:`, error);
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ error: { message: 'Internal server error.', code: '500' } }));
          }
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Dev server process only. Deliberately NOT passed through `define`, which
  // would inline the key into the client bundle.
  for (const key of ['GEMINI_API_KEY', 'NAPNOX_CONTACT_EMAIL', 'NAPNOX_CONTACT_WHATSAPP']) {
    if (env[key]) process.env[key] = env[key];
  }

  // `npm run build:wp` emits a single IIFE bundle with stable filenames for
  // the WordPress plugin to enqueue. The default build stays a normal SPA.
  const wordpress = process.env.NAPNOX_WP_BUILD === '1';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['localhost', '.e2b.app'],
    },
    plugins: [react(), devApiPlugin()],
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
    build: wordpress
      ? {
          outDir: 'wordpress-plugin/napnox-prompt-generator/assets',
          emptyOutDir: true,
          cssCodeSplit: false,
          rollupOptions: {
            input: path.resolve(__dirname, 'index.tsx'),
            output: {
              format: 'iife',
              entryFileNames: 'napnox-app.js',
              assetFileNames: (info) =>
                info.name?.endsWith('.css') ? 'napnox-app.css' : 'assets/[name][extname]',
              inlineDynamicImports: true,
            },
          },
        }
      : { outDir: 'dist' },
  };
});
