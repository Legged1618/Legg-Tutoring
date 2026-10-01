/**
 * Looks up the preview image a site publishes for link sharing (its
 * og:image or twitter:image tag), the same picture you see when the link is
 * pasted into a text message or social post. Cached for a day; returns null
 * if the site is slow, down, or has no preview image.
 */
export async function getPreviewImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; LeggTutoringLinkPreview/1.0)" },
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 200_000);
    const content = findMeta(html, "og:image:secure_url") ?? findMeta(html, "og:image") ?? findMeta(html, "twitter:image");
    if (!content) return null;
    const url = new URL(content.replace(/&amp;/g, "&"), res.url || pageUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function findMeta(html: string, key: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (name?.toLowerCase() !== key) continue;
    const content = /\bcontent\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (content) return content.trim();
  }
  return null;
}
