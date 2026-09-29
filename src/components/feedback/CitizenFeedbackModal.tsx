import React, { useState } from 'react';
import { Star, Check } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  CitizenFeedback,
  FEEDBACK_RATING_LABELS,
  DEFAULT_FEEDBACK_ASPECTS,
} from '@/types/feedback';

interface CitizenFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureName?: string;
  applicationCode?: string;
  onSubmitFeedback?: (data: CitizenFeedback) => void;
}

export const CitizenFeedbackModal: React.FC<CitizenFeedbackModalProps> = ({
  open,
  onOpenChange,
  procedureName = 'Thủ tục hành chính',
  applicationCode,
  onSubmitFeedback,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeRating = hoverRating || rating;

  const handleToggleAspect = (aspect: string) => {
    setSelectedAspects((prev) =>
      prev.includes(aspect) ? prev.filter((a) => a !== aspect) : [...prev, aspect]
    );
  };

  const handleReset = () => {
    setRating(0);
    setHoverRating(0);
    setSelectedAspects([]);
    setComment('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      handleReset();
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const feedbackData: CitizenFeedback = {
        id: `fb-${Date.now()}`,
        procedureName,
        applicationCode,
        rating,
        aspects: selectedAspects,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      if (onSubmitFeedback) {
        onSubmitFeedback(feedbackData);
      }

      setIsSubmitting(false);
      onOpenChange(false);
      handleReset();
    }, 300);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Đánh giá trải nghiệm dịch vụ"
      description={
        applicationCode
          ? `Đánh giá chất lượng hỗ trợ tiền kiểm cho hồ sơ ${applicationCode} (${procedureName})`
          : `Đánh giá chất lượng hỗ trợ và hướng dẫn thủ tục ${procedureName}`
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Star Rating */}
          <div className="space-y-2 text-center sm:text-left">
            <label className="block text-sm font-bold text-slate-900">
              1. Mức độ hài lòng chung của bạn <span className="text-red-600">*</span>
            </label>
            

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div
                className="flex items-center gap-1.5"
                role="radiogroup"
                aria-label="Đánh giá từ 1 đến 5 sao"
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} sao - ${FEEDBACK_RATING_LABELS[star]}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="group p-1 text-slate-300 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-800 rounded-lg"
                    >
                      <Star
                        size={32}
                        weight={isFilled ? 'fill' : 'regular'}
                        className={`transition-colors ${
                          isFilled ? 'text-amber-500' : 'text-slate-300 group-hover:text-amber-400'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>

              {activeRating > 0 && (
                <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 animate-in fade-in">
                  {FEEDBACK_RATING_LABELS[activeRating]}
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Quality Criteria Aspects */}
          <div className="space-y-2.5">
            <label className="block text-sm font-bold text-slate-900">
              2. Những điểm bạn hài lòng hoặc cần ghi nhận <span className="text-xs font-normal text-slate-400">(Tùy chọn)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_FEEDBACK_ASPECTS.map((aspect) => {
                const isSelected = selectedAspects.includes(aspect);
                return (
                  <button
                    key={aspect}
                    type="button"
                    onClick={() => handleToggleAspect(aspect)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-red-800 bg-red-50 text-red-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`grid size-4 place-items-center rounded-sm border ${
                        isSelected
                          ? 'border-red-800 bg-red-800 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check size={12} weight="bold" />}
                    </span>
                    <span>{aspect}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Detailed Feedback Comment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="feedback-comment" className="block text-sm font-bold text-slate-900">
                3. Góp ý bổ sung của bạn <span className="text-xs font-normal text-slate-400">(Tùy chọn)</span>
              </label>
              <span className="text-xs text-slate-400">
                {comment.length}/500
              </span>
            </div>
            <textarea
              id="feedback-comment"
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
             className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Để sau
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={rating === 0 || isSubmitting}
                className="min-w-[120px]"
              >
                Gửi đánh giá
              </Button>
            </div>
          </div>
        </form>
    </Modal>
  );
};
