import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { DossierChecklistView } from '../components/DossierChecklistView';
import type { ChecklistItem } from '@/lib/procedureContent';
import type { CitizenDossier } from '../types';
import { getStatusBadgeClass } from '../types';

interface CitizenDossierDetailViewProps {
  dossier: CitizenDossier;
  onBack: () => void;
  onSubmitPrecheck: () => void;
  onDownloadForm: (item: ChecklistItem) => void;
  onPreviewForm: (item: ChecklistItem) => void;
  onEditForm: (item: ChecklistItem) => void;
}

export function CitizenDossierDetailView({
  dossier,
  onBack,
  onSubmitPrecheck,
  onDownloadForm,
  onPreviewForm,
  onEditForm,
}: CitizenDossierDetailViewProps) {
  return (
    <div className="space-y-6 admin-content-card">
      {/* Thanh điều hướng quay lại & Thông tin tổng quát */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-red-900 transition-colors shadow-2xs"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Quay lại danh sách</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold text-red-900">
              Mã: {dossier.code}
            </span>
            <span className={`admin-status-badge ${getStatusBadgeClass(dossier.status)}`}>
              {dossier.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {dossier.status === 'Bản nháp' && dossier.checklist !== undefined && (
              <button
                type="button"
                onClick={onSubmitPrecheck}
                className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-900 transition-all active:scale-[0.98]"
              >
                <CheckCircle size={16} weight="bold" />
                <span>Nộp tiền kiểm ngay</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 mb-1">
            Lĩnh vực: {dossier.field}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {dossier.procedureName}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500">
            <span>Ngày khởi tạo: <strong className="text-slate-700">{dossier.createdAt}</strong></span>
            <span>Cập nhật gần nhất: <strong className="text-slate-700">{dossier.updatedAt}</strong></span>
            {dossier.officerName && (
              <span>Cán bộ phụ trách: <strong className="text-slate-700">{dossier.officerName}</strong></span>
            )}
          </div>
        </div>

        {dossier.officerNote && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-950 flex items-start gap-2.5">
            <span className="shrink-0 mt-0.5 font-bold text-amber-800">📌 Ghi chú cán bộ:</span>
            <span>{dossier.officerNote}</span>
          </div>
        )}
      </section>

      {/* Danh mục thành phần hồ sơ và biểu mẫu */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            Danh mục giấy tờ & biểu mẫu
          </h3>
        </div>

        {dossier.checklist === undefined ? (
          <p role="status">
            Chưa có danh mục giấy tờ được xác minh cho hồ sơ này. Cần kết nối dịch vụ Hồ sơ công dân với thủ tục trước khi chuẩn bị và nộp tiền kiểm.
          </p>
        ) : (
          <DossierChecklistView
            procedureName={dossier.procedureName}
            cases={dossier.cases || []}
            checklist={dossier.checklist || []}
            dossierCode={dossier.code}
            onDownloadForm={onDownloadForm}
            onPreviewForm={onPreviewForm}
            onEditForm={onEditForm}
          />
        )}
      </section>

      {/* Thanh hành động chân trang */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
        >
          Quay lại danh sách
        </button>
        {dossier.status === 'Bản nháp' && dossier.checklist !== undefined && (
          <button
            type="button"
            onClick={onSubmitPrecheck}
            className="rounded-xl bg-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-900 transition-all active:scale-[0.98]"
          >
            Nộp tiền kiểm ngay
          </button>
        )}
      </section>
    </div>
  );
}
