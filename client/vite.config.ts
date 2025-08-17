import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Disable host checking for reverse proxy setups
  define: {
    __VITE_DISABLE_HOST_CHECK__: true
  },
  server: {
    host: "::",
    port: 8080,
    allowedHosts: "all"
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: "all",
    strictPort: false,
    cors: true,
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Custom plugin to completely disable host checking
    {
      name: 'disable-host-check',
      configureServer(server) {
        server.middlewares.use('/', (req, res, next) => {
          // Override host header validation
          req.headers.host = 'localhost:4173';
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use('/', (req, res, next) => {
          // Override host header validation for preview
          req.headers.host = 'localhost:4173';
          next();
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}));
