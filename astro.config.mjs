// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves a project site at https://<owner>.github.io/<repo>/,
// so every link on the site needs that prefix (`base`).
// If the site moves to its own domain at the root, change `base` to '/'
// and `site` to the new address.
export default defineConfig({
  site: 'https://bsitzertm.github.io',
  base: '/community-circles-site',
  trailingSlash: 'always',
  output: 'static',
});
