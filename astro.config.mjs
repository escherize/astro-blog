// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), react()],
  redirects: {
    '/posts/post-10': '/posts/gleam-vs-go',
    '/posts/post-10/': '/posts/gleam-vs-go/',
  },
});
