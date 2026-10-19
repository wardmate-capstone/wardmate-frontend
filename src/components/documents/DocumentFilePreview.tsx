import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Button, Skeleton } from '@/components/ui';
import { DocxPreview } from '@/components/forms/DocxPreview';
import { documentFormError, downloadBlob } from '@/lib/api/documentForms';

type BinaryLoader = (signal: AbortSignal) => Promise<{ blob: Blob; fileName: string }>;

/** Binary is fetched only for the selected file, through the authenticated client. */
export function DocumentFilePreview({ fileId, fileName, load, revision = '' }: { fileId: string; fileName: string; load: BinaryLoader; revision?: string }) {
  const userId = useAuthStore(s => s.user?.id);
  const binary = useQuery({ queryKey: ['document-binary', userId, fileId, revision], queryFn: ({ signal }) => load(signal), enabled: Boolean(userId), gcTime: 0 });
  return <div className="space-y-3">
    {binary.isPending && (
      <div role="status" aria-label="Đang tải tệp" className="space-y-3 py-2">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )}
    {binary.isError && <div role="alert"><p>{documentFormError(binary.error)}</p><Button variant="outline" onClick={() => void binary.refetch()}>Thử tải lại tệp</Button></div>}
    {binary.data && <><Button size="small" variant="outline" onClick={() => downloadBlob(binary.data.blob, binary.data.fileName === 'tai-lieu' ? fileName : binary.data.fileName)}>Tải xuống {fileName}</Button><BinaryPreview key={`${fileId}-${revision}`} blob={binary.data.blob} fileName={fileName} /></>}
  </div>;
}

export function BinaryPreview({ blob, fileName }: { blob: Blob; fileName: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const next = URL.createObjectURL(blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [blob]);
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'docx') return <DocxPreview key={url} blob={blob} />;
  if (['png', 'jpg', 'jpeg'].includes(ext || '')) return url ? <img src={url} alt={fileName} className="mx-auto max-h-[60vh] max-w-full object-contain" /> : null;
  if (ext === 'pdf') return url ? <iframe src={url} title={`Nội dung ${fileName}`} className="h-[60vh] w-full rounded-xl border" /> : null;
  return <p className="text-sm text-slate-600">Tải tệp về để xem bằng ứng dụng phù hợp. Bản xem trước không thay thế việc kiểm tra trong Word; ghi chú Word cần mở trong Word.</p>;
}
