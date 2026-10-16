import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Modal } from '@/components/ui';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { workflowError } from '@/lib/api/workflow';

const schema = z.object({ procedureId: z.string().uuid('Chọn thủ tục hợp lệ.'), wardCode: z.string().trim().min(1, 'Chọn phường/xã tiếp nhận.').max(50), caseCode: z.string().max(100, 'Mã trường hợp tối đa 100 ký tự.') });
export type CreateDossierValues = z.infer<typeof schema>;

export function CreateDossierModal({ open, onClose, initial, procedures, wards, cases, loading, unavailable, onRetry, busy, onProcedureChange, onSubmit }: {
  open: boolean; onClose: () => void; initial: CreateDossierValues;
  procedures: { id: string; title: string }[]; wards: { code: string; name: string }[]; cases: { caseCode: string; caseName: string }[];
  loading: boolean; unavailable: boolean; onRetry: () => void; busy: boolean; onProcedureChange: (id: string) => void; onSubmit: (values: CreateDossierValues) => Promise<void>;
}) {
  const form = useForm<CreateDossierValues>({ resolver: zodResolver(schema), defaultValues: initial });
  const [error, setError] = useState('');
  const lock = useRef(false);
  const wasOpen = useRef(false);
  const guard = useUnsavedChanges(form.formState.isDirty, busy);
  useEffect(() => {
    if (open && !wasOpen.current) { form.reset(initial); setError(''); }
    wasOpen.current = open;
  }, [open, initial.procedureId, initial.wardCode, initial.caseCode, form]);
  useEffect(() => {
    if (!open || loading) return;
    if (!form.getValues('procedureId') && initial.procedureId) form.setValue('procedureId', initial.procedureId);
    if (!form.getValues('wardCode') && initial.wardCode) form.setValue('wardCode', initial.wardCode);
    const selected = form.getValues('caseCode');
    if (!cases.some(item => item.caseCode === selected)) {
      const matchingDefault = cases.find(item => item.caseCode === initial.caseCode);
      form.setValue('caseCode', matchingDefault?.caseCode ?? (cases.length === 1 ? cases[0].caseCode : ''));
    }
  }, [open, loading, cases, initial.caseCode, initial.procedureId, initial.wardCode, form]);
  return <><Modal open={open} onOpenChange={next => { if (!next) guard.requestClose(onClose); }} title="Chuẩn bị hồ sơ tiền kiểm mới" description="Khởi tạo bản nháp để chuẩn bị giấy tờ trước khi gửi tiền kiểm.">
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(async values => {
      if (loading || unavailable || busy || lock.current) return;
      if (!procedures.some(x => x.id === values.procedureId)) { form.setError('procedureId', { message: 'Thủ tục không có trong danh mục hiện tại.' }); return; }
      if (!wards.some(x => x.code === values.wardCode)) { form.setError('wardCode', { message: 'Phường/xã không có trong danh mục hiện tại.' }); return; }
      if (cases.length && !cases.some(x => x.caseCode === values.caseCode)) { form.setError('caseCode', { message: 'Chọn trường hợp thực hiện thủ tục.' }); return; }
      lock.current = true; setError(''); try { await onSubmit(values); } catch (err) { setError(workflowError(err)); } finally { lock.current = false; }
    })}>
      {loading && <p role="status">Đang tải danh mục…</p>}
      {unavailable && <div role="alert" className="space-y-2"><p>Chưa tải được danh mục cần thiết để tạo hồ sơ.</p><Button variant="outline" onClick={onRetry}>Thử tải lại danh mục</Button></div>}
      <label htmlFor="create-procedure" className="grid gap-2 text-sm font-semibold">Thủ tục hành chính<select id="create-procedure" disabled={busy || loading} className="min-h-12 rounded-xl border p-3" {...form.register('procedureId', { onChange: e => onProcedureChange(e.target.value) })} aria-invalid={Boolean(form.formState.errors.procedureId)} aria-describedby="create-procedure-error"><option value="">Chọn thủ tục</option>{procedures.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label><p id="create-procedure-error" role="alert" className="text-sm text-red-800">{form.formState.errors.procedureId?.message}</p>
      {!!cases.length && <><label htmlFor="create-case" className="grid gap-2 text-sm font-semibold">Trường hợp thực hiện<select id="create-case" disabled={busy || loading} className="min-h-12 rounded-xl border p-3" {...form.register('caseCode')} aria-invalid={Boolean(form.formState.errors.caseCode)} aria-describedby="create-case-error"><option value="">Chọn trường hợp</option>{cases.map(x => <option key={x.caseCode} value={x.caseCode}>{x.caseName}</option>)}</select></label><p id="create-case-error" role="alert" className="text-sm text-red-800">{form.formState.errors.caseCode?.message}</p></>}
      <label htmlFor="create-ward" className="grid gap-2 text-sm font-semibold">Phường/xã tiếp nhận<select id="create-ward" disabled={busy || loading} className="min-h-12 rounded-xl border p-3" {...form.register('wardCode')} aria-invalid={Boolean(form.formState.errors.wardCode)} aria-describedby="create-ward-error"><option value="">Chọn đơn vị tiếp nhận</option>{wards.map(x => <option key={x.code} value={x.code}>{x.name}</option>)}</select></label><p id="create-ward-error" role="alert" className="text-sm text-red-800">{form.formState.errors.wardCode?.message}</p>
      {(!procedures.length || !wards.length) && !loading && <p role="alert">Chưa tải được danh mục bắt buộc. Đóng và tải lại trang để thử lại.</p>}{error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <Button type="submit" loading={busy} disabled={loading || unavailable || !procedures.length || !wards.length}>Tạo hồ sơ nháp</Button>
    </form>
  </Modal>{guard.confirmation}</>;
}
