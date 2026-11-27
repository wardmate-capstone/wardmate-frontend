import { useQuery } from '@tanstack/react-query';
import { X, Eye, ArrowRight } from '@phosphor-icons/react';
import { workflowApi, workflowError } from '@/lib/api/workflow';
import { useWardName } from '@/hooks/useWardName';
import type { OfficerApplication } from '@/types/officer';
import { parseFormData } from '@/lib/api/workflowAdapters';
import { useApplicationContents } from '@/hooks/useDocumentForms';
import { usePublicProcedureDetail } from '@/hooks/useProcedureCategories';
import { caseDisplayName } from '@/lib/procedureCases';

/**
 * Xem nhanh hồ sơ. Dòng danh sách không có giấy tờ, CCCD, SĐT, nên hộp tự tải chi tiết hồ sơ (cùng phường được đọc)
 * và liệt kê giấy tờ theo danh mục thủ tục kèm trạng thái đã nộp. Phường hiển thị bằng tên, không dùng mã nội bộ.
 */
export function OfficerQuickPreview({ app, canTake, onClose, onTake, onOpen }: {
  app: OfficerApplication;
  canTake: boolean;
  onClose: () => void;
  onTake: () => void;
  onOpen: () => void;
}) {
  const detail = useQuery({
    queryKey: ['workflow', 'officer-quick-preview', app.id],
    queryFn: () => workflowApi.getOfficerApplication(app.id),
    staleTime: 30_000,
    retry: false,
  });
  const wardName = useWardName();
  const form = parseFormData(detail.data?.formData);
  const text = (...keys: string[]) => keys.map((key) => form[key]).find((value) => typeof value === 'string' && value.trim()) as string | undefined;
  const citizenId = text('identityNumber', 'citizenId', 'cccd') ?? (app.citizen.citizenId !== '—' ? app.citizen.citizenId : undefined);
  const phone = text('phoneNumber', 'phone');
  const address = text('address', 'currentAddress', 'permanentAddress');
  const checklists = [...(detail.data?.checklists ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const submitted = (status?: string | null) => status === 'COMPLETED';
  // FE-04: checklist COMPLETED nhưng mọi tệp của mục đã mất khỏi kho (sự cố 20/11) → không ghi "Đã nộp".
  // Lỗi tải danh sách tệp thì giữ trạng thái theo checklist.
  const contents = useApplicationContents(app.id);
  const fileMissing = (checklistId: string) => {
    if (!contents.data) return false;
    const files = [...contents.data.submissions, ...contents.data.supportingDocuments].filter(f => f.checklistId?.toLowerCase() === checklistId.toLowerCase());
    return files.length > 0 && files.every(f => !f.fileExists);
  };
  // D: giấy tờ chỉ xuất trình (không gắn tờ khai) được hoàn tất khi công dân xác nhận mang bản chính, có thể không có tệp
  const presentWithoutFile = (item: (typeof checklists)[number]) => {
    if (item.submissionType !== 'XUAT_TRINH' || item.formTemplateId || item.forms?.some(f => f.formTemplateId) || !contents.data) return false;
    return ![...contents.data.submissions, ...contents.data.supportingDocuments].some(f => f.checklistId?.toLowerCase() === item.id.toLowerCase());
  };
  // WF-CASE-01: tên trường hợp lấy từ thủ tục công khai; thủ tục ẩn thì hiện mã
  const procedureQuery = usePublicProcedureDetail(detail.data?.caseCode ? detail.data.procedureId : undefined);
  const caseName = caseDisplayName(detail.data?.caseCode, procedureQuery.data?.contentPayload.cases);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="quick-preview-title">
      <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <Eye size={20} className="shrink-0 text-red-800" aria-hidden="true" />
            <h4 id="quick-preview-title" className="truncate text-[15px] font-semibold text-slate-950">Xem nhanh hồ sơ: {app.applicationNumber}</h4>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Đóng xem nhanh"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <span className="block text-[11px] font-semibold uppercase text-slate-500">Thông tin người gửi</span>
            <p><strong>Họ tên:</strong> {app.citizen.fullName}</p>
            <p><strong>CCCD:</strong> <span className="font-mono">{citizenId ?? '—'}</span></p>
            <p><strong>SĐT:</strong> {phone ?? '—'}</p>
            <p><strong>Địa chỉ:</strong> {address ?? '—'}</p>
          </div>
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <span className="block text-[11px] font-semibold uppercase text-slate-500">Thông tin thủ tục</span>
            <p><strong>Thủ tục:</strong> {app.procedureName}</p>
            <p><strong>Lĩnh vực:</strong> {app.procedureCategory}</p>
            {caseName && <p className="break-words"><strong>Trường hợp:</strong> {caseName}</p>}
            <p><strong>Phường/Xã tiếp nhận:</strong> {wardName(detail.data?.wardCode)}</p>
            <p><strong>Thời gian gửi:</strong> {app.submittedAt}</p>
            <p><strong>Lần gửi:</strong> {detail.data ? Math.max(1, (detail.data.resubmitCount ?? 0) + 1) : app.currentVersion}</p>
          </div>
        </div>

        <section aria-labelledby="quick-preview-docs" className="space-y-1.5">
          <h5 id="quick-preview-docs" className="text-[13px] font-semibold text-slate-800">Giấy tờ đã gửi</h5>
          {detail.isPending ? (
            <p className="text-[13px] text-slate-500" role="status">Đang tải danh mục giấy tờ…</p>
          ) : detail.isError ? (
            <p className="text-[13px] text-red-700" role="alert">Không tải được giấy tờ: {workflowError(detail.error)}</p>
          ) : checklists.length === 0 ? (
            <p className="text-[13px] text-slate-500">Thủ tục này không có danh mục giấy tờ.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
              {checklists.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-white p-2">
                  <span className="min-w-0 break-words">{item.title || 'Giấy tờ'}{item.isRequired ? '' : ' (không bắt buộc)'}</span>
                  {submitted(item.status) && presentWithoutFile(item) ? (
                    <span className="shrink-0 text-right text-xs font-semibold text-sky-800">Xuất trình tại quầy (chưa có tệp)</span>
                  ) : submitted(item.status) && fileMissing(item.id) ? (
                    <span className="shrink-0 text-right text-xs font-semibold text-amber-700">Tệp không còn trên hệ thống</span>
                  ) : (
                    <span className={`shrink-0 text-xs font-semibold ${submitted(item.status) ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {submitted(item.status) ? 'Đã nộp' : 'Chưa nộp'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button type="button" onClick={onClose} className="ws-row-btn">Đóng</button>
          <div className="flex flex-wrap items-center gap-2">
            {canTake && (
              <button type="button" onClick={onTake} className="ws-row-btn is-primary">Nhận xử lý ngay <ArrowRight size={14} aria-hidden="true" /></button>
            )}
            <button type="button" onClick={onOpen} className="ws-row-btn">Mở hồ sơ đầy đủ <ArrowRight size={14} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
