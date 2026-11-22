import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { DownloadSimple, FileDoc } from '@phosphor-icons/react';
import { Button, Modal } from '@/components/ui';
import { downloadBlob } from '@/lib/api/documentForms';
import { staffingError } from '@/lib/api/staffingError';
import { leaveTemplateFileError, MAX_LEAVE_TEMPLATE_BYTES, workScheduleApi } from '@/lib/api/workSchedules';
import { dateText, QueryState, StaffStatus, useStaffOperation, useStaffQuery } from './shared';

const formatNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const mib = 1024 * 1024;
const emptyTemplate = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 503 &&
  (error.response.data?.code ?? error.response.data?.extensions?.code) === 'leave.template_unavailable';

function fileSize(bytes: number) {
  return bytes >= mib ? `${formatNumber.format(bytes / mib)} MiB` : `${formatNumber.format(bytes / 1024)} KiB`;
}

export function LeaveTemplatesDialog({ onClose }: { onClose: () => void }) {
  const history = useStaffQuery(['ward-leave-templates'], workScheduleApi.wardTemplates);
  const current = useStaffQuery(['leave-template'], workScheduleApi.template);
  const capabilities = useStaffQuery(['capabilities'], workScheduleApi.capabilities);
  const operation = useStaffOperation();
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);
  const downloadRequest = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => downloadRequest.current?.abort(), []);

  const maxBytes = Math.min(capabilities.data?.maxDocxBytes ?? MAX_LEAVE_TEMPLATE_BYTES, MAX_LEAVE_TEMPLATE_BYTES);
  const active = current.data && !current.isError ? current.data : undefined;
  const activeRow = history.data?.find(item => item.id === active?.versionId);
  const currentName = activeRow?.fileName ?? (history.isSuccess ? 'Mẫu theo cấu hình' : 'Mẫu Word hiện hành');
  const selectionError = fileError || (file ? leaveTemplateFileError(file, maxBytes) : undefined);

  async function download(id: string, hash: string, fileName?: string) {
    if (downloadRequest.current) return;
    const request = new AbortController();
    downloadRequest.current = request;
    setDownloading(id);
    setDownloadError('');
    try {
      const result = await workScheduleApi.templateDocx(id, hash, request.signal);
      if (!request.signal.aborted) downloadBlob(result.blob, fileName?.replace(/[\\/:*?"<>|]/g, '_') || result.fileName);
    } catch (error) {
      if (!request.signal.aborted) setDownloadError(staffingError(error));
    } finally {
      downloadRequest.current = undefined;
      if (!request.signal.aborted) setDownloading(undefined);
    }
  }

  const refresh = async () => {
    const [latest] = await Promise.all([history.refetch(), current.refetch(), capabilities.refetch()]);
    if (latest.isSuccess) operation.reset();
  };

  return (
    <Modal open title="Mẫu đơn nghỉ phép" className="sm:max-w-4xl" onOpenChange={open => !open && !operation.busy && onClose()}>
      <div className="space-y-6">
        <section aria-labelledby="leave-template-current" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <h3 id="leave-template-current" className="text-sm font-semibold text-slate-700">Mẫu hiện hành của phường</h3>
          {emptyTemplate(current.error) ? <p role="status" className="mt-2 text-sm text-slate-700">Phường chưa có mẫu đơn nghỉ phép để sử dụng.</p> : <QueryState query={current} />}
          {active && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <FileDoc size={28} className="shrink-0 text-red-800" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-all font-semibold text-slate-950">{currentName}</p>
                    <StaffStatus value="ACTIVE" label="Đang áp dụng" />
                  </div>
                  {activeRow && <p className="mt-1 text-sm text-slate-600">{activeRow.uploadedByName || 'Chưa có tên người tải'} · {dateText(activeRow.uploadedAtUtc)}</p>}
                </div>
              </div>
              <Button variant="outline" disabled={Boolean(downloading)} onClick={() => void download(active.versionId, active.sha256, activeRow?.fileName)}>
                <DownloadSimple size={17} aria-hidden="true" />{downloading === active.versionId ? 'Đang tải…' : 'Tải mẫu hiện hành'}
              </Button>
            </div>
          )}
        </section>

        <form className="space-y-3 rounded-2xl border border-slate-200 p-4 sm:p-5" onSubmit={event => {
          event.preventDefault();
          if (!file || selectionError || operation.review || operation.busy) return;
          void operation.run(() => workScheduleApi.uploadWardTemplate(file, maxBytes), () => {
            setFile(undefined);
            if (fileInput.current) fileInput.current.value = '';
          });
        }}>
          <h3 className="font-semibold text-slate-950">Áp dụng mẫu Word mới</h3>
          <p id="leave-template-hint" className="text-sm leading-6 text-slate-600">Tệp .docx, tối đa {fileSize(maxBytes)}. Mẫu mới áp dụng cho các đơn tạo sau khi tải lên.</p>
          <label htmlFor="ward-leave-template-file" className="block text-sm font-semibold text-slate-800">Tệp mẫu Word</label>
          <input ref={fileInput} id="ward-leave-template-file" type="file" accept=".docx" disabled={operation.busy}
            aria-invalid={Boolean(selectionError)} aria-describedby={`leave-template-hint${selectionError ? ' leave-template-file-error' : ''}`}
            className="block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-800 file:mr-3 file:rounded-lg file:bg-red-50 file:px-3 file:py-2 file:font-semibold file:text-red-900 focus-visible:outline-2 focus-visible:outline-red-800"
            onChange={event => {
              const next = event.target.files?.[0];
              const issue = next ? leaveTemplateFileError(next, maxBytes) : undefined;
              setFileError(issue ?? '');
              setFile(issue ? undefined : next);
              if (issue) event.target.value = '';
              if (!operation.review) operation.reset();
            }} />
          {selectionError && <p id="leave-template-file-error" role="alert" className="text-sm text-red-800">{selectionError}</p>}
          {operation.error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
            <p>{operation.error}</p>
            {operation.review && <p className="mt-1">Tải lại lịch sử và kiểm tra tệp trước khi gửi lại.</p>}
          </div>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={operation.busy} disabled={!file || Boolean(selectionError) || operation.review}>Tải lên và áp dụng</Button>
            {operation.review && <Button type="button" variant="outline" disabled={history.isFetching || operation.busy} onClick={() => void refresh()}>Tải lại lịch sử</Button>}
          </div>
        </form>

        <section aria-labelledby="leave-template-history" className="space-y-3">
          <h3 id="leave-template-history" className="font-semibold text-slate-950">Lịch sử mẫu của phường</h3>
          <QueryState query={history} />
          {history.isSuccess && !history.data.length && <p role="status" className="text-sm text-slate-600">Phường chưa tải mẫu Word nào lên.</p>}
          {history.isSuccess && history.data.length > 0 && <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {history.data.map(item => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-all text-sm font-semibold text-slate-950">{item.fileName}</p>
                    <StaffStatus value={item.isActive ? 'ACTIVE' : 'ARCHIVED'} label={item.isActive ? 'Đang áp dụng' : 'Đã lưu trữ'} />
                  </div>
                  <p className="text-sm text-slate-600">{fileSize(item.sizeBytes)} · {item.uploadedByName || 'Chưa có tên người tải'} · {dateText(item.uploadedAtUtc)}</p>
                </div>
                <Button variant="outline" size="small" aria-label={`Tải ${item.fileName}`} disabled={Boolean(downloading)} onClick={() => void download(item.id, item.sha256, item.fileName)}>
                  <DownloadSimple size={16} aria-hidden="true" />{downloading === item.id ? 'Đang tải…' : 'Tải xuống'}
                </Button>
              </li>
            ))}
          </ul>}
          {downloadError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{downloadError}</p>}
        </section>
      </div>
    </Modal>
  );
}
