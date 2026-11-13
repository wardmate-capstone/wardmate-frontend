// Hiển thị họ tên do backend lưu sẵn (snapshot); dữ liệu cũ chưa có tên thì hiện mã tài khoản rút gọn
export function personName(id: string, name?: string | null): string {
  return name?.trim() || `Tài khoản ${id.slice(0, 8)}`;
}

export function accountRoleLabel(role: string): string {
  return ({ ADMINISTRATOR: 'Quản trị viên', ADMIN: 'Quản trị viên', IT_ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý cán bộ', FRONT_DESK_OFFICER: 'Cán bộ Một cửa', PROCEDURE_MANAGER: 'Quản lý thủ tục',
    REGISTERED_CITIZEN: 'Công dân',
  } as Record<string, string>)[role] || 'Vai trò khác';
}
