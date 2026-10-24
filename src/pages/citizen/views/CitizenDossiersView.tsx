import { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  Eye,
  NotePencil,
  Star,
  QrCode,
  ArrowClockwise,
} from '@phosphor-icons/react';
import type { CitizenDossier, CitizenSectionId } from '../types';
import { getStatusBadgeClass } from '../types';
import { Button, TableSkeletonRows } from '@/components/ui';

export interface CitizenPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  isFetching?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

interface CitizenDossiersViewProps {
  activeSection: CitizenSectionId;
  dossiers: CitizenDossier[];
  onOpenFeedback: (procedure: string, code?: string) => void;
  onSelectSection: (id: CitizenSectionId) => void;
  onOpenDossierDetail: (dossier: CitizenDossier) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  pagination?: CitizenPaginationProps;
}

export function CitizenDossiersView({
  activeSection,
  dossiers,
  onOpenFeedback,
  onSelectSection,
  onOpenDossierDetail,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  pagination,
}: CitizenDossiersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('all');

  // Map activeSection sang trạng thái lọc
  const targetStatus = useMemo(() => {
    switch (activeSection) {
      case 'dossiers_draft':
        return 'Bản nháp';
      case 'dossiers_pending':
        return 'Chờ tiền kiểm';
      case 'dossiers_need_revision':
        return 'Cần chỉnh sửa';
      case 'dossiers_resubmitted':
        return 'Đã gửi lại';
      case 'dossiers_approved':
        return 'Giấy tờ sẵn sàng';
      case 'dossiers_cancelled':
        return 'Đã hủy';
      default:
        return 'ALL';
    }
  }, [activeSection]);

  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      const matchStatus = targetStatus === 'ALL' || d.status === targetStatus;
      const matchField = selectedField === 'all' || d.field === selectedField;
      const matchSearch =
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.field.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchField && matchSearch;
    });
  }, [dossiers, targetStatus, selectedField, searchTerm]);

  const fields = [...new Set(dossiers.map(item => item.field).filter(Boolean))];
  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar">
        <label className="admin-search">
          <MagnifyingGlass size={18} />
          <span className="sr-only">Tìm hồ sơ</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã hồ sơ, tên thủ tục..."
          />
        </label>

        <div className="flex items-center gap-2">
          <select
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none hover:border-slate-300"
            aria-label="Lọc hồ sơ theo lĩnh vực"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="all">Tất cả lĩnh vực</option>
            {fields.map(field => <option key={field} value={field}>{field}</option>)}
          </select>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setSelectedField('all'); }}
            disabled={!searchTerm && selectedField === 'all'}
            className="h-11 shrink-0 whitespace-nowrap rounded-lg px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Hồ sơ tiền kiểm</span>
            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {isLoading ? 'Đang tải…' : `${filteredDossiers.length} hồ sơ`}
            </span>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing || isLoading}
              title="Làm mới danh sách hồ sơ (không cần F5)"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-1 disabled:opacity-60"
            >
              <ArrowClockwise size={14} className={isRefreshing || isLoading ? 'animate-spin text-red-700' : 'text-slate-500'} />
              <span>{isRefreshing || isLoading ? 'Đang tải…' : 'Làm mới'}</span>
            </button>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>Mã hồ sơ</th>
              <th>Thủ tục hành chính</th>
              <th>Thời gian cập nhật</th>
              <th>Trạng thái</th>
              <th>Ghi chú cán bộ</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows columns={6} rows={6} />
            ) : (
              filteredDossiers.map((item) => (
                <tr key={item.code}>
                  <td>
                    <strong className="text-slate-900">{item.code}</strong>
                    <small className="block text-[10px] text-slate-400">Tạo: {item.createdAt}</small>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-900">{item.procedureName}</span>
                    <small className="block text-[11px] text-slate-500">Lĩnh vực: {item.field}</small>
                  </td>
                  <td>{item.updatedAt}</td>
                  <td>
                    <span className={`admin-status-badge ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="max-w-[320px]">
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2" title={item.officerNote}>
                      {item.officerNote || '—'}
                    </p>
                    {item.officerName && (
                      <small className="block text-[10px] text-slate-400 mt-0.5 truncate">Cán bộ: {item.officerName}</small>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Nút Xem chi tiết hồ sơ */}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-red-900 active:scale-95"
                        onClick={() => onOpenDossierDetail(item)}
                        title="Xem chi tiết hồ sơ và danh mục giấy tờ cần chuẩn bị"
                      >
                        <Eye size={14} weight="bold" />
                        <span>Chi tiết</span>
                      </button>

                      {item.status === 'Cần chỉnh sửa' && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition-all hover:bg-amber-100 active:scale-95"
                          onClick={() => onOpenDossierDetail(item)}
                          title="Bổ sung / Chỉnh sửa hồ sơ"
                        >
                          <NotePencil size={14} weight="bold" />
                          <span>Chỉnh sửa</span>
                        </button>
                      )}

                      {['Giấy tờ sẵn sàng', 'Đã tiếp nhận tại quầy'].includes(item.status) && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
                          onClick={() => onOpenFeedback(item.procedureName, item.code)}
                          title="Đánh giá dịch vụ"
                        >
                          <Star size={14} weight="bold" />
                          <span>Đánh giá</span>
                        </button>
                      )}

                      {/* Nút Xem mã QR */}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-800 active:scale-95"
                        onClick={() => onSelectSection('qr_code')}
                        title="Xem mã QR hồ sơ"
                      >
                        <QrCode size={14} weight="bold" />
                        <span>Mã QR</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredDossiers.length === 0 && (
        <p className="admin-empty">
          {targetStatus === 'ALL'
            ? 'Bạn chưa có hồ sơ nào trong mục này.'
            : `Không có hồ sơ nào ở trạng thái "${targetStatus}".`}
        </p>
      )}

      {/* Bottom Pagination Footer */}
      {pagination && (
        <nav
          aria-label="Phân trang danh sách hồ sơ"
          className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50/70 px-5 py-3 gap-3"
        >
          <div className="text-xs text-slate-600">
            Trang <strong className="font-semibold text-slate-900">{pagination.currentPage}</strong> · <strong className="font-semibold text-slate-900">{pagination.totalItems}</strong> hồ sơ. Bộ lọc áp dụng trên trang hiện tại.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="small"
              disabled={pagination.currentPage <= 1 || pagination.isFetching}
              onClick={pagination.onPrevPage}
            >
              Trang trước
            </Button>
            <span className="text-xs font-semibold px-2 text-slate-700">
              Trang {pagination.currentPage}
            </span>
            <Button
              variant="outline"
              size="small"
              disabled={pagination.isFetching || pagination.currentPage * pagination.pageSize >= pagination.totalItems}
              onClick={pagination.onNextPage}
            >
              Trang sau
            </Button>
          </div>
        </nav>
      )}
    </section>
  );
}
