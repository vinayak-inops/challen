import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Handle environment variables from both .env files and process.env (Vercel)
    const GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    const NEXT_PUBLIC_NEXTAUTH_URL = env.NEXT_PUBLIC_NEXTAUTH_URL || process.env.NEXT_PUBLIC_NEXTAUTH_URL || '';
    
    return {
      base: '/challan/',
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
        'process.env.API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.NEXT_PUBLIC_NEXTAUTH_URL': JSON.stringify(NEXT_PUBLIC_NEXTAUTH_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
