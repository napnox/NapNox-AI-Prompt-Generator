import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Serves `api/generate.ts` from the Vite dev server so local development
 * matches production, where the same handler is deployed as a serverless
 * function. The Gemini API key stays in this Node process and is never
 * exposed to the browser bundle.
 */
function devApiPlugin(): Plugin {
  return {
    name: 'napnox-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res) => {
        try {
          const mod = await server.ssrLoadModule('/api/generate.ts');
          const handler = mod.handleGenerate ?? mod.default;

          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const body = Buffer.concat(chunks);

          const request = new Request(`http://localhost${req.url ?? '/'}`, {
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
          console.error('[dev-api] /api/generate failed:', error);
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: { message: 'Internal server error.', code: '500' } }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Expose the key to the dev server process only. It is deliberately NOT
  // passed through `define`, which would inline it into the client bundle.
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      // Allow the app to be previewed through a remote dev host/tunnel.
      allowedHosts: ['localhost', '.e2b.app'],
    },
    plugins: [react(), devApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
