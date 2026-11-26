import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Eye,
  NotePencil,
  Star,
  QrCode,
} from '@phosphor-icons/react';
import type { CitizenDossier, CitizenSectionId } from '../types';
import { getStatusBadgeClass, QR_ELIGIBLE_STATUSES } from '../types';
import { Button, RefreshButton, TableSkeletonRows, SearchInput, Select } from '@/components/ui';
import { matchesSearch } from '@/lib/utils';
import axios from 'axios';
import { usePublicProcedureDetail } from '@/hooks/useProcedureCategories';

/** FE-09: thủ tục đã ngừng công khai (API công khai trả 404) → nhắc ngay dưới tên thủ tục. Lỗi khác không hiện gì. */
function InactiveProcedureNote({ procedureId }: { procedureId?: string }) {
  const detail = usePublicProcedureDetail(procedureId);
  const inactive = detail.isError && axios.isAxiosError(detail.error) && detail.error.response?.status === 404;
  return inactive ? <small className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">Thủ tục đã ngừng áp dụng trên cổng</small> : null;
}

export interface CitizenInfiniteListProps {
  totalItems: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  isError?: boolean;
  onLoadMore: () => void;
}

interface CitizenDossiersViewProps {
  activeSection: CitizenSectionId;
  dossiers: CitizenDossier[];
  onOpenFeedback: (procedure: string, code?: string) => void;
  onSelectSection: (id: CitizenSectionId) => void;
  /** Mở trang Mã QR và chọn sẵn hồ sơ này */
  onOpenQr?: (dossierId: string) => void;
  onOpenDossierDetail: (dossier: CitizenDossier) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  infinite?: CitizenInfiniteListProps;
}

export function CitizenDossiersView({
  activeSection,
  dossiers,
  onOpenFeedback,
  onSelectSection,
  onOpenQr,
  onOpenDossierDetail,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  infinite,
}: CitizenDossiersViewProps) {
  // Cuộn tới cuối danh sách thì tự tải thêm hồ sơ
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(infinite?.onLoadMore);
  loadMoreRef.current = infinite?.onLoadMore;
  const canLoadMore = Boolean(infinite?.hasMore && !infinite.isError);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canLoadMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMoreRef.current?.();
    }, { rootMargin: '200px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, infinite?.isLoadingMore]);
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
      // Không phân biệt dấu: "khai tu" khớp "Khai tử".
      const matchSearch = matchesSearch(searchTerm, d.code, d.procedureName, d.field);
      return matchStatus && matchField && matchSearch;
    });
  }, [dossiers, targetStatus, selectedField, searchTerm]);

  const fields = [...new Set(dossiers.map(item => item.field).filter(Boolean))];
  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar">
        <SearchInput
          containerClassName="w-full max-w-lg"
          aria-label="Tìm hồ sơ"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Tìm theo mã hồ sơ, tên thủ tục..."
        />

        <div className="flex items-center gap-2">
          <Select
            aria-label="Lọc hồ sơ theo lĩnh vực"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="all">Tất cả lĩnh vực</option>
            {fields.map(field => <option key={field} value={field}>{field}</option>)}
          </Select>
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
            <RefreshButton onClick={onRefresh} loading={Boolean(isRefreshing || isLoading)} />
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
              <TableSkeletonRows
                columns={6}
                rows={6}
                columnWidths={['w-28 font-mono', 'w-56', 'w-28', 'w-24', 'w-48', 'ml-auto w-24']}
                lastCellClassName="text-right"
              />
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
                    <InactiveProcedureNote procedureId={item.procedureId} />
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
                      {/* Một nút mở chi tiết cho mọi trạng thái (trước đây hồ sơ cần chỉnh sửa có thêm nút "Chỉnh sửa" làm cùng việc);
                          hồ sơ cần bổ sung được tô vàng để nổi bật. */}
                      <button
                        type="button"
                        className={`ws-row-btn gap-1.5${item.status === 'Cần chỉnh sửa' ? ' is-attention' : ''}`}
                        onClick={() => onOpenDossierDetail(item)}
                        title={item.status === 'Cần chỉnh sửa' ? 'Mở hồ sơ để bổ sung, chỉnh sửa theo yêu cầu của cán bộ' : 'Xem chi tiết hồ sơ và danh mục giấy tờ cần chuẩn bị'}
                      >
                        {item.status === 'Cần chỉnh sửa' ? <NotePencil size={14} weight="bold" aria-hidden="true" /> : <Eye size={14} weight="bold" aria-hidden="true" />}
                        <span>Chi tiết</span>
                      </button>

                      {['Giấy tờ sẵn sàng', 'Đã tiếp nhận tại quầy'].includes(item.status) && (
                        <button
                          type="button"
                          className="ws-row-btn gap-1.5"
                          onClick={() => onOpenFeedback(item.procedureName, item.code)}
                          title="Đánh giá dịch vụ"
                        >
                          <Star size={14} weight="bold" aria-hidden="true" />
                          <span>Đánh giá</span>
                        </button>
                      )}

                      {/* Nút Xem mã QR: cùng các trạng thái có QR như Tổng quan (mục Mã QR đã bỏ khỏi menu) */}
                      {QR_ELIGIBLE_STATUSES.includes(item.status) && <button
                        type="button"
                        className="ws-row-btn gap-1.5"
                        onClick={() => (onOpenQr && item.id ? onOpenQr(item.id) : onSelectSection('qr_code'))}
                        title="Xem mã QR hồ sơ"
                      >
                        <QrCode size={14} weight="bold" />
                        <span>Mã QR</span>
                      </button>}
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

      {/* Cuộn vô hạn: điểm kích hoạt tải thêm + trạng thái */}
      {infinite && !isLoading && (
        <div ref={sentinelRef} className="flex flex-col items-center gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          {infinite.isLoadingMore ? (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-red-700 border-r-transparent" />
              Đang tải thêm hồ sơ…
            </span>
          ) : infinite.isError ? (
            <Button variant="outline" size="small" onClick={infinite.onLoadMore}>Tải thêm không thành công · Thử lại</Button>
          ) : infinite.hasMore ? (
            <Button variant="ghost" size="small" onClick={infinite.onLoadMore}>Tải thêm hồ sơ</Button>
          ) : null}
          <p role="status">
            {filteredDossiers.length !== dossiers.length ? (
              <>Có <strong className="font-semibold text-slate-800">{filteredDossiers.length}</strong> hồ sơ phù hợp trong <strong className="font-semibold text-slate-800">{dossiers.length}</strong> hồ sơ đã tải{infinite.hasMore && ' · Tải thêm để xem các hồ sơ cũ hơn'}</>
            ) : (
              <>Đã hiển thị <strong className="font-semibold text-slate-800">{dossiers.length}</strong> / <strong className="font-semibold text-slate-800">{infinite.totalItems}</strong> hồ sơ</>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
