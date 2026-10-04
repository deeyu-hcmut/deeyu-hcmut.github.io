// Ask Unsplash for an image close to its rendered size instead of the full 1200px original.
// URLs from other hosts (e.g. pasted by an admin) are returned unchanged.
export function sizedImage(url: string, width: number): string {
  if (!url || !url.includes('images.unsplash.com')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    return u.toString();
  } catch {
    return url;
  }
}
