import React, { useState } from 'react';
import {
  Plus,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { ManagerProfileItem } from '../types';

interface ManagerProfilesViewProps {
  profiles: ManagerProfileItem[];
  onSaveProfile: (profile: ManagerProfileItem) => void;
  onSelectProfile?: (profile: ManagerProfileItem) => void;
}

export const ManagerProfilesView: React.FC<ManagerProfilesViewProps> = ({
  profiles,
  onSaveProfile,
  onSelectProfile,
}) => {
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Nam' | 'Nữ' | 'Khác'>('All');
  const [viewingProfile, setViewingProfile] = useState<ManagerProfileItem | null>(null);
  const [editingProfile, setEditingProfile] = useState<ManagerProfileItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ManagerProfileItem>({
    fullName: '',
    identityNumber: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Nam',
    permanentAddress: '',
    temporaryAddress: '',
  });

  const filtered = profiles.filter((p) => {
    const matchQuery = `${p.fullName} ${p.identityNumber} ${p.phoneNumber} ${p.permanentAddress} ${p.temporaryAddress}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchGender = genderFilter === 'All' || p.gender === genderFilter;
    return matchQuery && matchGender;
  });

  function formatDate(d: string) {
    if (!d || !d.includes('-')) return d;
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  function handleOpenCreate() {
    setEditingProfile(null);
    setFormData({
      fullName: '',
      identityNumber: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: 'Nam',
      permanentAddress: '',
      temporaryAddress: '',
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(profile: ManagerProfileItem) {
    setEditingProfile(profile);
    setFormData(profile);
    setIsModalOpen(true);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên công dân');
      return;
    }
    if (!formData.identityNumber.trim() || formData.identityNumber.length !== 12) {
      toast.error('Số CCCD / Mã định danh phải gồm chính xác 12 chữ số');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    if (!formData.dateOfBirth) {
      toast.error('Vui lòng chọn ngày sinh');
      return;
    }

    onSaveProfile(formData);
    setIsModalOpen(false);
  }

  return (
    <section className="admin-card admin-table-card admin-content-card">
      {/* Toolbar */}
      <div className="admin-toolbar flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
        <div className="relative flex-1 min-w-[280px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên, số CCCD, điện thoại hoặc địa chỉ..."
            className="w-full h-11 pl-10 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as 'All' | 'Nam' | 'Nữ' | 'Khác')}
            className="h-11 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-800"
          >
            <option value="All">Tất cả giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>

          <button
            type="button"
            className="admin-primary-action"
            onClick={handleOpenCreate}
          >
            <Plus size={18} weight="bold" />
            <span>Thêm hồ sơ</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="min-w-[680px]">
          <thead>
            <tr>
              <th className="min-w-[170px] whitespace-nowrap">Họ và tên</th>
              <th className="min-w-[120px] whitespace-nowrap">Số điện thoại</th>
              <th className="min-w-[110px] whitespace-nowrap">Ngày sinh</th>
              <th className="min-w-[90px] whitespace-nowrap">Giới tính</th>
              <th className="min-w-[180px] whitespace-nowrap text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.identityNumber}>
                <td>
                  <div className="admin-person flex items-center gap-3">
                    <span className="size-9 rounded-full bg-red-100 text-red-900 font-bold text-xs flex items-center justify-center shrink-0">
                      {item.fullName
                        .split(' ')
                        .slice(-2)
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <p>
                      <strong className="block text-xs font-bold text-slate-900">{item.fullName}</strong>
                    </p>
                  </div>
                </td>
                <td className="text-xs text-slate-700">{item.phoneNumber}</td>
                <td className="text-xs text-slate-700">{formatDate(item.dateOfBirth)}</td>
                <td>
                  <span
                    className={`admin-status-badge ${
                      item.gender === 'Nam' ? 'is-info' : 'is-warning'
                    }`}
                  >
                    {item.gender}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-800 hover:text-red-950 px-2 py-1 rounded hover:bg-red-50"
                      onClick={() => {
                        if (onSelectProfile) {
                          onSelectProfile(item);
                        } else {
                          setViewingProfile(item);
                        }
                      }}
                    >
                      Xem chi tiết
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                      onClick={() => handleOpenEdit(item)}
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="admin-empty p-8 text-center text-xs text-slate-500">
          Không tìm thấy hồ sơ công dân nào phù hợp với từ khóa tìm kiếm.
        </p>
      )}

      {/* Modal Xem chi tiết hồ sơ công dân */}
      {viewingProfile && (
        <Modal
          open={Boolean(viewingProfile)}
          onOpenChange={(open) => {
            if (!open) setViewingProfile(null);
          }}
          title="Chi tiết hồ sơ công dân"
        >
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Họ và tên</span>
                  <strong className="text-sm text-slate-900">{viewingProfile.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Số CCCD / Mã định danh</span>
                  <span className="font-mono font-bold text-sm text-red-900">
                    {viewingProfile.identityNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Ngày sinh</span>
                  <span className="text-slate-800 font-semibold">
                    {formatDate(viewingProfile.dateOfBirth)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Giới tính</span>
                  <span className="text-slate-800 font-semibold">{viewingProfile.gender}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Số điện thoại liên hệ</span>
                  <span className="text-slate-800 font-semibold">{viewingProfile.phoneNumber}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Nơi thường trú</span>
                  <span className="text-slate-800">{viewingProfile.permanentAddress}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Nơi tạm trú / Nơi ở hiện tại</span>
                  <span className="text-slate-800">{viewingProfile.temporaryAddress}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
                onClick={() => setViewingProfile(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="admin-primary-action text-xs"
                onClick={() => {
                  const p = viewingProfile;
                  setViewingProfile(null);
                  handleOpenEdit(p);
                }}
              >
                Chỉnh sửa thông tin
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Thêm mới / Chỉnh sửa hồ sơ công dân */}
      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title={editingProfile ? 'Chỉnh sửa hồ sơ công dân' : 'Thêm hồ sơ công dân mới'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số CCCD (12 chữ số) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="001092008128"
                  value={formData.identityNumber}
                  onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full h-10 px-3 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0912345678"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngày sinh *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giới tính *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' | 'Khác' })}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nơi thường trú *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Số nhà, đường phố, thôn/xóm, xã/phường, quận/huyện, tỉnh/TP"
                  value={formData.permanentAddress}
                  onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nơi tạm trú / Nơi ở hiện tại *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Địa chỉ đang cư trú thực tế"
                  value={formData.temporaryAddress}
                  onChange={(e) => setFormData({ ...formData, temporaryAddress: e.target.value })}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button type="submit" className="admin-primary-action text-xs">
                {editingProfile ? 'Cập nhật hồ sơ' : 'Lưu hồ sơ mới'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};
