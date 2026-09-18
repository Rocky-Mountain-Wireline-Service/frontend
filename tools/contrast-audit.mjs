/**
 * WCAG AA contrast audit across both themes and every prerendered route.
 *
 * Two things make a naive version of this report confident nonsense:
 *
 *   1. Tailwind's opacity utilities (text-white/60) compute to oklab(). Reading
 *      those coordinates as RGB, or passing them through canvas fillStyle
 *      (which rejects oklab and silently keeps its previous value), produces
 *      wrong numbers rather than errors.
 *   2. A hero's background is painted by absolutely-positioned siblings — an
 *      <img> and a gradient overlay — not by an ancestor's background-color.
 *      Walking up the tree finds the body and concludes white-on-white.
 *
 * So CSS is used only as a fast filter. Anything that looks like a failure is
 * then confirmed by hiding the text, screenshotting the region, and comparing
 * the text colour against the worst background pixel underneath it — a
 * headline is only as readable as its least contrasty stretch.
 *
 * Usage:  node tools/contrast-audit.mjs [baseUrl]
 * Exits non-zero if anything fails, so it can gate a build.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const ROUTES = [
  '/', '/about', '/services', '/services/plug-and-perf',
  '/equipment', '/safety', '/employment', '/contact', '/privacy-policy',
];

const relLum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [x, y] = [relLum(a), relLum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** Collect every text node whose CSS-computed contrast looks insufficient. */
const COLLECT = () => {
  const gamma = (c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
  };
  const oklabToRgb = (L, a, b) => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      gamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      gamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      gamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ];
  };
  const toRgba = (css) => {
    const n = (css.match(/-?[\d.]+(?:e-?\d+)?%?/g) || []).map((v) =>
      v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v));
    if (css.startsWith('oklab')) return [...oklabToRgb(n[0], n[1], n[2]), n[3] ?? 1];
    if (css.startsWith('oklch')) {
      const rad = (n[2] * Math.PI) / 180;
      return [...oklabToRgb(n[0], n[1] * Math.cos(rad), n[1] * Math.sin(rad)), n[3] ?? 1];
    }
    if (css.startsWith('#')) {
      const h = css.slice(1);
      const x = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
      return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16), 1];
    }
    return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
  };

  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const bgOf = (el) => {
    let n = el;
    while (n) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const [r, g, b, a] = toRgba(cs.backgroundColor);
      if (a > 0.95) return [r, g, b];
      n = n.parentElement;
    }
    return [255, 255, 255];
  };

  const out = [];
  const seen = new Set();

  for (const el of document.querySelectorAll('a,p,h1,h2,h3,h4,li,span,dd,label,button,time,strong')) {
    const text = (el.textContent || '').trim();
    if (!text || el.children.length > 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') continue;

    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;

    const [fr, fg, fb, fa] = toRgba(cs.color);
    const ground = bgOf(el);

    let cssRatio = null;
    if (ground) {
      const eff = [
        fr * fa + ground[0] * (1 - fa),
        fg * fa + ground[1] * (1 - fa),
        fb * fa + ground[2] * (1 - fa),
      ];
      const l1 = lum(eff), l2 = lum(ground);
      cssRatio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (cssRatio >= need) continue;     // clearly fine — no need to sample
    }

    const key = `${el.tagName}:${cs.color}:${text.slice(0, 24)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      tag: el.tagName.toLowerCase(),
      text: text.slice(0, 44),
      fg: [fr, fg, fb, fa],
      need,
      cssRatio: cssRatio === null ? null : Number(cssRatio.toFixed(2)),
      rect: { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height },
    });
  }
  return out;
};

/** Hide all text, screenshot the region, and read the real background pixels. */
async function pixelsBehind(page, rect) {
  await page.addStyleTag({ content: '*{color:transparent!important;text-shadow:none!important;-webkit-text-stroke-color:transparent!important}' });
  const buf = await page.screenshot({
    fullPage: true,
    clip: {
      x: Math.max(0, Math.round(rect.x)),
      y: Math.max(0, Math.round(rect.y)),
      width: Math.max(1, Math.round(rect.width)),
      height: Math.max(1, Math.round(rect.height)),
    },
  });
  await page.evaluate(() => {
    const tags = [...document.querySelectorAll('style')];
    const last = tags[tags.length - 1];
    if (last && last.textContent.includes('text-shadow:none!important')) last.remove();
  });

  return page.evaluate(async (dataUrl) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, c.width, c.height).data;
    const px = [];
    // Sample on a grid: every pixel of a wide headline is needless work.
    const step = Math.max(1, Math.floor(Math.sqrt((d.length / 4) / 2000)));
    for (let i = 0; i < d.length; i += 4 * step) px.push([d[i], d[i + 1], d[i + 2]]);
    return px;
  }, `data:image/png;base64,${buf.toString('base64')}`);
}

const browser = await chromium.launch();
let failures = 0;

for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  console.log(`\n${'='.repeat(70)}\n  ${scheme.toUpperCase()} THEME\n${'='.repeat(70)}`);

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    // Self-test: injects three known-bad cases so the audit can be shown to
    // catch real failures. A checker that only ever prints "ok" proves nothing
    // — run `AUDIT_SELFTEST=1 pnpm audit:contrast` and expect 3 failures on /.
    if (process.env.AUDIT_SELFTEST === '1' && route === '/') {
      await page.evaluate(() => {
        const mk = (style, text) => { const p = document.createElement('p'); p.textContent = text; p.setAttribute('style', style); document.body.appendChild(p); };
        mk('color:#cccccc;background:#ffffff;font-size:16px', 'SELFTEST pale grey on white');
        mk('color:rgba(255,255,255,0.35);background:#f5f3f4;font-size:16px', 'SELFTEST translucent white');
        const hero = document.querySelector('section.relative');
        const over = document.createElement('p');
        over.textContent = 'SELFTEST dark grey over hero photo';
        over.setAttribute('style', 'position:relative;z-index:20;color:#3a3a3a;font-size:16px');
        hero?.querySelector('div')?.appendChild(over);
      });
      await page.waitForTimeout(200);
    }

    const candidates = await page.evaluate(COLLECT);
    const confirmed = [];

    for (const c of candidates) {
      const px = await pixelsBehind(page, c.rect);
      const fgSolid = [c.fg[0], c.fg[1], c.fg[2]];
      let worst = Infinity;
      for (const p of px) {
        // Composite the text alpha against this actual pixel.
        const eff = [
          fgSolid[0] * c.fg[3] + p[0] * (1 - c.fg[3]),
          fgSolid[1] * c.fg[3] + p[1] * (1 - c.fg[3]),
          fgSolid[2] * c.fg[3] + p[2] * (1 - c.fg[3]),
        ];
        worst = Math.min(worst, contrast(eff, p));
      }
      if (worst < c.need) confirmed.push({ ...c, ratio: Number(worst.toFixed(2)) });
    }

    if (!confirmed.length) { console.log(`  ${route.padEnd(30)} ok`); continue; }
    failures += confirmed.length;
    console.log(`  ${route.padEnd(30)} ${confirmed.length} below AA`);
    for (const b of confirmed) {
      console.log(`      ${String(b.ratio).padStart(6)}:1 (need ${b.need})  <${b.tag}> "${b.text}"`);
    }
  }
  await ctx.close();
}

console.log(`\n${failures === 0 ? 'PASS — all sampled text meets WCAG AA in both themes' : `FAIL — ${failures} issues`}`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
