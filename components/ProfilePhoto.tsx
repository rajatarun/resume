/**
 * The portrait, as responsive WebP: 13 KB at 480px wide, 30 KB at 864px,
 * against 1.26 MB for the original PNG (kept for social-share cards only).
 *
 * A plain <img>, not next/image: the static export serves images unoptimised,
 * so next/image would ship the raw file, and its `priority` adds a <head>
 * preload that fires even for homepage designs that are hidden. `eager` is
 * for the copy that can be the largest thing on first paint.
 */
export function ProfilePhoto({
  alt,
  sizes,
  className,
  eager = false
}: {
  alt: string;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/profile-photo.webp"
      srcSet="/profile-photo-480.webp 480w, /profile-photo.webp 864w"
      sizes={sizes}
      width={864}
      height={1184}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
