import { createClient } from '@sanity/client';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Build-time route discovery and sitemap generation.
 *
 * Runs in Node during `vite build`, not in the browser, so it reads
 * `process.env` rather than `import.meta.env` — Vite only injects the latter
 * into bundled client code.
 */
const projectId = process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.VITE_SANITY_DATASET || 'staging';
const apiVersion = process.env.VITE_SANITY_API_VERSION || '2024-01-01';
const siteUrl = (process.env.VITE_SITE_URL || 'https://rmws.com').replace(/\/$/, '');

const client = projectId
  ? createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: 'published' })
  : null;

/** Routes that exist regardless of what is in the CMS. */
const STATIC_ROUTES = [
  '/', '/about', '/services', '/equipment', '/safety', '/employment', '/contact',
  '/privacy-policy', '/terms-and-conditions',
];

async function serviceRoutes(): Promise<string[]> {
  if (!client) return [];
  try {
    const slugs = await client.fetch<string[]>(
      `*[_type == "servicePage" && defined(slug.current)].slug.current`
    );
    return slugs.map((slug) => `/services/${slug}`);
  } catch (err) {
    // A failed query would silently drop every service page from the build.
    // Fail loudly instead of shipping a site missing its detail pages.
    throw new Error(`Could not read service slugs from Sanity: ${(err as Error).message}`);
  }
}

let discovered: string[] = [];

/**
 * When each route's content last changed, from Sanity. The sitemap used to
 * stamp every page with the build date, which tells Google everything changed
 * on every deploy — so it learns to ignore the date entirely.
 */
async function lastModified(): Promise<Map<string, string>> {
  const dates = new Map<string, string>();
  if (!client) return dates;
  const rows = await client.fetch<{ type: string; slug: string; updated: string }[]>(
    `*[_type in ["page", "servicePage", "legalPage"] && defined(slug.current)]{ "type": _type, "slug": slug.current, "updated": _updatedAt }`
  );
  for (const r of rows) {
    const route = r.type === 'servicePage' ? `/services/${r.slug}` : r.slug;
    dates.set(route, r.updated.slice(0, 10));
  }
  return dates;
}

export async function getPrerenderRoutes(_paths: string[]): Promise<string[]> {
  const services = await serviceRoutes();
  discovered = [...STATIC_ROUTES, ...services];
  console.log(`[prerender] ${discovered.length} routes (${services.length} services) + 404 page`);
  // /404 renders the not-found page to dist/404.html, which Netlify serves with
  // a 404 status for any address that has no file. It is not in the sitemap.
  return [...discovered, '/404'];
}

/**
 * Written after the prerender so it reflects exactly what was built, rather
 * than the hand-maintained list the template shipped — which had no way to know
 * about CMS-driven service pages and listed routes that did not exist.
 */
export async function writeSitemap() {
  const routes = discovered.length ? discovered : STATIC_ROUTES;
  const today = new Date().toISOString().slice(0, 10);
  const updated = await lastModified().catch(() => new Map<string, string>());

  const priority = (route: string) => {
    if (route === '/') return '1.0';
    if (route.startsWith('/privacy') || route.startsWith('/terms')) return '0.3';
    if (route.startsWith('/services/')) return '0.7';
    return '0.8';
  };

  const body = routes
    .map(
      (route) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${updated.get(route) ?? today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority(route)}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  await writeFile(resolve(process.cwd(), 'dist/sitemap.xml'), xml, 'utf8');
  console.log(`[sitemap] ${routes.length} urls written`);
}
