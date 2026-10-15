import { ArrowLeft, CheckCircle, WarningCircle, ArrowCounterClockwise, XCircle, Info, ChatText } from '@phosphor-icons/react';
import { DossierChecklistView } from '../components/DossierChecklistView';
import type { ChecklistItem } from '@/lib/procedureContent';
import type { CitizenDossier } from '../types';
import { getStatusBadgeClass } from '../types';
import { useApplicationComments } from '@/hooks/useWorkflow';

interface CitizenDossierDetailViewProps {
  dossier: CitizenDossier;
  onBack: () => void;
  onSubmitPrecheck: () => void;
  onResubmitPrecheck?: () => void;
  onDownloadForm: (item: ChecklistItem) => void;
  onPreviewForm: (item: ChecklistItem) => void;
  onEditForm: (item: ChecklistItem) => void;
  onUpdateChecklistItem?: (checklistId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED', fileName?: string) => Promise<void>;
  submitting?: boolean;
}

export function CitizenDossierDetailView({
  dossier,
  onBack,
  onSubmitPrecheck,
  onResubmitPrecheck,
  onDownloadForm,
  onPreviewForm,
  onEditForm,
  onUpdateChecklistItem,
  submitting = false,
}: CitizenDossierDetailViewProps) {
  const { data: comments, isLoading: loadingComments } = useApplicationComments(dossier.id, dossier.currentVersion);

  const openComments = comments?.filter((c) => c.status === 'OPEN') || [];
  const resolvedComments = comments?.filter((c) => c.status === 'RESOLVED') || [];

  return (
    <div className="space-y-6 admin-content-card">
      {/* Thông báo pháp lý bắt buộc */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-2xs flex items-start gap-3">
        <Info size={20} className="shrink-0 text-amber-700 mt-0.5" weight="fill" />
        <div className="space-y-1">
          <p className="font-bold">LƯU Ý PHÁP LÝ BẮT BUỘC</p>
          <p className="leading-relaxed">
            Hệ thống hỗ trợ chuẩn bị và <strong>tiền kiểm hồ sơ trực tuyến</strong> cấp Xã/Phường. Kết quả tiền kiểm giúp công dân rà soát giấy tờ và biểu mẫu trước khi đến cơ quan hành chính, <strong>không thay thế việc tiếp nhận hồ sơ chính thức</strong> tại Bộ phận một cửa UBND theo quy định của pháp luật.
          </p>
        </div>
      </div>

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
            {dossier.currentVersion && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                Phiên bản v{dossier.currentVersion}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {dossier.status === 'Bản nháp' && (
              <button
                type="button"
                onClick={onSubmitPrecheck}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-900 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle size={16} weight="bold" />
                <span>{submitting ? 'Đang gửi hồ sơ...' : 'Nộp tiền kiểm ngay'}</span>
              </button>
            )}

            {dossier.status === 'Cần chỉnh sửa' && onResubmitPrecheck && (
              <button
                type="button"
                onClick={onResubmitPrecheck}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-800 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <ArrowCounterClockwise size={16} weight="bold" />
                <span>{submitting ? 'Đang gửi lại...' : 'Gửi lại hồ sơ đã sửa'}</span>
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
            {dossier.wardCode && (
              <span>Địa bàn UBND: <strong className="text-slate-700">{dossier.wardCode}</strong></span>
            )}
            {dossier.officerName && (
              <span>Cán bộ phụ trách: <strong className="text-slate-700">{dossier.officerName}</strong></span>
            )}
          </div>
        </div>

        {/* Khối chúc mừng khi hồ sơ đã duyệt */}
        {dossier.status === 'Đã duyệt' && (
          <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950 shadow-2xs">
            <div className="flex items-start gap-3">
              <CheckCircle size={24} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-emerald-900">
                  Hồ sơ tiền kiểm trực tuyến đã được cán bộ Một cửa phê duyệt!
                </h3>
                <p className="text-xs leading-relaxed text-emerald-800">
                  Thành phần hồ sơ và tờ khai của Quý công dân đã được kiểm tra tính hợp lệ về mặt hình thức. 
                  Quý công dân vui lòng chuẩn bị đầy đủ các bản chính giấy tờ đã tải lên và đến Bộ phận một cửa UBND để nộp hồ sơ và hoàn tất thủ tục chính thức.
                </p>
                <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-emerald-900">
                  <span>Mã hồ sơ tra cứu tại quầy:</span>
                  <code className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-emerald-800">{dossier.code}</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Khối từ chối */}
        {dossier.status === 'Đã từ chối' && (
          <div className="mt-5 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-rose-950 shadow-2xs">
            <div className="flex items-start gap-3">
              <XCircle size={24} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-rose-900">
                  Hồ sơ tiền kiểm đã bị từ chối
                </h3>
                <p className="text-xs leading-relaxed text-rose-800">
                  {dossier.officerNote 
                    ? `Lý do từ chối: "${dossier.officerNote}"`
                    : 'Cán bộ Một cửa đã từ chối hồ sơ tiền kiểm này do không đáp ứng điều kiện theo quy định pháp luật.'}
                </p>
                <p className="text-xs text-rose-700">
                  Quý công dân có thể đối chiếu lại quy định thủ tục hoặc liên hệ trực tiếp UBND để được hướng dẫn chi tiết.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Khối ghi chú thông thường của cán bộ */}
        {dossier.officerNote && dossier.status !== 'Đã từ chối' && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-950 flex items-start gap-2.5">
            <span className="shrink-0 mt-0.5 font-bold text-amber-800">📌 Ghi chú cán bộ:</span>
            <span>{dossier.officerNote}</span>
          </div>
        )}
      </section>

      {/* Khối hiển thị chi tiết các nhận xét cần chỉnh sửa của cán bộ */}
      {dossier.status === 'Cần chỉnh sửa' && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm sm:text-base">
              <WarningCircle size={20} weight="fill" className="text-amber-700" />
              <span>Yêu cầu bổ sung & chỉnh sửa từ Cán bộ ({openComments.length} mục cần sửa)</span>
            </div>
            {dossier.currentVersion && (
              <span className="text-xs font-semibold text-amber-800">
                Phiên bản xét duyệt: v{dossier.currentVersion}
              </span>
            )}
          </div>

          {loadingComments ? (
            <p className="text-xs text-amber-800 italic">Đang tải danh sách ý kiến của cán bộ...</p>
          ) : openComments.length === 0 ? (
            <p className="text-xs text-amber-800">
              Cán bộ yêu cầu chỉnh sửa hồ sơ. Vui lòng rà soát lại ghi chú phía trên và các mục giấy tờ bên dưới trước khi bấm "Gửi lại hồ sơ đã sửa".
            </p>
          ) : (
            <div className="space-y-3">
              {openComments.map((comment, idx) => (
                <div
                  key={comment.id}
                  className="rounded-xl border border-amber-200 bg-white p-3.5 text-xs text-slate-800 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <ChatText size={16} className="text-amber-700" />
                      Mục #{idx + 1}: {comment.targetType === 'FORM_FIELD' ? 'Biểu mẫu kê khai' : 'Giấy tờ đính kèm'}
                      {comment.targetId && (
                        <code className="text-[11px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {comment.targetId}
                        </code>
                      )}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      Cần chỉnh sửa
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium pl-6">
                    {comment.commentText || 'Cán bộ chưa nhập nội dung ghi chú.'}
                  </p>
                  <div className="text-[10px] text-slate-400 pl-6">
                    Thời gian yêu cầu: {new Date(comment.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {resolvedComments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-amber-200">
              <span className="text-xs font-medium text-slate-600">
                ✓ {resolvedComments.length} ý kiến ở các phiên bản trước đã được xử lý xong.
              </span>
            </div>
          )}
        </section>
      )}

      {/* Danh mục thành phần hồ sơ và biểu mẫu */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Danh mục giấy tờ & biểu mẫu
          </h3>
          {onUpdateChecklistItem && dossier.checklist && dossier.checklist.length > 0 && dossier.status === 'Bản nháp' && (
            <button
              type="button"
              onClick={async () => {
                for (const item of dossier.checklist || []) {
                  await onUpdateChecklistItem(item.checklistId, 'COMPLETED');
                }
              }}
              className="text-xs font-semibold text-red-800 hover:text-red-900 transition-colors"
            >
              ✓ Đánh dấu đã chuẩn bị tất cả
            </button>
          )}
        </div>

        {dossier.checklist === undefined ? (
          <p role="status" className="text-xs text-slate-600">
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
            disabled={submitting}
            className="rounded-xl bg-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-900 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Đang gửi...' : 'Nộp tiền kiểm ngay'}
          </button>
        )}
        {dossier.status === 'Cần chỉnh sửa' && onResubmitPrecheck && (
          <button
            type="button"
            onClick={onResubmitPrecheck}
            disabled={submitting}
            className="rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-800 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Đang gửi lại...' : 'Gửi lại hồ sơ đã sửa'}
          </button>
        )}
      </section>
    </div>
  );
}
