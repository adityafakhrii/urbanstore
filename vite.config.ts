import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

dotenv.config();

const DEV_API_ROUTES: Record<string, string> = {
  '/api/mayar/create-payment': '/api/mayar/create-payment.ts',
  '/api/mayar/check-status': '/api/mayar/check-status.ts',
  '/api/mayar/webhook': '/api/mayar/webhook.ts',
  '/api/ai/chat': '/api/ai/chat.ts',
  '/api/ai/admin': '/api/ai/admin.ts',
};

function devApiPlugin(): Plugin {
  return {
    name: 'urbanstore-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        const modulePath = DEV_API_ROUTES[pathname];
        if (!modulePath) {
          next();
          return;
        }
        try {
          const mod = await server.ssrLoadModule(modulePath);
          if (typeof mod.default === 'function') {
            await mod.default(req, res);
            return;
          }
          next();
        } catch (err) {
          console.error('[urbanstore-dev-api]', pathname, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              ok: false,
              error: 'Terjadi kesalahan internal pada server API.',
            })
          );
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    envPrefix: [
      'VITE_',
      'SUPABASE_PROJECT_',
      'SUPABASE_PUBLISHABLE_',
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
