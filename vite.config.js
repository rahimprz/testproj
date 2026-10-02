import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Runs the Vercel functions in /api during `npm run dev`, so the whole stack works locally.
// Set STORE_FILE=.data/store.json and ADMIN_PASSWORD=... to try live mode without Vercel.
function vercelApi() {
  return {
    name: 'local-vercel-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = /^\/api\/([a-z-]+)(?:\?|$)/.exec(req.url || '');
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(resolve(__dirname, `api/${m[1]}.js`));
          await mod.default(req, res);
        } catch (e) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), vercelApi()],
  build: {
    rollupOptions: {
      // ONLY=main builds just the public site (handy while working on one entry).
      input: process.env.ONLY === 'main'
        ? { main: resolve(__dirname, 'index.html') }
        : { main: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin.html') },
    },
  },
});
