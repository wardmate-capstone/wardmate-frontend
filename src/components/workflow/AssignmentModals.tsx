import { useEffect, useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Modal } from '@/components/ui';
import { reasonSchema, workflowError } from '@/lib/api/workflow';

const textareaClass =
  'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100 disabled:opacity-50';

// Lý do phân công là dữ liệu nội bộ: BE chỉ trả cho cán bộ/Manager, không hiển thị cho công dân.
const releaseSchema = z.object({ reason: reasonSchema });

export function ReleaseApplicationModal({
  open,
  onOpenChange,
  applicationNumber,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationNumber: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const reasonId = useId();
  const [error, setError] = useState('');
  const form = useForm<z.infer<typeof releaseSchema>>({ resolver: zodResolver(releaseSchema), defaultValues: { reason: '' } });
  const busy = form.formState.isSubmitting;

  useEffect(() => {
    if (open) {
      form.reset({ reason: '' });
      setError('');
    }
  }, [open, form]);

  const submit = form.handleSubmit(async ({ reason }) => {
    setError('');
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError(workflowError(err));
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Trả hồ sơ về hàng đợi"
      description={`Hồ sơ ${applicationNumber} sẽ quay về trạng thái Chờ tiền kiểm, không còn người phụ trách để cán bộ khác nhận. Nhận xét đã ghi và hạn xử lý được giữ nguyên.`}
      footer={
        <>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" form={`${reasonId}-form`} disabled={busy}>
            {busy ? 'Đang trả hồ sơ…' : 'Trả về hàng đợi'}
          </Button>
        </>
      }
    >
      <form id={`${reasonId}-form`} noValidate onSubmit={(e) => void submit(e)} className="grid gap-2">
        <label htmlFor={reasonId} className="text-sm font-semibold text-slate-800">
          Lý do trả hồ sơ <span className="text-red-600">*</span>
        </label>
        <textarea
          id={reasonId}
          rows={4}
          maxLength={500}
          disabled={busy}
          placeholder="Ví dụ: Hồ sơ thuộc lĩnh vực Đất đai, cần cán bộ phụ trách lĩnh vực này xử lý."
          aria-invalid={Boolean(form.formState.errors.reason)}
          aria-describedby={form.formState.errors.reason ? `${reasonId}-error` : `${reasonId}-hint`}
          {...form.register('reason')}
          className={textareaClass}
        />
        {form.formState.errors.reason ? (
          <p id={`${reasonId}-error`} role="alert" className="text-xs font-medium text-red-700">{form.formState.errors.reason.message}</p>
        ) : (
          <p id={`${reasonId}-hint`} className="text-xs text-slate-500">5–500 ký tự. Chỉ cán bộ và lãnh đạo phường xem được lý do này.</p>
        )}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </form>
    </Modal>
  );
}

export type AssignableOfficer = {
  id: string;
  name: string;
  categoryIds: number[];
  /** Số hồ sơ đang xử lý (nếu đã tải); undefined khi chưa có số liệu. */
  activeCount?: number;
};

export type AssignTarget = {
  applicationNumber: string;
  categoryId?: number | null;
  categoryName: string;
  assignedOfficerId?: string | null;
  assignedOfficerName?: string;
  /** Hồ sơ chưa có người phụ trách thì là giao mới, ngược lại là chuyển người. */
  isTransfer: boolean;
};

const assignSchema = z.object({
  officerId: z.string().min(1, 'Chọn cán bộ nhận hồ sơ.'),
  reason: reasonSchema,
});

export function AssignOfficerModal({
  open,
  onOpenChange,
  target,
  officers,
  officersError,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: AssignTarget | null;
  officers: AssignableOfficer[];
  officersError?: string;
  onConfirm: (officerId: string, reason: string) => Promise<void>;
}) {
  const baseId = useId();
  const [error, setError] = useState('');
  const form = useForm<z.infer<typeof assignSchema>>({ resolver: zodResolver(assignSchema), defaultValues: { officerId: '', reason: '' } });
  const busy = form.formState.isSubmitting;

  useEffect(() => {
    if (open) {
      form.reset({ officerId: '', reason: '' });
      setError('');
    }
  }, [open, form]);

  // Ưu tiên cán bộ đúng lĩnh vực (hoặc chưa gán lĩnh vực = mọi lĩnh vực), rồi ít việc hơn; không loại ai.
  const options = useMemo(() => {
    const categoryId = target?.categoryId ?? null;
    const matches = (o: AssignableOfficer) => categoryId !== null && o.categoryIds.includes(categoryId);
    return officers
      .filter((o) => o.id.toLowerCase() !== target?.assignedOfficerId?.toLowerCase())
      .map((o) => ({ ...o, matches: matches(o), coversAll: o.categoryIds.length === 0 }))
      .sort((a, b) =>
        Number(b.matches) - Number(a.matches) ||
        Number(b.coversAll) - Number(a.coversAll) ||
        (a.activeCount ?? Number.MAX_SAFE_INTEGER) - (b.activeCount ?? Number.MAX_SAFE_INTEGER) ||
        a.name.localeCompare(b.name, 'vi'));
  }, [officers, target]);

  const submit = form.handleSubmit(async ({ officerId, reason }) => {
    setError('');
    try {
      await onConfirm(officerId, reason.trim());
    } catch (err) {
      setError(workflowError(err));
    }
  });

  const title = target?.isTransfer ? 'Chuyển cán bộ phụ trách' : 'Giao hồ sơ cho cán bộ';
  return (
    <Modal
      open={open && Boolean(target)}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title={title}
      description={
        target?.isTransfer
          ? `Hồ sơ ${target.applicationNumber} đang do ${target.assignedOfficerName || 'cán bộ khác'} phụ trách. Trạng thái hồ sơ giữ nguyên, cán bộ mới tiếp tục xử lý.`
          : `Hồ sơ ${target?.applicationNumber ?? ''} chưa có người nhận. Sau khi giao, hồ sơ chuyển sang Đang kiểm tra.`
      }
      footer={
        <>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" form={`${baseId}-form`} disabled={busy || options.length === 0}>
            {busy ? 'Đang lưu…' : target?.isTransfer ? 'Chuyển cán bộ' : 'Giao hồ sơ'}
          </Button>
        </>
      }
    >
      <form id={`${baseId}-form`} noValidate onSubmit={(e) => void submit(e)} className="grid gap-4">
        <p className="text-sm text-slate-600">
          Lĩnh vực hồ sơ: <strong className="text-slate-900">{target?.categoryName}</strong>
        </p>
        <div className="grid gap-2">
          <label htmlFor={`${baseId}-officer`} className="text-sm font-semibold text-slate-800">
            Cán bộ nhận hồ sơ <span className="text-red-600">*</span>
          </label>
          <select
            id={`${baseId}-officer`}
            disabled={busy || options.length === 0}
            aria-invalid={Boolean(form.formState.errors.officerId)}
            aria-describedby={form.formState.errors.officerId ? `${baseId}-officer-error` : undefined}
            {...form.register('officerId')}
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100"
          >
            <option value="">— Chọn cán bộ —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {o.matches ? ' · Đúng lĩnh vực' : o.coversAll ? ' · Mọi lĩnh vực' : ' · Khác lĩnh vực'}
                {o.activeCount !== undefined ? ` · ${o.activeCount} hồ sơ đang xử lý` : ''}
              </option>
            ))}
          </select>
          {form.formState.errors.officerId && (
            <p id={`${baseId}-officer-error`} role="alert" className="text-xs font-medium text-red-700">{form.formState.errors.officerId.message}</p>
          )}
          {officersError && <p role="alert" className="text-xs font-medium text-red-700">{officersError}</p>}
          {!officersError && options.length === 0 && (
            <p className="text-xs text-slate-500">Không có cán bộ Một cửa nào khác trong phường để nhận hồ sơ.</p>
          )}
        </div>
        <div className="grid gap-2">
          <label htmlFor={`${baseId}-reason`} className="text-sm font-semibold text-slate-800">
            Lý do <span className="text-red-600">*</span>
          </label>
          <textarea
            id={`${baseId}-reason`}
            rows={3}
            maxLength={500}
            disabled={busy}
            placeholder="Ví dụ: Cân bằng khối lượng công việc, cán bộ phụ trách nghỉ phép."
            aria-invalid={Boolean(form.formState.errors.reason)}
            aria-describedby={form.formState.errors.reason ? `${baseId}-reason-error` : `${baseId}-reason-hint`}
            {...form.register('reason')}
            className={textareaClass}
          />
          {form.formState.errors.reason ? (
            <p id={`${baseId}-reason-error`} role="alert" className="text-xs font-medium text-red-700">{form.formState.errors.reason.message}</p>
          ) : (
            <p id={`${baseId}-reason-hint`} className="text-xs text-slate-500">5–500 ký tự, được ghi vào lịch sử phân công.</p>
          )}
        </div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </form>
    </Modal>
  );
}
