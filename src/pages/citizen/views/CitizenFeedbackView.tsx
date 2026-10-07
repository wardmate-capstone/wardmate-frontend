import { Star } from '@phosphor-icons/react';

interface CitizenFeedbackViewProps {
  onOpenFeedback: (procedure: string, code?: string) => void;
}

export function CitizenFeedbackView({ onOpenFeedback }: CitizenFeedbackViewProps) {
  const previousReviews = [
    {
      id: 'rev-1',
      procedure: 'Chứng thực bản sao từ bản chính',
      rating: 5,
      date: '28/09/2026',
      tags: ['Thủ tục rõ ràng', 'Cán bộ nhiệt tình', 'Tiền kiểm nhanh chóng'],
      comment: 'Hệ thống tiền kiểm hồ sơ trực tuyến rất thuận tiện, đến nơi chỉ mất 5 phút đối chiếu là xong.',
      response: 'UBND Phường An Khánh chân thành cảm ơn phản hồi tích cực của bạn.',
    },
    {
      id: 'rev-2',
      procedure: 'Xác nhận tình trạng hôn nhân',
      rating: 4,
      date: '15/08/2026',
      tags: ['Hướng dẫn dễ hiểu'],
      comment: 'Giao diện thân thiện, dễ tra cứu danh mục giấy tờ.',
      response: 'Cảm ơn bạn đã đóng góp ý kiến để hoàn thiện chất lượng dịch vụ.',
    },
  ];

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

        <div className="divide-y divide-slate-100 p-5 space-y-4">
          {previousReviews.map((rev) => (
            <div key={rev.id} className="pt-4 first:pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-sm font-bold text-slate-900">{rev.procedure}</strong>
                  <small className="block text-[11px] text-slate-400">Đánh giá ngày: {rev.date}</small>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={15} weight={i < rev.rating ? 'fill' : 'regular'} />
                  ))}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {rev.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-xs text-slate-700 leading-relaxed italic">"{rev.comment}"</p>

              {rev.response && (
                <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block mb-0.5">Phản hồi từ cơ quan Một cửa:</span>
                  {rev.response}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
