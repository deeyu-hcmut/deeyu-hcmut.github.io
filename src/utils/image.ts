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

// Firebase Storage needs the paid plan, so uploaded avatars are center-cropped to a small
// square JPEG and stored inline as a data URL (~20-40 KB).
export async function imageFileToDataUrl(file: File, size = 256, quality = 0.85): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('File được chọn không phải ảnh.');
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(size, side);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    ctx.fillStyle = '#ffffff'; // transparent PNGs would turn black in JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    bitmap.close();
  }
}
