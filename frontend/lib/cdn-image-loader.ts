/**
 * Custom Next.js image loader for CDN-first delivery.
 *
 * When NEXT_PUBLIC_CDN_URL is set, all <Image /> src URLs are rewritten to
 * point at the CDN edge so users in high-latency regions get cached responses
 * from the nearest PoP instead of hitting the origin server.
 *
 * Falls back to the default Next.js image optimisation path when no CDN is
 * configured (local dev, staging without CDN, etc.).
 *
 * Usage: set in next.config.ts → images.loaderFile
 */

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cdnImageLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderProps): string {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

  // No CDN configured — use the built-in Next.js image optimisation endpoint
  if (!cdnUrl) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
  }

  // Already an absolute URL (remote image) — proxy through CDN image endpoint
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return `${cdnUrl}/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
  }

  // Relative path — serve directly from CDN static origin
  return `${cdnUrl}${src}?w=${width}&q=${quality}`;
}
