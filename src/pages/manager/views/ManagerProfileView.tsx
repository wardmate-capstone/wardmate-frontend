import React, { useState } from 'react';
import { toast } from '@/components/ui/Toast';

export const ManagerProfileView: React.FC = () => {
  const [profile, setProfile] = useState({
    fullName: 'Nguyễn Thế Hùng',
    role: 'Phó Chủ tịch UBND Phường',
    email: 'hungnt.hangbai@hanoi.gov.vn',
    phone: '0912348899',
    unit: 'Ủy ban nhân dân Phường Hàng Bài, Quận Hoàn Kiếm, TP. Hà Nội',
    lastLogin: 'Hôm nay, 30/09/2026 - 14:15 (IP: 10.10.24.12)',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    toast.success('Đã cập nhật thông tin cá nhân thành công.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="admin-card p-6">
        <div className="flex flex-wrap items-center gap-5 border-b border-slate-100 pb-6">
          <div className="size-20 rounded-full bg-red-900 text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-lg">
            TH
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
              <span className="admin-status-badge is-danger">Lãnh đạo phê duyệt</span>
            </div>
            <p className="text-xs text-slate-600 font-semibold">{profile.role}</p>
            <p className="text-xs text-slate-400">{profile.unit}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chức vụ công tác
              </label>
              <input
                type="text"
                disabled
                value={profile.role}
                className="w-full h-10 px-3 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email công vụ (.gov.vn)
              </label>
              <input
                type="email"
                disabled={!isEditing}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                disabled={!isEditing}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cơ quan / Đơn vị trực thuộc
              </label>
              <input
                type="text"
                disabled
                value={profile.unit}
                className="w-full h-10 px-3 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lần đăng nhập gần nhất
              </label>
              <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {profile.lastLogin}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button type="submit" className="admin-primary-action text-xs">
                  Lưu thay đổi
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="admin-primary-action text-xs"
              >
                Chỉnh sửa thông tin
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
