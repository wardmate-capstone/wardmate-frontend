import { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Button, Modal, Skeleton } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { Eye, DownloadSimple } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { DocxPreview } from './DocxPreview';
import { downloadFormTemplateDocx, formTemplateErrorMessage, getFormTemplateById, triggerFileDownload } from '@/lib/api/formTemplates';

/** Trang công khai chỉ xem/tải phôi mẫu đang hoạt động qua API. */
/** FE-13: bản ghi mẫu còn đường dẫn tệp nhưng tệp Word đã mất khỏi kho (404 khi tải). */
const isTemplateFileMissing = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404;
const TEMPLATE_FILE_MISSING = 'Tệp mẫu không còn trên hệ thống, vui lòng tải lên lại.';

export function FormTemplateActions({ templateId, name, hasFile, managementAction, publicAccess = false, previewOnly = false, onReupload }: {
  publicAccess?: boolean;
  /** Người quản lý mẫu: hiện nút "Thay đổi" khi tệp mẫu đã mất (đóng xem trước rồi mở hộp tải lên) */
  onReupload?: () => void;
  /** Chỉ hiện nút "Xem" (dùng trong bảng chọn gọn); tải mẫu vẫn có trong hộp thoại xem trước */
  previewOnly?: boolean;
  templateId?: string | null;
  name: string;
  hasFile?: boolean;
  managementAction?: ReactNode;
}) {
  const user = useAuthStore(s => s.user);
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const detail = useQuery({
    queryKey: ['form-templates', user?.id, publicAccess, 'detail', templateId],
    queryFn: ({ signal }) => getFormTemplateById(templateId!, signal, publicAccess),
    enabled: Boolean((publicAccess || user) && templateId && open),
  });
  const preview = useQuery({
    queryKey: ['form-templates', user?.id, publicAccess, 'preview', templateId, detail.data?.updatedAtUtc, detail.data?.fileDocxUrl],
    queryFn: ({ signal }) => downloadFormTemplateDocx(templateId!, signal, publicAccess),
    enabled: Boolean((publicAccess || user) && templateId && open && detail.data?.isActive && detail.data.fileDocxUrl),
    gcTime: 0,
    staleTime: 0,
  });
  if (!templateId) return <span className="text-sm text-slate-500">Chưa liên kết mẫu Word.</span>;
  const download = async () => {
    if (downloading) return;
    setDownloading(true); setDownloadError('');
    try {
      const template = await getFormTemplateById(templateId, undefined, publicAccess);
      if (!template.isActive || !template.fileDocxUrl) {
        setDownloadError(template.isActive ? 'Biểu mẫu chưa có tệp Word. Vui lòng thử lại sau.' : 'Biểu mẫu đã tạm ngừng cung cấp.'); return;
      }
      const file = await downloadFormTemplateDocx(templateId, undefined, publicAccess);
      triggerFileDownload(file.blob, file.fileName);
    } catch (error) {
      const message = isTemplateFileMissing(error) ? TEMPLATE_FILE_MISSING : formTemplateErrorMessage(error);
      setDownloadError(message); toast.error(message);
    } finally { setDownloading(false); }
  };
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      {/* Mẫu chưa có tệp: không hiện nút Xem mẫu (L25). */}
      {hasFile !== false && <Button size="small" variant="outline" className="gap-1.5 rounded-lg px-3 shadow-none hover:translate-y-0" onClick={() => setOpen(true)} aria-label={`Xem mẫu ${name}`}><Eye size={16} aria-hidden />Xem mẫu</Button>}
      {hasFile !== false && !previewOnly && <Button size="small" variant="outline" className="gap-1.5 rounded-lg px-3 shadow-none hover:translate-y-0" loading={downloading} onClick={() => void download()} aria-label={`Tải mẫu ${name}`}><DownloadSimple size={16} aria-hidden />Tải mẫu</Button>}
      {managementAction}
    </div>
    {downloadError && !open && <p role="alert" className="text-sm text-red-800">{downloadError}</p>}
    <Modal open={open} onOpenChange={setOpen} title={`Biểu mẫu: ${name}`} description="Xem trước nội dung biểu mẫu Word gốc." className="sm:max-w-6xl sm:max-h-[92dvh]" footer={detail.data?.fileDocxUrl && detail.data.isActive ? <Button loading={downloading} onClick={() => void download()}><DownloadSimple size={18} aria-hidden />Tải mẫu Word</Button> : undefined}>
      {downloadError && <p role="alert" className="mb-3 text-sm text-red-800">{downloadError}</p>}
      {detail.isPending ? (
        <div role="status" aria-label="Đang tải thông tin mẫu" className="space-y-3 py-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : detail.isError ? <div role="alert"><p>{formTemplateErrorMessage(detail.error)}</p><Button variant="outline" onClick={() => void detail.refetch()}>Thử lại</Button></div> : detail.data && <div className="space-y-4">
        <p className="font-semibold">{detail.data.code} · {detail.data.title}</p>
        <p>{!detail.data.isActive ? 'Đã tạm ngừng cung cấp.' : detail.data.fileDocxUrl ? 'Đã có mẫu Word.' : 'Chưa có tệp Word.'}</p>
        {detail.data.isActive && detail.data.fileDocxUrl && (preview.isPending ? (
          <div role="status" aria-label="Đang tải nội dung biểu mẫu" className="py-2">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : preview.isError ? (isTemplateFileMissing(preview.error)
          ? <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p>{TEMPLATE_FILE_MISSING}</p>{onReupload && <Button variant="outline" size="small" onClick={() => { setOpen(false); onReupload(); }}>Thay đổi</Button>}</div>
          : <div role="alert" className="space-y-2 text-sm text-red-800"><p>{formTemplateErrorMessage(preview.error)}</p><Button variant="outline" size="small" onClick={() => void preview.refetch()}>Thử lại</Button></div>) : <DocxPreview key={preview.data.blob.size + ':' + preview.dataUpdatedAt} blob={preview.data.blob} />)}
      </div>}
    </Modal>
  </div>;
}
