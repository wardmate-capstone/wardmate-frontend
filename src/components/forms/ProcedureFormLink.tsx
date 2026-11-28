import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DownloadSimple, Eye } from '@phosphor-icons/react';
import { Button, Modal, Skeleton, buttonVariants } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { DocxPreview } from './DocxPreview';
import {
  downloadFormTemplateDocx,
  downloadPublicFormTemplateDocx,
  formTemplateErrorMessage,
  triggerFileDownload,
} from '@/lib/api/formTemplates';

/**
 * Mẫu đơn, tờ khai trong bảng "Thành phần hồ sơ" (giống Cổng DVC Quốc gia):
 * - Tải mẫu và Xem trước: không cần đăng nhập (khách dùng API công khai BE-J; phôi trống không có dữ liệu cá nhân).
 * - Xem trước chỉ là tải file .docx rồi hiển thị trên trình duyệt, nên dùng chung API tải.
 * - API công khai đã deploy (DOC-TPL-PUB-01): 404 nghĩa là mẫu ngừng dùng hoặc tệp Word không còn trong kho,
 *   đăng nhập cũng không xem được → báo rõ thay vì mời đăng nhập. Chỉ 401/403 mới mời đăng nhập.
 * - M-02: 404 không thử lại, khóa nút tải và không báo "thử lại sau" (thử lại cũng không có tệp).
 */
const TEMPLATE_UNAVAILABLE = 'Mẫu chưa có tệp, vui lòng liên hệ phường.';
/** Mẫu đã biết là mất tệp trong phiên xem trang: lần bấm sau báo ngay, không gọi lại API. */
const missingTemplates = new Set<string>();

export function ProcedureFormLink({ templateId, name }: { templateId?: string | null; name: string }) {
  const user = useAuthStore(s => s.user);
  const location = useLocation();
  const [mode, setMode] = useState<'preview' | 'login' | null>(null);
  const [loginReason, setLoginReason] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [missing, setMissing] = useState(() => Boolean(templateId && missingTemplates.has(templateId)));
  const preview = useQuery({
    queryKey: ['form-templates', user?.id, 'procedure-preview', templateId],
    queryFn: ({ signal }) => (user ? downloadFormTemplateDocx(templateId!, signal) : downloadPublicFormTemplateDocx(templateId!, signal)),
    enabled: Boolean(templateId && mode === 'preview' && !missing),
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
  const loginUrl = '/dang-nhap?returnTo=' + encodeURIComponent(location.pathname + location.search + location.hash);
  const previewStatus = axios.isAxiosError(preview.error) ? preview.error.response?.status : undefined;
  // Khách xem trước nhưng API từ chối truy cập ẩn danh → đổi sang hộp mời đăng nhập
  useEffect(() => {
    if (!user && mode === 'preview' && (previewStatus === 401 || previewStatus === 403)) {
      setLoginReason('Vui lòng đăng nhập để xem mẫu.');
      setMode('login');
    }
  }, [user, mode, previewStatus]);
  useEffect(() => {
    if (previewStatus === 404 && templateId) { missingTemplates.add(templateId); setMissing(true); }
  }, [previewStatus, templateId]);

  // Mẫu chưa có tệp Word: chỉ hiện tên như Cổng DVC
  if (!templateId) return <span className="break-words text-slate-800">{name}</span>;

  const askLogin = (reason: string) => { setLoginReason(reason); setMode('login'); };

  const download = async () => {
    if (downloading) return;
    if (missing) { toast.error(TEMPLATE_UNAVAILABLE, { id: `template-missing-${templateId}` }); return; }
    setDownloading(true);
    try {
      const file = user ? await downloadFormTemplateDocx(templateId) : await downloadPublicFormTemplateDocx(templateId);
      triggerFileDownload(file.blob, file.fileName);
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 429) toast.error('Bạn tải mẫu quá nhiều lần. Vui lòng thử lại sau 1 phút.');
      // Khách: API công khai chưa phục vụ mẫu này → mời đăng nhập thay vì báo lỗi kỹ thuật
      else if (!user && (status === 401 || status === 403)) askLogin('Vui lòng đăng nhập để tải mẫu.');
      else if (status === 404) {
        missingTemplates.add(templateId); setMissing(true);
        toast.error(TEMPLATE_UNAVAILABLE, { id: `template-missing-${templateId}` });
      } else toast.error(formTemplateErrorMessage(error), { id: `template-download-${templateId}` });
    } finally {
      setDownloading(false);
    }
  };

  const openPreview = () => setMode('preview');

  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5 text-left">
      <span className="break-words font-medium text-slate-800">{name}</span>
      <div className="flex flex-wrap gap-1.5">
        <Button size="small" variant="outline" className="min-h-9 gap-1 rounded-md px-2.5 text-xs shadow-none hover:translate-y-0" loading={downloading} disabled={missing} onClick={() => void download()} aria-label={`Tải mẫu ${name}`}>
          <DownloadSimple size={15} aria-hidden />Tải mẫu
        </Button>
        <Button size="small" variant="ghost" className="min-h-9 gap-1 rounded-md px-2.5 text-xs text-slate-700 shadow-none hover:translate-y-0" onClick={openPreview} aria-label={`Xem mẫu ${name}`}>
          <Eye size={15} aria-hidden />Xem
        </Button>
      </div>
      {missing && <p className="text-xs text-amber-800">{TEMPLATE_UNAVAILABLE}</p>}

      <Modal
        open={mode === 'preview'}
        onOpenChange={open => { if (!open) setMode(null); }}
        title={`Biểu mẫu: ${name}`}
        description="Xem trước nội dung biểu mẫu Word gốc."
        className="sm:max-w-6xl sm:max-h-[92dvh]"
        footer={<Button loading={downloading} disabled={missing || preview.isPending} onClick={() => void download()}><DownloadSimple size={18} aria-hidden />Tải mẫu Word</Button>}
      >
        {missing ? (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{TEMPLATE_UNAVAILABLE}</p>
        ) : preview.isPending ? (
          <div role="status" className="space-y-2 py-2"><p className="text-sm text-slate-500">Đang tải nội dung biểu mẫu…</p><Skeleton className="h-64 w-full rounded-xl" /></div>
        ) : preview.isError ? (
          <div role="alert" className="space-y-2 text-sm text-red-800">
            <p>{previewStatus === 429 ? 'Bạn xem mẫu quá nhiều lần. Vui lòng thử lại sau 1 phút.' : previewStatus === 404 ? TEMPLATE_UNAVAILABLE : formTemplateErrorMessage(preview.error)}</p>
            {previewStatus !== 404 && <Button variant="outline" size="small" onClick={() => void preview.refetch()}>Thử lại</Button>}
          </div>
        ) : (
          <DocxPreview key={preview.data.blob.size + ':' + preview.dataUpdatedAt} blob={preview.data.blob} />
        )}
      </Modal>

      <Modal
        open={mode === 'login'}
        onOpenChange={open => { if (!open) setMode(null); }}
        title="Cần đăng nhập"
        className="sm:max-w-sm"
        footer={<>
          <Button variant="outline" onClick={() => setMode(null)}>Để sau</Button>
          <Link to={loginUrl} className={buttonVariants({ variant: 'primary' })}>Đăng nhập</Link>
        </>}
      >
        <p className="text-sm text-slate-700">{loginReason}</p>
      </Modal>
    </div>
  );
}
