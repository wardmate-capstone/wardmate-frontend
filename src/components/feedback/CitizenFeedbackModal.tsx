import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useCitizenFeedback } from '@/hooks/useAnalytics';
import { analyticsApi, analyticsError, applyAnalyticsFieldErrors, feedbackInputSchema, type FeedbackInput } from '@/lib/api/analytics';
import { useAuthStore } from '@/stores/authStore';
import { AnalyticsStatus } from '@/components/analytics/AnalyticsFilters';

export function CitizenFeedbackModal({ open, onOpenChange, applicationId, procedureName, applicationCode, onRefreshApplication }: {
  open: boolean; onOpenChange: (open: boolean) => void; applicationId?: string; procedureName?: string; applicationCode?: string; onRefreshApplication?: () => void;
}) {
  if (!open) return null;
  return applicationId ? <FeedbackForm key={applicationId} id={applicationId} onClose={() => onOpenChange(false)} onRefreshApplication={onRefreshApplication} description={`${applicationCode || ''} · ${procedureName || 'Hỗ trợ tiền kiểm'}`} /> : <Modal open onOpenChange={onOpenChange} title="Đánh giá trải nghiệm dịch vụ"><p>Hãy chọn hồ sơ để xem hoặc gửi đánh giá.</p></Modal>;
}
function FeedbackForm({ id, onClose, onRefreshApplication, description }: { id: string; onClose: () => void; onRefreshApplication?: () => void; description: string }) {
  const existing = useCitizenFeedback(id);
  const userId = useAuthStore(state => state.user?.id);
  const queryClient = useQueryClient();
  const lock = useRef(false);
  const [notReady, setNotReady] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<keyof FeedbackInput | null>(null);
  const { register, handleSubmit, control, reset, watch, setError, setFocus, formState: { errors, isDirty } } = useForm<FeedbackInput>({ resolver: zodResolver(feedbackInputSchema), defaultValues: { rating: 0, comment: '' } });
  const mutation = useMutation({ mutationFn: (input: FeedbackInput) => analyticsApi.createFeedback(id, input), retry: false,
    onSuccess: async data => {
      // The session may have changed while the write was in flight.
      if (useAuthStore.getState().user?.id !== userId) return;
      queryClient.setQueryData(['citizen-feedback', userId, id], data);
      await queryClient.invalidateQueries({ queryKey: ['analytics', userId] });
    },
  });
  useEffect(() => {
    if (!pendingFocus || mutation.isPending) return;
    // Wait until the fieldset is enabled again before focusing a server error.
    setFocus(pendingFocus);
    setPendingFocus(null);
  }, [mutation.isPending, pendingFocus, setFocus]);
  const guard = useUnsavedChanges(isDirty && !existing.data, mutation.isPending);
  const rating = watch('rating');
  const comment = watch('comment');
  const submit = handleSubmit(async input => {
    if (lock.current || existing.isFetching || existing.isError || existing.data || notReady) return;
    lock.current = true;
    try { await mutation.mutateAsync(input); }
    catch (error) {
      let firstField: keyof FeedbackInput | null = null;
      applyAnalyticsFieldErrors(error, (field, message) => {
        if (field !== 'rating' && field !== 'comment') return;
        setError(field, { message });
        firstField ??= field;
      });
      setPendingFocus(firstField);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        if (error.response.data?.code === 'feedback.already_exists') await existing.refetch();
        if (error.response.data?.code === 'feedback.not_ready') { setNotReady(true); onRefreshApplication?.(); }
      }
    } finally { lock.current = false; }
  });
  return <><Modal open onOpenChange={open => { if (!open) guard.requestClose(onClose); }} title="Đánh giá trải nghiệm dịch vụ" description={description}><div className="space-y-4">
    <AnalyticsStatus pending={existing.isPending} error={existing.error} retry={() => void existing.refetch()} />
    {existing.data ? <div role="status" className="space-y-3"><p className="font-bold">Đánh giá đã được ghi nhận: {existing.data.rating}/5 sao</p><p className="whitespace-pre-wrap break-words">{existing.data.comment || 'Không có góp ý thêm.'}</p><p className="text-sm text-slate-600">{new Date(existing.data.createdAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p><Button onClick={onClose}>Đóng</Button></div> : !existing.isPending && !existing.isError && <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={mutation.isPending} className="space-y-4"><legend className="mb-3 font-semibold">Mức độ hài lòng (bắt buộc)</legend><Controller name="rating" control={control} render={({ field }) => <div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(star => <label key={star} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border p-3 ${field.value === star ? 'border-red-800 bg-red-50' : 'border-slate-200'}`}><input type="radio" name={field.name} ref={star === 1 ? field.ref : undefined} value={star} checked={field.value === star} onBlur={field.onBlur} onChange={() => field.onChange(star)} />{star} sao</label>)}</div>} />{errors.rating && <p role="alert" className="text-red-800">{errors.rating.message}</p>}
      <label className="block space-y-2"><span>Góp ý bổ sung (tùy chọn)</span><textarea rows={4} maxLength={2000} {...register('comment')} aria-invalid={!!errors.comment} aria-describedby="feedback-comment-error feedback-comment-count" className="w-full rounded-xl border border-slate-300 p-3" /></label><p id="feedback-comment-count" className="text-sm text-slate-600">{comment.length}/2000 ký tự</p><p id="feedback-comment-error" role={errors.comment ? 'alert' : undefined}>{errors.comment?.message}</p></fieldset>
      {mutation.error && <p role="alert" className="text-red-800">{analyticsError(mutation.error)} Nội dung được giữ để bạn kiểm tra hoặc thử lại.</p>}
      <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => guard.requestClose(onClose)}>Để sau</Button><Button type="submit" loading={mutation.isPending} disabled={notReady || existing.isFetching || mutation.isPending || rating === 0}>Gửi đánh giá</Button></div>
      <button type="button" className="text-sm underline" disabled={mutation.isPending} onClick={() => reset({ rating: 0, comment: '' })}>Xóa nội dung đang nhập</button>
    </form>}
  </div></Modal>{guard.confirmation}</>;
}
