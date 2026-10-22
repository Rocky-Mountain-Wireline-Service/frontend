import { createImageUrlBuilder } from '@sanity/image-url'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'

const builder = createImageUrlBuilder({ projectId, dataset })

/**
 * Returns a Sanity image URL builder for the given source.
 * Respects crop and hotspot metadata set in the Studio.
 *
 * Usage: sanityImage(source).width(80).height(80).url()
 */
export function sanityImage(source: unknown) {
  return builder.image(source as any)
}

/**
 * Width and height for an image's `width`/`height` attributes, so the browser
 * reserves its space before it loads and nothing below it jumps. Sanity puts
 * the original size in every asset ID (image-<hash>-1690x1296-jpg); a crop set
 * in the Studio changes the proportions, so it is applied too.
 */
export function imageDimensions(
  source: { asset?: { _ref?: string }; crop?: unknown } | null | undefined,
  width: number
): { width: number; height: number } | null {
  const m = source?.asset?._ref?.match(/-(\d+)x(\d+)-[a-z]+$/)
  if (!m) return null
  const crop = (source?.crop ?? {}) as Partial<Record<'top' | 'bottom' | 'left' | 'right', number>>
  const w = Number(m[1]) * (1 - (crop.left ?? 0) - (crop.right ?? 0))
  const h = Number(m[2]) * (1 - (crop.top ?? 0) - (crop.bottom ?? 0))
  if (!(w > 0 && h > 0)) return null
  return { width, height: Math.round((width * h) / w) }
}
