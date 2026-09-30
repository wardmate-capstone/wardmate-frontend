import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  Plus,
} from '@phosphor-icons/react';
import { mockPermissionRoles } from '../mockData';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export const ManagerPermissionsView: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<{
    roleName: string;
    usersCount: number;
    desc: string;
    badge: string;
    tone: string;
  } | null>(null);

  const permissionsList = [
    { id: 'view_dossiers', name: 'Xem danh sách & chi tiết hồ sơ', desc: 'Cho phép tra cứu toàn bộ hồ sơ trong thẩm quyền' },
    { id: 'precheck_dossiers', name: 'Tiền kiểm & Duyệt checklist hồ sơ', desc: 'Kiểm tra tính hợp lệ của giấy tờ công dân nộp' },
    { id: 'assign_dossiers', name: 'Phân công cán bộ thụ lý hồ sơ', desc: 'Chỉ định cán bộ chịu trách nhiệm giải quyết' },
    { id: 'approve_results', name: 'Phê duyệt kết quả giải quyết TTHC', desc: 'Duyệt ký số hoặc phê duyệt bản thảo kết quả' },
    { id: 'view_reports', name: 'Xem & xuất báo cáo thống kê', desc: 'Xem số liệu phân tích và tải file báo cáo định kỳ' },
    { id: 'manage_feedbacks', name: 'Xử lý phản ánh kiến nghị công dân', desc: 'Tiếp nhận và gửi phản hồi chính thức cho người dân' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Quản lý Vai trò & Phân quyền Hệ thống
          </h2>
          <p className="text-xs text-slate-500">
            Thiết lập quyền truy cập chức năng cho từng vị trí công tác tại Bộ phận Một cửa
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-action"
          onClick={() => toast.info('Chức năng thêm vai trò mới yêu cầu quyền Quản trị tối cao (Admin).')}
        >
          <Plus size={18} weight="bold" />
          <span>Thêm nhóm vai trò</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockPermissionRoles.map((role) => (
          <div
            key={role.roleName}
            className="admin-card p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <Users size={16} /> {role.usersCount} cán bộ
                </span>
                <span
                  className={`admin-status-badge ${
                    role.tone === 'danger'
                      ? 'is-danger'
                      : role.tone === 'info'
                      ? 'is-info'
                      : role.tone === 'success'
                      ? 'is-success'
                      : 'is-warning'
                  }`}
                >
                  {role.badge}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                {role.roleName}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {role.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                className="text-xs font-semibold text-red-800 hover:text-red-950"
                onClick={() => setSelectedRole(role)}
              >
                Xem chi tiết quyền
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                onClick={() => toast.success(`Đã cập nhật phân quyền nhóm: ${role.roleName}`)}
              >
                Cập nhật
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedRole && (
        <Modal
          open={Boolean(selectedRole)}
          onOpenChange={(open) => {
            if (!open) setSelectedRole(null);
          }}
          title={`Chi tiết phân quyền: ${selectedRole.roleName}`}
          description={`Danh mục các quyền hạn chức năng đang được kích hoạt cho nhóm này`}
        >
          <div className="space-y-3 py-2">
            {permissionsList.map((p) => (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-slate-900 block font-bold">{p.name}</strong>
                  <span className="text-slate-500">{p.desc}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-3">
              <button
                type="button"
                className="admin-primary-action text-xs"
                onClick={() => setSelectedRole(null)}
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
