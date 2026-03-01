/**
 * Custom image loader that returns the source URL directly.
 * Bypasses Next.js image optimization to avoid:
 * - transformAlgorithm race (nodejs/node#62036)
 * - 401 when R2/upstream requires browser-origin requests
 * Images load directly in the browser from R2/Vercel Blob.
 */
export default function directImageLoader({
  src,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  return src;
}
