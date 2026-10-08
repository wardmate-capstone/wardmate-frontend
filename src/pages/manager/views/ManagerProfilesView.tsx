import React, { useState } from 'react';
import {
  Plus,
  MagnifyingGlass,
  ArrowsClockwise,
  Trash,
} from '@phosphor-icons/react';
import { TableSkeletonRows } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { createFrontDeskAccount, authErrorMessage } from '@/lib/api';
import { ManagerProfileItem } from '../types';

interface ManagerProfilesViewProps {
  profiles: ManagerProfileItem[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onPageChange: (newPage: number) => void;
  onSaveProfile: (profile: ManagerProfileItem) => Promise<boolean | void> | void;
  onDeleteProfile?: (userId: string) => Promise<boolean | void> | void;
  onToggleStatus?: (profile: ManagerProfileItem) => Promise<boolean | void> | void;
  onSelectProfile?: (profile: ManagerProfileItem) => void;
  onFrontDeskCreated?: () => void;
}

export const ManagerProfilesView: React.FC<ManagerProfilesViewProps> = ({
  profiles,
  total,
  page,
  pageSize,
  isLoading = false,
  error = null,
  onRefresh,
  onPageChange,
  onSaveProfile,
  onDeleteProfile,
  onToggleStatus,
  onSelectProfile,
  onFrontDeskCreated,
}) => {
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Nam' | 'Nữ' | 'Khác'>('All');
  const [viewingProfile, setViewingProfile] = useState<ManagerProfileItem | null>(null);
  const [editingProfile, setEditingProfile] = useState<ManagerProfileItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);


