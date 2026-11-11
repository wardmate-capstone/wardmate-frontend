/**
 * Lấy tên file từ header Content-Disposition.
 * BE gửi cả `filename="..."` (ASCII, tiếng Việt bị thay bằng "_") và `filename*=UTF-8''...` (đúng dấu):
 * phải ưu tiên `filename*` để tên file tải về giữ nguyên tiếng Việt.
 */
export function fileNameFromDisposition(disposition: unknown, fallback: string): string {
  if (typeof disposition !== 'string') return fallback;
  const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)?'[^']*'([^;]+)/i.exec(disposition)?.[1]?.trim().replace(/^["']|["']$/g, '');
  if (encoded) {
    try { return decodeURIComponent(encoded); } catch { /* chuỗi mã hóa lỗi: dùng filename thường */ }
  }
  const plain = /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i.exec(disposition);
  const name = (plain?.[1] ?? plain?.[2])?.trim();
  return name || fallback;
}
