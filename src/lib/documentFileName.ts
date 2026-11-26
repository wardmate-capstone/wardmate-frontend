/**
 * Tên tệp tờ khai hiển thị cho người dùng (FE-10). `fileName` của BE hiện còn là tên lưu trong kho:
 * mã 32 ký tự (hoặc GUID có gạch) + "_" ở đầu và đôi khi lặp đuôi
 * (vd: `dccb6f4a41804d93882edac0fc08c60b_don-nhap-lan-1.docx.docx` → `don-nhap-lan-1.docx`).
 * Bỏ tiền tố mã và đuôi lặp; tên còn rỗng thì dùng `fallback`. Tải xuống vẫn dùng tên BE trả trong header.
 */
export function displayDocumentFileName(rawName?: string | null, fallback = 'Tờ khai chưa đặt tên'): string {
  const name = (rawName ?? '')
    .trim()
    .replace(/^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})_/i, '')
    .replace(/(\.[a-z0-9]{2,5})(?:\1)+$/i, '$1');
  return name && !/^\.[a-z0-9]+$/i.test(name) ? name : fallback;
}
