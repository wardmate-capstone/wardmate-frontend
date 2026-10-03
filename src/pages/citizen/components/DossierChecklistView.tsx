import React, { useState, useId, useRef } from 'react';
import {
  CheckSquare,
  Square,
  Eye,
  PencilSimpleLine,
  DownloadSimple,
  UploadSimple,
  Trash,
  Image,
  FilePdf,
  WarningCircle,
  CheckCircle,
} from '@phosphor-icons/react';
import type { ProcedureCase, ChecklistItem } from '@/lib/procedureContent';
import { toast } from '@/components/ui/Toast';
import { DocumentPreviewModal } from './uploader/DocumentPreviewModal';

export interface UploadedDocFile {
  id: string;
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  url: string;
  uploadedAt: string;
}

interface DossierChecklistViewProps {
  procedureName: string;
  cases: ProcedureCase[];
  checklist: ChecklistItem[];
  dossierCode?: string;
  onDownloadForm?: (item: ChecklistItem) => void;
  onPreviewForm?: (item: ChecklistItem) => void;
  onEditForm?: (item: ChecklistItem) => void;
}

export const DossierChecklistView: React.FC<DossierChecklistViewProps> = ({
  procedureName,
  cases,
  checklist,
  dossierCode = 'DRAFT',
  onDownloadForm,
  onPreviewForm,
  onEditForm,
}) => {
  const [selectedCaseCode, setSelectedCaseCode] = useState<string>(() => {
    return cases.length > 0 ? cases[0].caseCode : '';
  });

  // State lưu trữ các tệp đã tải lên theo từng checklistId
  const [attachments, setAttachments] = useState<Record<string, UploadedDocFile[]>>(() => {
    const saved = localStorage.getItem(`wardmate_checklist_files_${dossierCode}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // State lưu trữ các giấy tờ mà người dân đã tích chọn "Đã chuẩn bị"
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`wardmate_checklist_checked_${dossierCode}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Preview file modal
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
    type: string;
    size?: string;
  } | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const formId = useId();

  // Xác định Case đang chọn
  const activeCase = cases.find((c) => c.caseCode === selectedCaseCode) || cases[0];

  // Lọc checklist theo trường hợp: những item có caseCode trùng hoặc item áp dụng chung
  const currentChecklist = checklist.filter((item) => {
    if (!item.caseCode) return true;
    if (!selectedCaseCode) return true;
    return item.caseCode === selectedCaseCode;
  });

  // Tách checklist thành 2 nhóm: Giấy tờ phải nộp & Giấy tờ phải xuất trình
  const nopItems = currentChecklist.filter((item) => item.submissionType === 'NOP');
  const xuatTrinhItems = currentChecklist.filter((item) => item.submissionType === 'XUAT_TRINH');

  // Tính toán tiến độ chuẩn bị hồ sơ (tự động tính khi đã check HOẶC đã có file tải lên)
  const isItemReady = (id: string) => {
    return !!checkedItems[id] || (attachments[id] && attachments[id].length > 0);
  };

  const totalMandatory = currentChecklist.filter((item) => item.isMandatory).length;
  const readyMandatory = currentChecklist.filter(
    (item) => item.isMandatory && isItemReady(item.checklistId)
  ).length;
  const progressPercent = totalMandatory > 0 ? Math.round((readyMandatory / totalMandatory) * 100) : 100;

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(`wardmate_checklist_checked_${dossierCode}`, JSON.stringify(next));
      return next;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Xử lý upload file cho từng dòng checklist
  const handleFileUpload = (checklistId: string, itemName: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newUploaded: UploadedDocFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Tệp "${file.name}" vượt quá dung lượng tối đa 10MB`);
        continue;
      }
      const blobUrl = URL.createObjectURL(file);
      newUploaded.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
        name: file.name,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        type: file.type,
        url: blobUrl,
        uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      });
    }

    if (newUploaded.length > 0) {
      setAttachments((prev) => {
        const next = { ...prev, [checklistId]: [...(prev[checklistId] || []), ...newUploaded] };
        localStorage.setItem(`wardmate_checklist_files_${dossierCode}`, JSON.stringify(next));
        return next;
      });

      // Tự động đánh dấu đã chuẩn bị
      setCheckedItems((prev) => {
        const next = { ...prev, [checklistId]: true };
        localStorage.setItem(`wardmate_checklist_checked_${dossierCode}`, JSON.stringify(next));
        return next;
      });

      toast.success(`Đã đính kèm ${newUploaded.length} tệp cho "${itemName}"`);
    }
  };

  const handleRemoveFile = (checklistId: string, fileId: string) => {
    setAttachments((prev) => {
      const nextList = (prev[checklistId] || []).filter((f) => f.id !== fileId);
      const next = { ...prev, [checklistId]: nextList };
      localStorage.setItem(`wardmate_checklist_files_${dossierCode}`, JSON.stringify(next));
      return next;
    });
  };

  // Render bảng danh mục giấy tờ kèm 3 nút thao tác biểu mẫu + Nút Upload đính kèm file
  const renderDocumentTable = (items: ChecklistItem[]) => {
    if (items.length === 0) {
      return (
        <div className="py-4 text-center text-sm text-slate-500 italic bg-slate-50/50 rounded-lg border border-slate-200">
          Không có giấy tờ nào trong danh mục này.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-xs uppercase tracking-wider">
              <th scope="col" className="w-10 py-2.5 px-2 text-center">Đạt</th>
              <th scope="col" className="w-10 py-2.5 px-2 text-center">STT</th>
              <th scope="col" className="py-2.5 px-4 min-w-[200px]">Tên giấy tờ</th>
              <th scope="col" className="py-2.5 px-3 w-24 text-center">Số lượng</th>
              <th scope="col" className="py-2.5 px-3 w-24 text-center">Yêu cầu</th>
              <th scope="col" className="py-2.5 px-4 min-w-[280px] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const itemFiles = attachments[item.checklistId] || [];
              const isChecked = isItemReady(item.checklistId);
              const isForm = !!(item.templateUrl || item.itemName.toLowerCase().includes('đơn') || item.itemName.toLowerCase().includes('tờ khai'));

              return (
                <tr
                  key={item.checklistId}
                  className={`transition-colors ${
                    isChecked ? 'bg-emerald-50/20' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Cột 1: Checkbox tự kiểm tra */}
                  <td className="py-3.5 px-3 text-center align-top pt-4">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => toggleCheck(item.checklistId)}
                      aria-label={`Đánh dấu đã chuẩn bị ${item.itemName}`}
                      className="inline-grid size-8 place-items-center rounded text-emerald-700 hover:bg-emerald-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      {isChecked ? (
                        <CheckSquare size={20} weight="fill" className="text-emerald-700" />
                      ) : (
                        <Square size={20} className="text-slate-400 hover:text-slate-600" />
                      )}
                    </button>
                  </td>

                  {/* Cột 2: Số thứ tự */}
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-500 tabular-nums align-top pt-4">
                    {idx + 1}
                  </td>

                  {/* Cột 3: Tên giấy tờ & File đã đính kèm */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="space-y-1.5">
                      <p className={`font-semibold text-sm leading-snug ${isChecked ? 'text-slate-900 font-bold' : 'text-slate-900'}`}>
                        {item.itemName}
                      </p>

                      {/* Hiển thị danh sách file đính kèm dưới tên giấy tờ */}
                      {itemFiles.length > 0 && (
                        <div className="pt-1.5 flex flex-wrap gap-2">
                          {itemFiles.map((file) => {
                            const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
                            return (
                              <div
                                key={file.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-900 shadow-2xs"
                              >
                                {isPdf ? (
                                  <FilePdf size={14} className="text-red-600 shrink-0" weight="bold" />
                                ) : (
                                  <Image size={14} className="text-blue-600 shrink-0" weight="bold" />
                                )}
                                <span className="truncate max-w-[130px]" title={file.name}>{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile({
                                    name: file.name,
                                    url: file.url,
                                    type: file.type,
                                    size: file.sizeFormatted,
                                  })}
                                  className="text-emerald-700 hover:text-emerald-950 p-0.5 ml-0.5"
                                  title="Xem trước"
                                >
                                  <Eye size={13} weight="bold" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(item.checklistId, file.id)}
                                  className="text-red-500 hover:text-red-700 p-0.5"
                                  title="Xóa tệp"
                                >
                                  <Trash size={13} weight="bold" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Cột 4: Số lượng */}
                  <td className="py-3.5 px-4 text-center align-top pt-4">
                    <div className="inline-block text-xs text-slate-700">
                      <span className="font-bold text-sm text-slate-900">{item.quantity}</span>{' '}
                      {item.documentCopyType === 'ORIGINAL' && (
                        <span className="font-semibold text-blue-700">bản chính</span>
                      )}
                      {item.documentCopyType === 'CERTIFIED_COPY' && (
                        <span className="font-semibold text-purple-700">bản sao</span>
                      )}
                      {item.documentCopyType === 'REGULAR_COPY' && (
                        <span className="text-slate-600">bản chụp</span>
                      )}
                    </div>
                  </td>

                  {/* Cột 5: Bắt buộc / Tùy chọn */}
                  <td className="py-3.5 px-4 text-center align-top pt-4">
                    {item.isMandatory ? (
                      <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                        Bắt buộc
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Tùy chọn
                      </span>
                    )}
                  </td>

                  {/* Cột 6: Thao tác & Đính kèm */}
                  <td className="py-3.5 px-4 text-right align-top pt-3">
                    <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                      {isForm && (
                        <>
                          {/* 1. Tải mẫu */}
                          <button
                            type="button"
                            onClick={() => onDownloadForm?.(item)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-red-800 transition-colors"
                            title="Tải mẫu văn bản .docx"
                          >
                            <DownloadSimple size={14} weight="bold" />
                            <span>Tải mẫu</span>
                          </button>

                          {/* 2. Xem trước mẫu */}
                          <button
                            type="button"
                            onClick={() => onPreviewForm?.(item)}
                            className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-xs font-semibold text-sky-800 shadow-2xs hover:bg-sky-100 transition-colors"
                            title={`Xem trước mẫu biểu ${procedureName}`}
                          >
                            <Eye size={14} weight="bold" />
                            <span>Xem trước</span>
                          </button>

                          {/* 3. Soạn thảo trực tuyến */}
                          <button
                            type="button"
                            onClick={() => onEditForm?.(item)}
                            className="inline-flex items-center gap-1 rounded-md bg-red-800 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-900 transition-colors"
                            title="Mở trình soạn thảo văn bản A4 trực tuyến"
                          >
                            <PencilSimpleLine size={14} weight="bold" />
                            <span>Soạn online</span>
                          </button>
                        </>
                      )}

                      {/* 3. Nút Đính kèm tệp / Tải ảnh CCCD / File có sẵn */}
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                        ref={(el) => {
                          fileInputRefs.current[item.checklistId] = el;
                        }}
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(item.checklistId, item.itemName, e.target.files)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[item.checklistId]?.click()}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-colors"
                        title="Tải lên ảnh chụp CCCD, file scan hoặc văn bản đã làm sẵn"
                      >
                        <UploadSimple size={14} weight="bold" />
                        <span>Đính kèm tệp</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Tabs trường hợp nếu có nhiều cases */}
      {cases.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4">
          <div id={`${formId}-cases-label`} className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Trường hợp áp dụng:
          </div>
          <div
            role="tablist"
            aria-labelledby={`${formId}-cases-label`}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
          >
            {cases.map((c) => {
              const isSelected = activeCase?.caseCode === c.caseCode;
              return (
                <button
                  key={c.caseCode}
                  type="button"
                  role="tab"
                  id={`tab-${c.caseCode}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${c.caseCode}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedCaseCode(c.caseCode)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-red-800 text-white shadow-xs ring-2 ring-red-800/20'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/40 hover:text-red-800'
                  }`}
                >
                  <span>{c.caseName}</span>
                </button>
              );
            })}
          </div>

          {/* Ghi chú điều kiện áp dụng của Case */}
          {activeCase?.description && (
            <div
              id={`panel-${activeCase.caseCode}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeCase.caseCode}`}
              className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-950"
            >
              <strong>Điều kiện áp dụng: </strong>
              <span>{activeCase.description}</span>
            </div>
          )}
        </div>
      )}

      {/* Thanh tiến độ chuẩn bị hồ sơ */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Tiến độ:
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({readyMandatory}/{totalMandatory} giấy tờ bắt buộc)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {progressPercent === 100 ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle size={14} weight="fill" /> Đủ điều kiện nộp
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Thiếu {totalMandatory - readyMandatory} mục bắt buộc
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                progressPercent === 100
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {progressPercent}%
            </span>
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-emerald-600' : 'bg-red-800'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* BẢNG 1: GIẤY TỜ PHẢI NỘP */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
          <span className="grid size-5 place-items-center rounded bg-red-800 text-xs font-bold text-white">
            1
          </span>
          <h4 className="text-sm font-bold text-slate-900">
            Giấy tờ phải nộp
          </h4>
          <span className="text-xs text-slate-400">
            ({nopItems.length})
          </span>
        </div>

        {renderDocumentTable(nopItems)}
      </div>

      {/* BẢNG 2: GIẤY TỜ PHẢI XUẤT TRÌNH */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
          <span className="grid size-5 place-items-center rounded bg-amber-600 text-xs font-bold text-white">
            2
          </span>
          <h4 className="text-sm font-bold text-slate-900">
            Giấy tờ phải xuất trình
          </h4>
          <span className="text-xs text-slate-400">
            ({xuatTrinhItems.length})
          </span>
        </div>

        {renderDocumentTable(xuatTrinhItems)}
      </div>

      {/* Ghi chú chân bảng */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600 flex items-start gap-2.5">
        <WarningCircle size={18} weight="fill" className="shrink-0 text-amber-700 mt-0.5" />
        <div>
          <strong>Lưu ý: </strong>
          Nếu thông tin giấy tờ đã có trong CSDL Quốc gia về dân cư hoặc đã định danh <strong>VNeID Mức 2</strong>, công dân không bắt buộc phải nộp bản sao giấy theo quy định Đề án 06.
        </div>
      </div>

      {/* Modal Preview File đính kèm */}
      <DocumentPreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};
