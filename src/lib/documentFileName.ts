/**
 * Tên tệp tờ khai hiển thị cho người dùng: giữ tên tệp do backend trả về,
 * chỉ rút gọn mã 32 ký tự ở đầu thành 8 ký tự + "…" cho dễ đọc
 * (vd: `dccb6f4a41804d93882edac0fc08c60b_don-nhap.docx` → `dccb6f4a…_don-nhap.docx`).
 */
export function displayDocumentFileName(rawName?: string | null, fallback = 'Tờ khai chưa đặt tên'): string {
  const name = (rawName ?? '').trim();
  return name ? name.replace(/^([a-f0-9]{8})[a-f0-9]{24}_/i, '$1…_') : fallback;
}
