import React from 'react';
import {
  Files,
  FileDashed,
  Prohibit,
  FileText,
  ArrowsClockwise,
  Scales,
  WarningCircle,
  ArrowRight,
  Plus,
  Sparkle,
  ArrowUpRight
} from '@phosphor-icons/react';
import { ProcedureItem, ProcedureForm } from '@/types/procedureManager';
import { mockProcedures, mockForms, mockLegalDocuments, mockProcedureStats } from '@/data/mockProcedureManagerData';
import { ProcedureNavSection } from './ProcedureManagerSidebar';

interface ProcedureDashboardViewProps {
  onNavigateSection: (section: ProcedureNavSection) => void;
  onSelectProcedure: (procedure: ProcedureItem) => void;
  onOpenCreateWizard: () => void;
}

export const ProcedureDashboardView: React.FC<ProcedureDashboardViewProps> = ({
  onNavigateSection,
  onSelectProcedure,
  onOpenCreateWizard
}) => {
  const stats = mockProcedureStats;

  // Procedures missing items
  const proceduresWithoutForms = mockProcedures.filter(p => !p.hasForms);
  const proceduresIncompleteChecklist = mockProcedures.filter(p => !p.isChecklistComplete);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Top Banner with Quick Actions */}
      <section className="relative overflow-hidden rounded-3xl border border-red-900/20 bg-gradient-to-r from-red-900 via-red-950 to-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold-300 backdrop-blur-md">
              <Sparkle size={14} weight="fill" />
              <span>Cổng Chuẩn hóa Nghiệp vụ Một cửa Cấp Xã / Phường</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Hệ thống Quản lý Thủ tục & Chuẩn hóa Biểu mẫu
            </h2>
            <p className="text-sm leading-relaxed text-red-100/80">
              Quản lý trọn vòng đời thủ tục hành chính, cấu hình checklist tiền kiểm, số hóa E-form nhập liệu và đồng bộ cơ sở tri thức pháp lý cho toàn phường.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenCreateWizard}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-sm font-extrabold text-red-950 shadow-md transition-transform hover:-translate-y-0.5 hover:bg-gold-300"
            >
              <Plus size={18} weight="bold" />
              <span>Thêm thủ tục mới</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('upload-form')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20"
            >
              <span>Upload biểu mẫu Word/PDF</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-16 -top-24 size-96 rounded-full bg-red-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-24 size-80 rounded-full bg-gold-400/10 blur-3xl" />
      </section>

      {/* 6 Metric Overview Cards */}
      <section aria-label="Các chỉ số tổng quan">
        <h3 className="sr-only">Chỉ số tổng quan</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Thủ tục đang công khai */}
          <div
            onClick={() => onNavigateSection('procedures')}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Đang công khai</span>
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-800 transition-transform group-hover:scale-110">
                <Files size={18} weight="duotone" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {stats.publishedCount}
            </p>
            <span className="mt-1 block text-[11px] font-semibold text-emerald-700">
              ● Sẵn sàng phục vụ người dân
            </span>
          </div>

          {/* 2. Thủ tục bản nháp */}
          <div
            onClick={() => onNavigateSection('procedures')}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Bản nháp</span>
              <div className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-800 transition-transform group-hover:scale-110">
                <FileDashed size={18} weight="duotone" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {stats.draftCount}
            </p>
            <span className="mt-1 block text-[11px] font-semibold text-amber-700">
              Đang hoàn thiện nội dung
            </span>
          </div>

          {/* 3. Thủ tục tạm ngừng */}
          <div
            onClick={() => onNavigateSection('procedures')}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-rose-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Tạm ngừng</span>
              <div className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-800 transition-transform group-hover:scale-110">
                <Prohibit size={18} weight="duotone" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {stats.pausedCount}
            </p>
            <span className="mt-1 block text-[11px] font-semibold text-rose-700">
              Chờ văn bản mới
            </span>
          </div>

          {/* 4. Biểu mẫu đang sử dụng */}
          <div
            onClick={() => onNavigateSection('forms')}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Biểu mẫu</span>
              <div className="grid size-9 place-items-center rounded-xl bg-blue-100 text-blue-800 transition-transform group-hover:scale-110">
                <FileText size={18} weight="duotone" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {stats.activeFormsCount}
            </p>
            <span className="mt-1 block text-[11px] font-semibold text-blue-700">
              Đang áp dụng chính thức
            </span>
          </div>

          {/* 5. Biểu mẫu cần cập nhật */}
          <div
            onClick={() => onNavigateSection('form-versions')}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-purple-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Cần cập nhật</span>
              <div className="grid size-9 place-items-center rounded-xl bg-purple-100 text-purple-800 transition-transform group-hover:scale-110">
                <ArrowsClockwise size={18} weight="duotone" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {stats.formsNeedUpdateCount}
            </p>
            <span className="mt-1 block text-[11px] font-semibold text-purple-700">
              Mẫu biểu theo luật mới
            </span>
          </div>

          {/* 6. Văn bản pháp lý */}
          <div
            onClick={() => onNavigateSection('legal-docs')}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Văn bản pháp lý</span>
              <div className="grid size-9 place-items-center rounded-xl bg-indigo-100 text-indigo-800 transition-transform group-hover:scale-110">
                <Scales size={18} weight="duotone" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {stats.legalDocsCount}
            </p>
            <span className="mt-1 block text-[11px] font-semibold text-indigo-700">
              Căn cứ pháp lý hiệu lực
            </span>
          </div>
        </div>
      </section>

      {/* Warning / Needs Attention Section */}
      <section className="rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/70 to-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
              <WarningCircle size={20} weight="fill" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Hạng mục cần chú ý hoàn thiện
              </h3>
              <p className="text-xs text-slate-600">
                Các thủ tục chưa đạt chuẩn số hóa hoặc thiếu biểu mẫu đính kèm cần xử lý
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {/* Card 1: Chưa có biểu mẫu */}
          <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Thủ tục chưa có biểu mẫu</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
                {proceduresWithoutForms.length} thủ tục
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {proceduresWithoutForms.slice(0, 2).map((proc) => (
                <li
                  key={proc.id}
                  onClick={() => onSelectProcedure(proc)}
                  className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-2 text-xs font-medium text-slate-800 transition-colors hover:bg-red-50 hover:text-red-900"
                >
                  <span className="truncate pr-2">{proc.code} - {proc.title}</span>
                  <ArrowRight size={14} className="shrink-0 text-slate-400" />
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Biểu mẫu cần cập nhật phiên bản */}
          <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Biểu mẫu cần cập nhật</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
                {stats.formsNeedUpdateCount} mẫu biểu
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Có {stats.formsNeedUpdateCount} mẫu Word cần rà soát lại quy chuẩn và ngày hiệu lực theo nghị định mới.
            </p>
            <button
              type="button"
              onClick={() => onNavigateSection('form-versions')}
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red-800 hover:underline"
            >
              <span>Kiểm tra phiên bản</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Card 3: Chưa đủ Checklist */}
          <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Chưa đủ Checklist</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
                {proceduresIncompleteChecklist.length} thủ tục
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {proceduresIncompleteChecklist.slice(0, 2).map((proc) => (
                <li
                  key={proc.id}
                  onClick={() => onSelectProcedure(proc)}
                  className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-2 text-xs font-medium text-slate-800 transition-colors hover:bg-red-50 hover:text-red-900"
                >
                  <span className="truncate pr-2">{proc.code} - {proc.title}</span>
                  <ArrowRight size={14} className="shrink-0 text-slate-400" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 2-Column Tables: Thủ tục gần đây & Văn bản pháp lý mới */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Column 1: Thủ tục cập nhật gần đây */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Thủ tục cập nhật gần đây
              </h3>
              <p className="text-xs text-slate-500">Các thủ tục vừa sửa đổi hoặc chuyển trạng thái</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('procedures')}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-800 hover:underline"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {mockProcedures.slice(0, 4).map((proc) => (
              <div
                key={proc.id}
                onClick={() => onSelectProcedure(proc)}
                className="group flex cursor-pointer items-center justify-between py-3.5 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {proc.code}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {proc.version}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        proc.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : proc.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {proc.status === 'PUBLISHED'
                        ? 'Đang công khai'
                        : proc.status === 'DRAFT'
                        ? 'Bản nháp'
                        : 'Tạm ngừng'}
                    </span>
                  </div>
                  <h4 className="mt-1 truncate text-sm font-bold text-slate-950 group-hover:text-red-800">
                    {proc.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Lĩnh vực: {proc.categoryName} · Cập nhật: {proc.updatedAt}
                  </p>
                </div>
                <ArrowUpRight size={18} className="shrink-0 text-slate-300 transition-colors group-hover:text-red-800" />
              </div>
            ))}
          </div>
        </section>

        {/* Column 2: Văn bản pháp lý mới & Biểu mẫu */}
        <section className="space-y-6">
          {/* Biểu mẫu cập nhật gần đây */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Biểu mẫu cập nhật gần đây
                </h3>
                <p className="text-xs text-slate-500">Mẫu biểu đang áp dụng kèm phiên bản</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateSection('forms')}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-800 hover:underline"
              >
                <span>Xem kho mẫu</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {mockForms.slice(0, 3).map((form: ProcedureForm) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{form.code}</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {form.currentVersion}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-slate-950">{form.name}</p>
                    <p className="text-[11px] text-slate-500">Áp dụng cho: {form.procedureName}</p>
                  </div>
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                    Đang dùng
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Văn bản pháp lý mới */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Văn bản pháp lý làm căn cứ
                </h3>
                <p className="text-xs text-slate-500">Nghị định, Thông tư điều chỉnh nghiệp vụ</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateSection('legal-docs')}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-800 hover:underline"
              >
                <span>Xem tất cả</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {mockLegalDocuments.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-red-900">{doc.docNumber}</span>
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        {doc.docType}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs font-bold text-slate-900">{doc.title}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {doc.linkedProcedureCount} thủ tục
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
