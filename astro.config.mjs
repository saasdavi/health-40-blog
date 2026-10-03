import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [],
  output: 'static',
  vite: {
    ssr: {
      external: ['google-ads-api']
    }
  }
});
