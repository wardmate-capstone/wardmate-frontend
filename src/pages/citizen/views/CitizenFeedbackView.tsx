import { Star } from '@phosphor-icons/react';

interface CitizenFeedbackViewProps {
  onOpenFeedback: (procedure: string, code?: string) => void;
}

export function CitizenFeedbackView({ onOpenFeedback }: CitizenFeedbackViewProps) {
  return (
    <div className="space-y-4 admin-content-card">
      <section className="admin-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="admin-status-badge is-success mb-1">Khảo sát sự hài lòng</span>
          <h2 className="text-base font-bold text-slate-950">Góp ý chất lượng phục vụ công dân</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi ý kiến đóng góp của bạn giúp nâng cao trải nghiệm giải quyết thủ tục hành chính tại phường
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-action shrink-0"
          onClick={() => onOpenFeedback('Đăng ký khai sinh', 'HS-2026-00128')}
        >
          <Star size={18} weight="fill" /> Gửi đánh giá mới
        </button>
      </section>

      {/* Lịch sử đánh giá */}
      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Lịch sử đánh giá của bạn</h2>
          </div>
        </div>

        <div className="flex items-center justify-center py-12 text-sm text-slate-400 italic">
          ⚠️ API lịch sử đánh giá dịch vụ sẽ được tích hợp sau.
        </div>
      </section>
    </div>
  );
}
