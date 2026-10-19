import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { Button, Modal, Skeleton } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { safeReturnTo } from '@/lib/authRedirect';
import { Eye, DownloadSimple } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { DocxPreview } from './DocxPreview';
import { downloadFormTemplateDocx, formTemplateErrorMessage, getFormTemplateById, triggerFileDownload } from '@/lib/api/formTemplates';

/** Tải phôi qua API có xác thực, không mở trực tiếp Blob URL. */
export function FormTemplateActions({ templateId, name, hasFile, managementAction }: {
  templateId?: string | null;
  name: string;
  hasFile?: boolean;
  managementAction?: ReactNode;
}) {
  const user = useAuthStore(s => s.user);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const detail = useQuery({
    queryKey: ['form-templates', user?.id, 'detail', templateId],
    queryFn: ({ signal }) => getFormTemplateById(templateId!, signal),
    enabled: Boolean(user && templateId && open),
  });
  const preview = useQuery({
    queryKey: ['form-templates', user?.id, 'preview', templateId, detail.data?.updatedAtUtc, detail.data?.fileDocxUrl],
    queryFn: ({ signal }) => downloadFormTemplateDocx(templateId!, signal),
    enabled: Boolean(user && templateId && open && detail.data?.isActive && detail.data.fileDocxUrl),
    gcTime: 0,
    staleTime: 0,
  });
  if (!templateId) return <span className="text-sm text-slate-500">Chưa liên kết mẫu Word.</span>;
  if (!user) return <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-red-800 underline" to={'/dang-nhap?' + new URLSearchParams({ returnTo: safeReturnTo(location.pathname + location.search) })}>Đăng nhập để tải mẫu</Link>;
  const download = async () => {
    if (downloading) return;
    setDownloading(true); setDownloadError('');
    try {
      const template = await getFormTemplateById(templateId);
      if (!template.isActive || !template.fileDocxUrl) {
        setDownloadError(template.isActive ? 'Biểu mẫu chưa có tệp Word. Vui lòng thử lại sau.' : 'Biểu mẫu đã tạm ngừng cung cấp.'); return;
      }
      const file = await downloadFormTemplateDocx(templateId);
      triggerFileDownload(file.blob, file.fileName);
    } catch (error) {
      const message = formTemplateErrorMessage(error);
      setDownloadError(message); toast.error(message);
    } finally { setDownloading(false); }
  };
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <Button size="small" variant="outline" className="gap-1.5 rounded-lg px-3 shadow-none hover:translate-y-0" disabled={hasFile === false} onClick={() => setOpen(true)} aria-label={`Xem mẫu ${name}`}><Eye size={16} aria-hidden />Xem mẫu</Button>
      {hasFile !== false && <Button size="small" variant="outline" className="gap-1.5 rounded-lg px-3 shadow-none hover:translate-y-0" loading={downloading} onClick={() => void download()} aria-label={`Tải mẫu ${name}`}><DownloadSimple size={16} aria-hidden />Tải mẫu</Button>}
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
        <p>{!detail.data.isActive ? 'Đã tạm ngừng cung cấp.' : detail.data.fileDocxUrl ? 'Đã có phôi Word.' : 'Chưa có tệp Word.'}</p>
        {detail.data.isActive && detail.data.fileDocxUrl && (preview.isPending ? (
          <div role="status" aria-label="Đang tải nội dung biểu mẫu" className="py-2">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : preview.isError ? <div role="alert" className="space-y-2 text-sm text-red-800"><p>{formTemplateErrorMessage(preview.error)}</p><Button variant="outline" size="small" onClick={() => void preview.refetch()}>Thử lại</Button></div> : <DocxPreview key={preview.data.blob.size + ':' + preview.dataUpdatedAt} blob={preview.data.blob} />)}
      </div>}
    </Modal>
  </div>;
}
