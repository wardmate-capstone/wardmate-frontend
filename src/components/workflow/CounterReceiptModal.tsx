import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Modal, ErrorAlert, Input, textareaClass } from '@/components/ui';
import { workflowError, type OfficialReceiptDto, type OfficialReceiptInput } from '@/lib/api/workflow';
import { validCalendarDate, vietnamToday } from '@/lib/calendarRules';

// Ngày hẹn là ngày dân sự Việt Nam; gửi mốc cuối giờ hành chính (16:30, UTC+07:00) để BE không coi là quá khứ.
const appointmentAt = (date: string) => `${date}T16:30:00+07:00`;

const receiptSchema = z.object({
  paperDossierVerified: z.boolean().refine(Boolean, 'Cần xác nhận đã đối chiếu hồ sơ giấy.'),
  appointmentDate: z.string().refine(v => !v || validCalendarDate(v), 'Ngày hẹn không hợp lệ.')
    .refine(v => !v || Date.parse(appointmentAt(v)) > Date.now(), 'Ngày hẹn không được trong quá khứ (hạn trong ngày là 16:30).'),
  notes: z.string().max(4000, 'Ghi chú tối đa 4.000 ký tự.'),
});
type ReceiptForm = z.infer<typeof receiptSchema>;

// Tiếp nhận chính thức tại quầy sau khi đã xác nhận giấy tờ sẵn sàng (POST officially-received).
export function CounterReceiptModal({
  open,
  onOpenChange,
  applicationNumber,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationNumber: string;
  onConfirm: (input: OfficialReceiptInput) => Promise<OfficialReceiptDto>;
}) {
  const id = useId();
  const [error, setError] = useState('');
  const form = useForm<ReceiptForm>({
    resolver: zodResolver(receiptSchema),
    defaultValues: { paperDossierVerified: false, appointmentDate: '', notes: '' },
  });
  const busy = form.formState.isSubmitting;
  const errors = form.formState.errors;

  useEffect(() => {
    if (open) {
      form.reset({ paperDossierVerified: false, appointmentDate: '', notes: '' });
      setError('');
    }
  }, [open, form]);

  const submit = form.handleSubmit(async values => {
    setError('');
    try {
      await onConfirm({
        paperDossierVerified: true,
        appointmentDate: values.appointmentDate ? appointmentAt(values.appointmentDate) : null,
        notes: values.notes.trim() || null,
      });
    } catch (err) {
      setError(workflowError(err));
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={next => !busy && onOpenChange(next)}
      title="Tiếp nhận tại quầy"
      description={`Ghi nhận hồ sơ ${applicationNumber} đã được công dân nộp bản giấy và tiếp nhận chính thức.`}
      footer={
        <>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" form={`${id}-form`} disabled={busy}>
            {busy ? 'Đang tiếp nhận…' : 'Xác nhận tiếp nhận'}
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} noValidate onSubmit={e => void submit(e)} className="grid gap-4">
        <div className="grid gap-1">
          <label className="flex items-start gap-2.5 text-sm text-slate-800">
            <input
              type="checkbox"
              disabled={busy}
              aria-invalid={Boolean(errors.paperDossierVerified)}
              aria-describedby={errors.paperDossierVerified ? `${id}-verified-error` : undefined}
              {...form.register('paperDossierVerified')}
              className="mt-0.5 h-4 w-4 shrink-0 accent-red-700"
            />
            <span>Tôi đã đối chiếu hồ sơ giấy với giấy tờ trên hệ thống. <span className="text-red-600">*</span></span>
          </label>
          {errors.paperDossierVerified && (
            <p id={`${id}-verified-error`} role="alert" className="text-xs font-medium text-red-700">{errors.paperDossierVerified.message}</p>
          )}
        </div>
        <Input
          type="date"
          label="Ngày hẹn trả kết quả"
          hint="Không bắt buộc."
          min={vietnamToday()}
          disabled={busy}
          error={errors.appointmentDate?.message}
          {...form.register('appointmentDate')}
        />
        <div className="grid gap-2">
          <label htmlFor={`${id}-notes`} className="text-sm font-semibold text-slate-800">Ghi chú</label>
          <textarea
            id={`${id}-notes`}
            rows={3}
            maxLength={4000}
            disabled={busy}
            placeholder="Ví dụ: Công dân nộp kèm 2 bản sao có chứng thực."
            aria-invalid={Boolean(errors.notes)}
            {...form.register('notes')}
            className={textareaClass}
          />
          {errors.notes && <p role="alert" className="text-xs font-medium text-red-700">{errors.notes.message}</p>}
        </div>
        {error && <ErrorAlert>{error}</ErrorAlert>}
      </form>
    </Modal>
  );
}
