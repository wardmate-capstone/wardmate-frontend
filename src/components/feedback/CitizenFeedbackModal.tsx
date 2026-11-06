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
import { Star } from '@phosphor-icons/react';

const RATING_LABELS = ['Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];

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
  const [hoverRating, setHoverRating] = useState(0);
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
      <fieldset disabled={mutation.isPending} className="space-y-5">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-slate-900">Mức độ hài lòng <span className="text-red-700">*</span></legend>
          <Controller name="rating" control={control} render={({ field }) => {
            const shown = hoverRating || field.value;
            return <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5">
              <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map(star => <label key={star} className="cursor-pointer rounded-lg p-1 transition hover:scale-110 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-200" onMouseEnter={() => setHoverRating(star)}>
                  <input type="radio" className="sr-only" aria-label={`${star} sao`} name={field.name} ref={star === 1 ? field.ref : undefined} value={star} checked={field.value === star} onBlur={field.onBlur} onChange={() => field.onChange(star)} />
                  <Star size={36} weight={star <= shown ? 'fill' : 'regular'} className={star <= shown ? 'text-gold-400' : 'text-slate-300'} aria-hidden />
                </label>)}
              </div>
              <p className={`min-h-5 text-sm font-semibold ${shown ? 'text-slate-800' : 'text-slate-400'}`} aria-live="polite">{shown ? RATING_LABELS[shown - 1] : 'Chọn số sao để đánh giá'}</p>
            </div>;
          }} />
          {errors.rating && <p role="alert" className="mt-2 text-sm text-red-800">{errors.rating.message}</p>}
        </fieldset>
        <div>
          <label htmlFor="feedback-comment" className="mb-2 block text-sm font-semibold text-slate-900">Góp ý bổ sung <span className="font-normal text-slate-500">(tùy chọn)</span></label>
          <div className="rounded-xl border border-slate-300 bg-white transition focus-within:border-red-700 focus-within:ring-2 focus-within:ring-red-100">
            <textarea id="feedback-comment" rows={4} maxLength={2000} {...register('comment')} placeholder="Chia sẻ điều bạn hài lòng hoặc cần cải thiện..." aria-invalid={!!errors.comment} aria-describedby="feedback-comment-error feedback-comment-count" className="block w-full resize-none rounded-xl bg-transparent px-3.5 pt-3 text-sm outline-none placeholder:text-slate-400" />
            <p id="feedback-comment-count" className="px-3.5 pb-2 text-right text-xs text-slate-400">{comment.length}/2000 ký tự</p>
          </div>
          <p id="feedback-comment-error" role={errors.comment ? 'alert' : undefined} className="mt-1 text-sm text-red-800">{errors.comment?.message}</p>
        </div>
      </fieldset>
      {mutation.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{analyticsError(mutation.error)} Nội dung được giữ để bạn kiểm tra hoặc thử lại.</p>}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <button type="button" className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50" disabled={mutation.isPending || !isDirty} onClick={() => reset({ rating: 0, comment: '' })}>Xóa nội dung đang nhập</button>
        <div className="ml-auto flex gap-3"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => guard.requestClose(onClose)}>Để sau</Button><Button type="submit" loading={mutation.isPending} disabled={notReady || existing.isFetching || mutation.isPending || rating === 0}>Gửi đánh giá</Button></div>
      </div>
    </form>}
  </div></Modal>{guard.confirmation}</>;
}
