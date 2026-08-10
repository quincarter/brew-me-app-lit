/**
 * Rewrites the Open Graph / Twitter meta tags in `index.html` for
 * `/share?brewType=...&ratio=...` links so unfurling them in iMessage,
 * Slack, Discord, etc. shows the actual brew instead of generic BrewMe
 * branding - crawlers don't run the SPA's JS, so this has to happen before
 * the response leaves the edge.
 *
 * The query-param parsing here intentionally duplicates the pure logic in
 * `src/shared/utilities/share.utility.ts` rather than importing it: Deno
 * (Netlify's edge runtime) requires fully-specified, extensioned relative
 * imports, while this repo's own modules import each other bundler-style
 * (no extensions) - importing across that boundary isn't reliable. Keep the
 * validation rule (brew type present, every number finite and positive) in
 * sync with `parseShareParams` if it changes.
 */

interface NetlifyEdgeContext {
  next: () => Promise<Response>;
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const replaceMeta = (html: string, selector: RegExp, content: string): string =>
  html.replace(selector, (tag) => tag.replace(/content="[^"]*"/, `content="${content}"`));

export default async (request: Request, context: NetlifyEdgeContext): Promise<Response> => {
  const url = new URL(request.url);
  const params = url.searchParams;

  const brewType = params.get("brewType");
  const ratio = Number.parseFloat(params.get("ratio") ?? "");
  const water = Number.parseFloat(params.get("water") ?? "");
  const coffee = Number.parseFloat(params.get("coffee") ?? "");
  const oz = Number.parseFloat(params.get("oz") ?? "");
  const isValid =
    Boolean(brewType) &&
    [ratio, water, coffee, oz].every((value) => Number.isFinite(value) && value > 0);

  const response = await context.next();

  if (!isValid || !brewType) {
    return response;
  }

  const title = `${brewType} · 1:${ratio} ratio — BrewMe`;
  const description = `${coffee}g coffee to ${water}g water (${oz}oz) at a 1:${ratio} ratio. Open this brew in BrewMe.`;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(url.toString());

  let html = await response.text();
  html = replaceMeta(html, /<meta property="og:title" content="[^"]*"\s*\/>/, safeTitle);
  html = replaceMeta(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    safeDescription,
  );
  html = replaceMeta(html, /<meta property="og:url" content="[^"]*"\s*\/>/, safeUrl);
  html = replaceMeta(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, safeTitle);
  html = replaceMeta(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    safeDescription,
  );
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);

  return new Response(html, response);
};

export const config = { path: "/share" };
