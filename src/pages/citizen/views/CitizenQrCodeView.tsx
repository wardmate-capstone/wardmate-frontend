import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui';
import { useApprovedQr } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, safeDocumentLink } from '@/lib/api/documentForms';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';
import type { CitizenDossier } from '../types';

export function CitizenQrCodeView({ dossiers }: { dossiers: CitizenDossier[] }) {
  const eligible = dossiers.filter(d => d.id && d.status === 'Đã duyệt');
  const [selectedId, setSelectedId] = useState('');
  const selected = eligible.find(d => d.id === selectedId) ?? eligible[0];
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <h2 className="text-lg font-bold">Mã QR hồ sơ đã duyệt tiền kiểm</h2>
    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">Duyệt tiền kiểm không thay thế việc tiếp nhận hồ sơ chính thức. Cán bộ sẽ đối chiếu giấy tờ khi bạn đến.</p>
    {!eligible.length ? <p>Chưa có hồ sơ đã duyệt tiền kiểm để xem mã QR.</p> : <><label className="grid gap-2 text-sm font-semibold">Chọn hồ sơ<select className="min-h-12 max-w-full rounded-xl border p-3" value={selected?.id} onChange={e => setSelectedId(e.target.value)}>{eligible.map(d => <option key={d.id} value={d.id}>{d.code} · {d.procedureName}</option>)}</select></label>{selected?.id && <ApprovedQr key={selected.id} applicationId={selected.id} />}</>}
  </section>;
}

function ApprovedQr({ applicationId }: { applicationId: string }) {
  const qr = useApprovedQr(applicationId);
  const missing = axios.isAxiosError(qr.error) && qr.error.response?.status === 404;
  if (qr.isPending) return <p role="status">Đang tải thông tin mã QR…</p>;
  if (qr.isError) return <div className="space-y-3" role={missing ? 'status' : 'alert'}><p>{documentFormError(qr.error)}</p>{missing && <p className="text-sm text-slate-600">Mở chi tiết hồ sơ và tạo PDF từ bản khai đã duyệt, sau đó tải lại mã QR. Hồ sơ không có bản khai DOCX cần được hỗ trợ cấp mã.</p>}<Button variant="outline" onClick={() => void qr.refetch()}>Tải lại mã QR</Button></div>;
  if (!qr.data) return null;
  const link = safeDocumentLink(qr.data.qrCodeValue);
  return <div className="space-y-4"><p className="text-sm">Thời gian tạo: {new Date(qr.data.generatedAt).toLocaleString('vi-VN')}</p><DocumentFilePreview fileId={`qr-${applicationId}`} revision={qr.data.id} fileName={`ma-qr-${applicationId}.png`} load={signal => documentFormApi.downloadApprovedQr(applicationId, signal)} />{link && <a className="break-all text-sm text-red-800 underline" href={link} target="_blank" rel="noopener noreferrer">Mở địa chỉ trong mã QR (có thể yêu cầu đăng nhập)</a>}</div>;
}
