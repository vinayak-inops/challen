import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/challan',
      server: {
        port: 3012,
        host: '0.0.0.0',
      allowedHosts: ['management.clms.in'],
    },

    preview: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['management.clms.in'],
    },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NEXT_PUBLIC_NEXTAUTH_URL': JSON.stringify(env.NEXT_PUBLIC_NEXTAUTH_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
