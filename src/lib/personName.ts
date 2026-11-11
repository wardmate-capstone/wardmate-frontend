// Hiển thị họ tên do backend lưu sẵn (snapshot); dữ liệu cũ chưa có tên thì hiện mã tài khoản rút gọn
export function personName(id: string, name?: string | null): string {
  return name?.trim() || `Tài khoản ${id.slice(0, 8)}`;
}
