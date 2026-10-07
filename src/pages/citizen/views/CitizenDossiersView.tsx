import { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  Funnel,
  Eye,
  NotePencil,
  Star,
  QrCode,
} from '@phosphor-icons/react';
import { toast } from '@/components/ui/Toast';
import type { CitizenDossier, CitizenSectionId } from '../types';
import { getStatusBadgeClass } from '../types';

interface CitizenDossiersViewProps {
  activeSection: CitizenSectionId;
  dossiers: CitizenDossier[];
  onOpenFeedback: (procedure: string, code?: string) => void;
  onSelectSection: (id: CitizenSectionId) => void;
  onOpenDossierDetail: (dossier: CitizenDossier) => void;
}

export function CitizenDossiersView({
  activeSection,
  dossiers,
  onOpenFeedback,
  onSelectSection,
  onOpenDossierDetail,
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
        return 'Đã duyệt';
      case 'dossiers_completed':
        return 'Đã hoàn thành';
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
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="all">Tất cả lĩnh vực</option>
            <option value="Hộ tịch">Hộ tịch</option>
            <option value="Chứng thực">Chứng thực</option>
            <option value="Địa chính">Địa chính</option>
          </select>
          <button
            type="button"
            onClick={() => toast.info('Đang hiển thị danh sách hồ sơ theo bộ lọc')}
          >
            <Funnel size={16} /> Lọc
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
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
            {filteredDossiers.map((item) => (
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
                        onClick={() => toast.info(`Mở giao diện bổ sung giấy tờ cho hồ sơ ${item.code}`)}
                        title="Bổ sung / Chỉnh sửa hồ sơ"
                      >
                        <NotePencil size={14} weight="bold" />
                        <span>Chỉnh sửa</span>
                      </button>
                    )}

                    {item.status === 'Đã hoàn thành' && (
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
            ))}
          </tbody>
        </table>
      </div>

      {filteredDossiers.length === 0 && (
        <p className="admin-empty">
          {targetStatus === 'ALL'
            ? 'Bạn chưa có hồ sơ nào trong mục này.'
            : `Không có hồ sơ nào ở trạng thái "${targetStatus}".`}
        </p>
      )}
    </section>
  );
}
