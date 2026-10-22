/**
 * Sends /about/ to /about with a permanent redirect.
 *
 * The old Gatsby site served every page at an address ending in a slash
 * (/about/, /services/swabbing/), and those are the addresses Google has
 * indexed and other sites link to. The rebuilt site's pages are /about and so
 * on. Netlify's redirect rules cannot add or remove a trailing slash (they
 * ignore it when matching), so this runs at the edge instead, before any file
 * is looked up. A 301 carries the old address's search ranking to the new one.
 *
 * Only paths that end in a slash reach this function (see `config`); the
 * homepage "/" is excluded by the pattern.
 */
export default (request: Request) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/\/+$/, '');
  return Response.redirect(url.toString(), 301);
};

export const config = {
  pattern: '^/.+/$',
};
