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
import type { Category } from '@/lib/api/procedures';
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
  search: string;
  onSearchChange: (value: string) => void;
  assignedCategory?: number;
  onAssignedCategoryChange: (value?: number) => void;
  categories: Category[];
  onAssignCategories: (profile: ManagerProfileItem, categories: number[]) => Promise<void>;
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
  search,
  onSearchChange,
  assignedCategory,
  onAssignedCategoryChange,
  categories,
  onAssignCategories,
  onDeleteProfile,
  onToggleStatus,
  onSelectProfile,
  onFrontDeskCreated,
}) => {
  const [query, setQuery] = useState(search);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryProfile, setCategoryProfile] = useState<ManagerProfileItem>();
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categorySubmitting, setCategorySubmitting] = useState(false);

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
        <form
          className="relative flex-1 min-w-[280px]"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchChange(query.trim());
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm họ tên, email hoặc số CCCD..."
            className="w-full h-11 pl-10 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <button type="submit" className="sr-only">Tìm kiếm</button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={assignedCategory ?? ''}
            onChange={(e) => onAssignedCategoryChange(e.target.value ? Number(e.target.value) : undefined)}
            className="h-11 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-800"
            aria-label="Lọc theo lĩnh vực phụ trách"
          >
            <option value="">Tất cả lĩnh vực</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.categoryName}</option>
            ))}
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
              <th className="min-w-[210px] whitespace-nowrap">Cán bộ</th>
              <th className="min-w-[220px] whitespace-nowrap">Đơn vị & lĩnh vực</th>
              <th className="min-w-[100px] whitespace-nowrap">Trạng thái</th>
              <th className="min-w-[240px] whitespace-nowrap text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && profiles.length === 0 ? (
              <TableSkeletonRows columns={5} />
            ) : profiles.map((item) => (
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
                      <span className="block text-[11px] text-slate-500">{item.email || `@${item.username}`}</span>
                      {item.identityNumber && <span className="block font-mono text-[11px] text-slate-500">CCCD: {item.identityNumber}</span>}
                    </p>
                  </div>
                </td>
                <td>
                  <strong className="block text-xs text-slate-800">{item.wardCode || 'Chưa gán phường'}</strong>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    {item.assignedCategories?.length
                      ? item.assignedCategories.map((id) => categories.find((category) => category.id === id)?.categoryName || `#${id}`).join(', ')
                      : 'Chưa phân công lĩnh vực'}
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
                        setCategoryProfile(item);
                        setSelectedCategories(item.assignedCategories ?? []);
                      }}
                    >
                      Phân công lĩnh vực
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-900 transition-colors"
                      onClick={() => {
                        if (onSelectProfile) {
                          onSelectProfile(item);
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

      {!isLoading && profiles.length === 0 && (
        <p className="admin-empty p-8 text-center text-xs text-slate-500">
          Không tìm thấy cán bộ nào phù hợp với bộ lọc tìm kiếm.
        </p>
      )}

      <Modal
        open={!!categoryProfile}
        onOpenChange={(open) => {
          if (!open && !categorySubmitting) setCategoryProfile(undefined);
        }}
        title="Phân công lĩnh vực phụ trách"
        description={`Chọn lĩnh vực hỗ trợ cho ${categoryProfile?.fullName ?? 'cán bộ'}. Danh sách này phục vụ tra cứu và phân công, không tự giới hạn hàng đợi hồ sơ.`}
        footer={
          <button
            type="button"
            disabled={categorySubmitting}
            className="admin-primary-action disabled:opacity-50"
            onClick={async () => {
              if (!categoryProfile) return;
              setCategorySubmitting(true);
              try {
                await onAssignCategories(categoryProfile, selectedCategories);
                setCategoryProfile(undefined);
              } finally {
                setCategorySubmitting(false);
              }
            }}
          >
            {categorySubmitting ? 'Đang lưu...' : 'Lưu phân công'}
          </button>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((category) => (
            <label key={category.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                disabled={categorySubmitting}
                onChange={(event) => setSelectedCategories((current) =>
                  event.target.checked ? [...current, category.id] : current.filter((id) => id !== category.id)
                )}
              />
              <span>{category.categoryName}</span>
            </label>
          ))}
          {!categories.length && <p className="text-sm text-slate-500">Chưa có danh mục thủ tục để phân công.</p>}
        </div>
      </Modal>

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
