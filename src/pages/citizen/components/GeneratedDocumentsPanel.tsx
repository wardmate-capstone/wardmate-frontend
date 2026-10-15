import { useState } from 'react';
import { DownloadSimple, FilePdf, SpinnerGap } from '@phosphor-icons/react';
import { Button, toast } from '@/components/ui';
import { useApplicationContents, useDocumentMutations, useGeneratedDocuments } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, downloadBlob } from '@/lib/api/documentForms';

interface Props {
  applicationId: string;
}

export function GeneratedDocumentsPanel({ applicationId }: Props) {
  const contents = useApplicationContents(applicationId);
  const generated = useGeneratedDocuments(applicationId);
  const mutations = useDocumentMutations();
  const [busyId, setBusyId] = useState<string>();
  const approvedSubmissions = contents.data?.submissions.filter((item) => item.status === 'Approved') || [];

  async function generate(submissionId: string) {
    setBusyId(submissionId);
    try {
      await mutations.generatePdf.mutateAsync({ applicationId, submissionId });
      toast.success('Đã tạo tệp PDF từ bản khai được duyệt.');
    } catch (error) {
      toast.error(documentFormError(error));
    } finally {
      setBusyId(undefined);
    }
  }

  async function download(id: string, index: number) {
    setBusyId(id);
    try {
      const result = await documentFormApi.downloadGeneratedDocument(id);
      downloadBlob(result.blob, result.fileName || `ban-khai-da-duyet-${index + 1}.pdf`);
    } catch (error) {
      toast.error(documentFormError(error));
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900">Bản PDF sau tiền kiểm</h3>
          <p className="mt-1 text-xs text-slate-600">Tạo và tải bản PDF từ tờ khai đã được cán bộ duyệt.</p>
        </div>
        {approvedSubmissions.map((item) => (
          <Button key={item.id} size="small" loading={busyId === item.id} onClick={() => void generate(item.id)}>
            <FilePdf /> Tạo PDF: {item.fileName}
          </Button>
        ))}
      </div>

      {(contents.isPending || generated.isPending) && (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><SpinnerGap className="animate-spin" /> Đang tải tài liệu…</p>
      )}
      {(contents.isError || generated.isError) && (
        <p className="mt-4 text-sm text-red-700">{documentFormError(contents.error || generated.error)}</p>
      )}
      {!contents.isPending && approvedSubmissions.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">Chưa có tờ khai ở trạng thái đã duyệt để tạo PDF.</p>
      )}
      {!!generated.data?.length && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {generated.data.map((item, index) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
              <span className="flex items-center gap-2 font-semibold text-slate-800"><FilePdf className="text-red-700" /> Bản PDF {index + 1}</span>
              <button type="button" className="inline-flex items-center gap-1 font-semibold text-red-800 hover:underline" disabled={busyId === item.id} onClick={() => void download(item.id, index)}>
                <DownloadSimple /> Tải xuống
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