  // Form state
  const [formData, setFormData] = useState<ManagerProfileItem>({
    userId: '',
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

  // Modal tạo cán bộ Một cửa (API 55)
  const [fdModalOpen, setFdModalOpen] = useState(false);
  const [fdSubmitting, setFdSubmitting] = useState(false);
  const [fdData, setFdData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
  });

  async function handleCreateFrontDesk(e: React.FormEvent) {
    e.preventDefault();
    if (!fdData.username.trim() || !fdData.email.trim() || !fdData.password.trim() || !fdData.fullName.trim()) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    setFdSubmitting(true);
    try {
      await createFrontDeskAccount({
        username: fdData.username.trim(),
        email: fdData.email.trim(),
        password: fdData.password,
        fullName: fdData.fullName.trim(),
        wardId: null, // Manager không cần truyền wardId, Backend tự lấy wardId của Manager
      });
      toast.success(`Đã tạo tài khoản cán bộ Một cửa cho ${fdData.fullName}.`);
      setFdModalOpen(false);
      setFdData({ username: '', email: '', password: '', fullName: '' });
      if (onFrontDeskCreated) onFrontDeskCreated();
      else if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setFdSubmitting(false);
    }
  }

  function handleOpenEdit(profile: ManagerProfileItem) {
    setEditingProfile(profile);
    setFormData(profile);
    setIsModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
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

    try {
      setIsSubmitting(true);
      await onSaveProfile(formData);
      setIsModalOpen(false);
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: ManagerProfileItem) {
    if (!item.userId || !onDeleteProfile) return;
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ công dân của ${item.fullName}? Hành động này sẽ xóa dữ liệu hồ sơ trên hệ thống.`);
    if (!confirmed) return;

    try {
      setDeletingId(item.userId);
      await onDeleteProfile(item.userId);
    } catch {
      // Handled in parent
    } finally {
      setDeletingId(null);
    }
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

          {onRefresh && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              onClick={onRefresh}
              disabled={isLoading}
              title="Tải lại dữ liệu từ máy chủ"
            >
              <ArrowsClockwise size={16} className={isLoading ? 'animate-spin text-red-800' : ''} />
              <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          )}

          <button
            type="button"
            className="admin-primary-action"
            onClick={() => setFdModalOpen(true)}
          >
            <Plus size={18} weight="bold" />
            <span>Thêm Cán bộ Một cửa</span>
          </button>
        </div>
      </div>

      {/* Error notification if any */}
      {error && (
        <div className="p-4 mx-4 my-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <strong className="block font-bold mb-0.5 text-amber-950">
              {error.includes('quyền') || error.includes('403') || error.includes('forbidden')
                ? 'Chưa phân bổ Phường công tác'
                : 'Thông báo từ máy chủ'}
            </strong>
            <p>
              {error.includes('quyền') || error.includes('403') || error.includes('forbidden')
                ? 'Tài khoản Lãnh đạo của bạn chưa được phân bổ Phường công tác trong hệ thống. Vui lòng liên hệ Quản trị viên hệ thống (Admin) để gán Phường trước khi quản lý cán bộ Một cửa.'
                : error}
            </p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="font-bold underline shrink-0 hover:text-amber-950"
            >
              Thử lại
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="min-w-[720px]">
          <thead>
            <tr>
              <th className="min-w-[170px] whitespace-nowrap">Họ và tên</th>
              <th className="min-w-[110px] whitespace-nowrap">Ngày sinh</th>
              <th className="min-w-[90px] whitespace-nowrap">Giới tính</th>
              <th className="min-w-[100px] whitespace-nowrap">Trạng thái</th>
              <th className="min-w-[240px] whitespace-nowrap text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && profiles.length === 0 ? (
              <TableSkeletonRows columns={5} />
            ) : filtered.map((item) => (
              <tr key={item.userId || item.identityNumber}>
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
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-red-900 bg-red-50/80 px-1.5 py-0.5 rounded border border-red-100/80 mt-0.5">
                        CCCD: {item.identityNumber}
                      </span>
                    </p>
                  </div>
                </td>
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
                <td>
                  <span
                    className={`admin-status-badge ${
                      item.isActive !== false ? 'is-success' : 'is-warning'
                    }`}
                  >
                    {item.isActive !== false ? 'Hoạt động' : 'Tạm khóa'}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-900 transition-colors"
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
                    {onToggleStatus && item.userId && (
                      <button
                        type="button"
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                          item.isActive !== false
                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                        }`}
                        title={item.isActive !== false ? 'Tạm khóa tài khoản cán bộ' : 'Kích hoạt tài khoản cán bộ'}
                        onClick={() => onToggleStatus(item)}
                      >
                        {item.isActive !== false ? 'Tạm khóa' : 'Kích hoạt'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => handleOpenEdit(item)}
                    >
                      Chỉnh sửa
                    </button>
                    {onDeleteProfile && item.userId && (
                      <button
                        type="button"
                        aria-label="Xóa hồ sơ"
                        title="Xóa hồ sơ cán bộ"
                        disabled={deletingId === item.userId}
                        className="rounded-lg border border-red-200 bg-white p-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-800 disabled:opacity-40 transition-colors"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="admin-empty p-8 text-center text-xs text-slate-500">
          Không tìm thấy cán bộ nào phù hợp với bộ lọc tìm kiếm.
        </p>
      )}

      {/* Pagination */}
      {!isLoading && Math.ceil(total / pageSize) > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4 text-xs text-slate-600">
          <span>
            Trang {page} / {Math.ceil(total / pageSize)} · Tổng cộng {total} cán bộ
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              ‹ Trước
            </button>
            <button
              type="button"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Sau ›
            </button>
          </div>
        </div>
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="admin-primary-action text-xs disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Đang lưu...'
                  : editingProfile
                  ? 'Cập nhật hồ sơ'
                  : 'Lưu hồ sơ mới'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal tạo tài khoản cán bộ Một cửa (API 55) */}
      {fdModalOpen && (
        <Modal
          open={fdModalOpen}
          onOpenChange={setFdModalOpen}
          title="Tạo tài khoản cán bộ Một cửa (Front Desk)"
        >
          <form onSubmit={handleCreateFrontDesk} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên cán bộ *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Trần Minh Hoàng"
                value={fdData.fullName}
                onChange={(e) => setFdData({ ...fdData, fullName: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên đăng nhập *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: hoang.tm"
                value={fdData.username}
                onChange={(e) => setFdData({ ...fdData, username: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email công vụ *
              </label>
              <input
                type="email"
                required
                placeholder="hoang.tm@phuong.gov.vn"
                value={fdData.email}
                onChange={(e) => setFdData({ ...fdData, email: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu khởi tạo * (ít nhất 8 ký tự, có chữ hoa & ký tự đặc biệt)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={fdData.password}
                onChange={(e) => setFdData({ ...fdData, password: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Cán bộ mới tạo sẽ tự động được gán vai trò FRONT_DESK_OFFICER và thuộc cùng phường công tác của bạn.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFdModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={fdSubmitting}
                className="admin-primary-action text-xs disabled:opacity-50"
              >
                {fdSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};
