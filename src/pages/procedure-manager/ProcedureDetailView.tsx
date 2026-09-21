import React, { useState } from 'react';
import {
  ArrowLeft,
  PencilSimple,
  Prohibit,
  UploadSimple,
  CheckCircle,
  FileText,
  ListChecks,
  Path,
  Scales,
  ClockCounterClockwise,
  Info,
  WarningCircle,
  DownloadSimple,
  Plus,
  Eye,
  FileDoc,
  FilePdf
} from '@phosphor-icons/react';
import { ProcedureItem, ProcedureStatus, ProcedureForm } from '@/types/procedureManager';
import { CitizenFormFillWorkspaceModal } from './CitizenFormFillWorkspaceModal';

interface ProcedureDetailViewProps {
  procedure: ProcedureItem;
  onBack: () => void;
  onEdit: (procedure: ProcedureItem) => void;
  onStatusChange: (id: string, newStatus: ProcedureStatus) => void;
  onCreateNewVersion: (procedure: ProcedureItem) => void;
}

type DetailTab = 
  | 'overview'
  | 'conditions'
  | 'checklist'
  | 'steps'
  | 'forms'
  | 'legal'
  | 'history';

export const ProcedureDetailView: React.FC<ProcedureDetailViewProps> = ({
  procedure,
  onBack,
  onEdit,
  onStatusChange,
  onCreateNewVersion
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [activeCitizenModalForm, setActiveCitizenModalForm] = useState<ProcedureForm | null>(null);

  const tabs = [
    { id: 'overview' as DetailTab, label: 'Tổng quan', icon: Info },
    { id: 'conditions' as DetailTab, label: 'Điều kiện thực hiện', icon: CheckCircle, count: procedure.conditions.length },
    { id: 'checklist' as DetailTab, label: 'Thành phần hồ sơ', icon: ListChecks, count: procedure.checklistTemplates.length },
    { id: 'steps' as DetailTab, label: 'Quy trình thực hiện', icon: Path, count: procedure.steps.length },
    { id: 'forms' as DetailTab, label: 'Biểu mẫu Word/PDF', icon: FileText, count: procedure.forms.length },
    { id: 'legal' as DetailTab, label: 'Văn bản pháp lý', icon: Scales, count: procedure.legalDocuments.length },
    { id: 'history' as DetailTab, label: 'Lịch sử thay đổi', icon: ClockCounterClockwise }
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-red-800"
        >
          <ArrowLeft size={16} />
          <span>Danh sách thủ tục</span>
        </button>
        <span>/</span>
        <span className="font-mono text-slate-900">{procedure.code}</span>
      </div>

      {/* Main Header Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          {/* Left: Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-base font-extrabold text-red-900 sm:text-lg">
                {procedure.code}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                Phiên bản {procedure.version}
              </span>
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800">
                {procedure.categoryName}
              </span>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${
                  procedure.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : procedure.status === 'DRAFT'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {procedure.status === 'PUBLISHED'
                  ? '● Đang công khai'
                  : procedure.status === 'DRAFT'
                  ? '● Bản nháp'
                  : '● Ngừng công khai'}
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {procedure.title}
            </h2>

            <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
              {procedure.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
              <span>Cập nhật lần cuối: <strong>{procedure.updatedAt}</strong></span>
              <span>Người thực hiện: <strong>{procedure.updatedBy}</strong></span>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(procedure)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-red-900"
            >
              <PencilSimple size={16} weight="bold" />
              <span>Chỉnh sửa</span>
            </button>

            {procedure.status === 'PUBLISHED' ? (
              <button
                type="button"
                onClick={() => onStatusChange(procedure.id, 'UNPUBLISHED')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100"
              >
                <Prohibit size={16} weight="bold" />
                <span>Ngừng công khai</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusChange(procedure.id, 'PUBLISHED')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
              >
                <UploadSimple size={16} weight="bold" />
                <span>Xuất bản</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onCreateNewVersion(procedure)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              <ClockCounterClockwise size={16} weight="bold" />
              <span>Tạo phiên bản mới</span>
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all sm:text-sm ${
                  isActive
                    ? 'border-red-800 text-red-900 bg-red-50/50 rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`rounded-full px-2 py-0.2 text-[10px] ${
                      isActive ? 'bg-red-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab Content Panels */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Tab 1: Tổng quan */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Đối tượng thực hiện
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {procedure.targetAudience}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Cơ quan có thẩm quyền & Tiếp nhận
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {procedure.receivingAuthority}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Địa điểm: {procedure.receivingLocation}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Kết quả thực hiện
                  </span>
                  <p className="mt-1 text-sm font-bold text-red-900">
                    {procedure.resultDescription}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Thời gian giải quyết
                  </span>
                  <p className="mt-1 text-base font-extrabold text-slate-950">
                    {procedure.processingTimeDays === 0
                      ? 'Giải quyết ngay trong ngày làm việc'
                      : `${procedure.processingTimeDays} ngày làm việc`}
                  </p>
                  {procedure.workingHoursNotes && (
                    <p className="mt-1 text-xs text-slate-500">{procedure.workingHoursNotes}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Lệ phí thủ tục
                  </span>
                  <p className="mt-1 text-base font-extrabold text-slate-950">
                    {procedure.isFeeFree
                      ? 'Miễn lệ phí'
                      : `${procedure.feeAmount.toLocaleString('vi-VN')} VNĐ`}
                  </p>
                  {procedure.feeNotes && (
                    <p className="mt-1 text-xs text-slate-500">{procedure.feeNotes}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Mức độ số hóa nghiệp vụ
                  </span>
                  <div className="mt-2 space-y-1.5 text-xs font-semibold">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle size={16} weight="fill" />
                      <span>Checklist thành phần hồ sơ đầy đủ</span>
                    </div>
                    <div className={`flex items-center gap-2 ${procedure.hasForms ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {procedure.hasForms ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />}
                      <span>Biểu mẫu Word/PDF chuẩn: {procedure.hasForms ? 'Đã đính kèm đầy đủ' : 'Chưa gắn biểu mẫu'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700">
                      <CheckCircle size={16} weight="fill" />
                      <span>Hỗ trợ công dân mở sửa Word & xuất PDF tiền kiểm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Điều kiện thực hiện */}
        {activeTab === 'conditions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-950">
                Điều kiện thực hiện thủ tục ({procedure.conditions.length})
              </h3>
              <button
                type="button"
                onClick={() => onEdit(procedure)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                <Plus size={14} weight="bold" />
                <span>Thêm điều kiện</span>
              </button>
            </div>

            {procedure.conditions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">Chưa có điều kiện nào được cấu hình.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {procedure.conditions.map((cond) => (
                  <div key={cond.id} className="flex items-start gap-3 p-4">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-red-100 text-xs font-bold text-red-900">
                      {cond.order}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{cond.content}</p>
                      {cond.notes && (
                        <p className="mt-1 text-xs text-slate-500">Ghi chú: {cond.notes}</p>
                      )}
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {cond.isMandatory ? 'Bắt buộc' : 'Tùy chọn'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Thành phần hồ sơ (Checklist) */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-950">
                Danh mục Thành phần Hồ sơ (Checklist Template)
              </h3>
              <button
                type="button"
                onClick={() => onEdit(procedure)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                <Plus size={14} weight="bold" />
                <span>Thêm thành phần</span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {procedure.checklistTemplates.map((chk) => (
                <div key={chk.id} className="rounded-2xl border border-slate-200 p-4 transition-all hover:border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {chk.order}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        chk.isMandatory ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {chk.isMandatory ? 'Bắt buộc có' : 'Tùy chọn'}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-slate-950">{chk.documentName}</h4>
                  <p className="mt-1 text-xs text-slate-600">{chk.description}</p>
                  
                  <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 space-y-1">
                    <p>Cho phép upload: <strong>{chk.allowUpload ? `Có (Tối đa ${chk.maxFiles} file)` : 'Không'}</strong></p>
                    <p>Định dạng hỗ trợ: <strong>{chk.allowedFormats.join(', ').toUpperCase()}</strong></p>
                    <p className="text-slate-500">Hướng dẫn: {chk.instruction}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Quy trình thực hiện */}
        {activeTab === 'steps' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-950">
                Các bước Quy trình Thực hiện ({procedure.steps.length} bước)
              </h3>
              <button
                type="button"
                onClick={() => onEdit(procedure)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                <Plus size={14} weight="bold" />
                <span>Thêm bước quy trình</span>
              </button>
            </div>

            <div className="space-y-3">
              {procedure.steps.map((step) => (
                <div key={step.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-red-800 to-red-950 text-sm font-extrabold text-gold-300">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-950">{step.title}</h4>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {step.responsibleParty}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{step.description}</p>
                  </div>
                  {step.estimatedDuration && (
                    <span className="shrink-0 text-xs font-semibold text-slate-500">
                      {step.estimatedDuration}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Biểu mẫu Word/PDF */}
        {activeTab === 'forms' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Biểu mẫu Word & PDF chuẩn áp dụng ({procedure.forms.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Công dân có thể chỉnh sửa trực tiếp biểu mẫu Word trên trình duyệt hoặc tải về máy để nộp tiền kiểm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEdit(procedure)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                <Plus size={14} weight="bold" />
                <span>Thêm / Gắn biểu mẫu</span>
              </button>
            </div>

            {procedure.forms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <FileText size={36} className="mx-auto text-slate-300" />
                <p className="mt-2 text-xs font-bold text-slate-500">Thủ tục chưa được gắn biểu mẫu chuẩn nào.</p>
                <p className="mt-1 text-[11px] text-slate-400">Vui lòng tải lên file Word (.docx) hoặc PDF chuẩn từ Cổng Dịch vụ công.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {procedure.forms.map((form) => (
                  <div key={form.id} className="rounded-2xl border border-slate-200 p-5 transition-shadow hover:shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-red-900">{form.code}</span>
                          <span className="rounded-md bg-blue-100 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-800">
                            Phiên bản {form.currentVersion}
                          </span>
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            Đang áp dụng
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Hiệu lực từ {form.effectiveDate}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-950">{form.name}</h4>
                        {form.description && (
                          <p className="text-xs text-slate-600">{form.description}</p>
                        )}
                      </div>

                      {/* Citizen Experience Button */}
                      <button
                        type="button"
                        onClick={() => setActiveCitizenModalForm(form)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-800 to-red-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-red-900 hover:to-red-950"
                      >
                        <Eye size={15} weight="bold" />
                        <span>Mở soạn thảo (Citizen Editor & PDF)</span>
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileDoc size={20} className="shrink-0 text-blue-700" weight="fill" />
                          <div className="min-w-0">
                            <span className="block truncate font-bold text-slate-800">
                              {form.wordFileName || `${form.code}.docx`}
                            </span>
                            <span className="text-[10px] text-slate-500">Bản Word có thể chỉnh sửa</span>
                          </div>
                        </div>
                        <a
                          href={`#download-word-${form.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Bắt đầu tải file Word: ${form.wordFileName || form.code + '.docx'}`);
                          }}
                          className="rounded-lg p-1.5 text-blue-700 hover:bg-blue-100"
                          title="Tải file Word"
                        >
                          <DownloadSimple size={16} weight="bold" />
                        </a>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/40 p-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FilePdf size={20} className="shrink-0 text-red-700" weight="fill" />
                          <div className="min-w-0">
                            <span className="block truncate font-bold text-slate-800">
                              {form.pdfFileName || `${form.code}.pdf`}
                            </span>
                            <span className="text-[10px] text-slate-500">PDF mẫu chuẩn in ấn</span>
                          </div>
                        </div>
                        <a
                          href={`#download-pdf-${form.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Bắt đầu tải file PDF: ${form.pdfFileName || form.code + '.pdf'}`);
                          }}
                          className="rounded-lg p-1.5 text-red-700 hover:bg-red-100"
                          title="Tải file PDF"
                        >
                          <DownloadSimple size={16} weight="bold" />
                        </a>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={20} className="shrink-0 text-emerald-700" />
                          <div className="min-w-0">
                            <span className="block truncate font-bold text-slate-800">
                              {form.sampleFilledFileName || 'Chưa có mẫu điền'}
                            </span>
                            <span className="text-[10px] text-slate-500">Mẫu điền minh họa tham khảo</span>
                          </div>
                        </div>
                        {form.sampleFilledFileName ? (
                          <a
                            href={`#download-sample-${form.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              alert(`Bắt đầu tải file mẫu minh họa: ${form.sampleFilledFileName}`);
                            }}
                            className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100"
                            title="Tải mẫu minh họa"
                          >
                            <DownloadSimple size={16} weight="bold" />
                          </a>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Không</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Văn bản pháp lý */}
        {activeTab === 'legal' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-950">
                Văn bản Quy phạm Pháp luật liên kết ({procedure.legalDocuments.length})
              </h3>
              <button
                type="button"
                onClick={() => onEdit(procedure)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                <Plus size={14} weight="bold" />
                <span>Liên kết thêm văn bản</span>
              </button>
            </div>

            <div className="space-y-3">
              {procedure.legalDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-red-900">{doc.docNumber}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">{doc.docType}</span>
                      <span className="text-xs text-slate-400">Ban hành: {doc.issuedDate}</span>
                    </div>
                    <h4 className="mt-1 text-sm font-bold text-slate-950">{doc.title}</h4>
                    <p className="text-xs text-slate-500">Cơ quan ban hành: {doc.issuingAuthority}</p>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    Còn hiệu lực
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 8: Lịch sử thay đổi */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-950">
              Lịch sử Thay đổi & Nâng cấp Phiên bản
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div className="relative">
                <span className="absolute -left-6 top-1.5 size-3 rounded-full bg-red-800 ring-4 ring-white" />
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">Phiên bản V3 (Hiện hành)</span>
                    <span className="text-xs text-slate-500">21/09/2026</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    Cập nhật quy định mới về biểu mẫu và số hóa giấy chứng nhận kết hôn điện tử theo Thông tư mới.
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Người cập nhật: Lê Hoàng Nam</p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-6 top-1.5 size-3 rounded-full bg-slate-400 ring-4 ring-white" />
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">Phiên bản V2</span>
                    <span className="text-xs text-slate-500">01/01/2023</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    Bãi bỏ yêu cầu xuất trình Sổ hộ khẩu giấy theo Nghị định 104/2022/NĐ-CP.
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Người cập nhật: Nguyễn Thị Hải Yến</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Citizen Form Fill Workspace Experience Modal */}
      {activeCitizenModalForm && (
        <CitizenFormFillWorkspaceModal
          form={activeCitizenModalForm}
          procedureTitle={procedure.title}
          onClose={() => setActiveCitizenModalForm(null)}
        />
      )}
    </div>
  );
};
