import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Ittihad Alex App',
          short_name: 'Ittihad',
          description: 'Official application for Ittihad Alexandria club',
          theme_color: '#083d25',
          background_color: '#f8fafc',
          display: 'standalone',
          icons: [
            {
              src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTDqivbMM3woUHfm0Fj4XuGiRWg8PmTtJowqlI8y7wBGhivrSolvAevgIObczC46rYMW6R6rinL9TqfGH1jrcMPK_8UIBS5BNDQg0fezc-pNyKiveAtRnkgFsEMr_lnd5wgl09eqc3YvCzVPpSfTaRKgih0nX_npjdEHKMI9lEkL58AadbCt-awTzFiNejQF0zvn8p3d78izoaUNtvNdS10x7MqOJcbrgLR4Higfk6zZoqZq7qIHKPdlp9_CEeeUK43Mhb0Pi1q3g',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTDqivbMM3woUHfm0Fj4XuGiRWg8PmTtJowqlI8y7wBGhivrSolvAevgIObczC46rYMW6R6rinL9TqfGH1jrcMPK_8UIBS5BNDQg0fezc-pNyKiveAtRnkgFsEMr_lnd5wgl09eqc3YvCzVPpSfTaRKgih0nX_npjdEHKMI9lEkL58AadbCt-awTzFiNejQF0zvn8p3d78izoaUNtvNdS10x7MqOJcbrgLR4Higfk6zZoqZq7qIHKPdlp9_CEeeUK43Mhb0Pi1q3g',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
