import {
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

const steps = [
  {
    label: 'Tìm đúng thủ tục',
    detail: 'Tra cứu bằng tên thủ tục hoặc nhu cầu của bạn để xem đúng hướng dẫn.',
    icon: MagnifyingGlassIcon,
  },
  {
    label: 'Chuẩn bị giấy tờ',
    detail: 'Đọc điều kiện và hoàn thành danh sách giấy tờ theo từng mục rõ ràng.',
    icon: ClipboardDocumentListIcon,
  },
  {
    label: 'Nhận góp ý tiền kiểm',
    detail: 'Cán bộ kiểm tra trước và chỉ rõ nội dung cần bổ sung nếu có.',
    icon: ShieldCheckIcon,
  },
  {
    label: 'Nhận QR sau khi duyệt',
    detail: 'Mang giấy tờ và mã QR đến cơ quan để thực hiện tiếp nhận chính thức.',
    icon: QrCodeIcon,
  },
];

export function JourneySteps() {
  return (
    <section id="quy-trinh" className="journey-section scroll-mt-24" aria-labelledby="journey-title">
      <div className="journey-workspace">
        <header className="journey-overview">
          <div className="journey-overview-pattern" aria-hidden="true" />
          <div className="journey-overview-content">
            <span className="journey-overview-icon">
              <CheckBadgeIcon className="size-8 text-[#8F1515]" aria-hidden="true" />
            </span>
            <p className="journey-eyebrow">Quy trình chuẩn bị hồ sơ</p>
            <h2 id="journey-title">
              Chuẩn bị hồ sơ<br />qua 4 bước
            </h2>
            <a href="#trang-chu" className="journey-start-link group">
              <span>Bắt đầu tra cứu</span>
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
          </div>
        </header>

        <div className="journey-timeline-wrap">
          <div className="journey-timeline-heading">
            <p>Hành trình của bạn</p>
            <span>4 bước tiền kiểm</span>
          </div>
          <ol className="journey-timeline" role="list">
            {steps.map(({ label, detail, icon: Icon }, index) => (
              <li key={label} className="journey-timeline-item" role="listitem">
                <div className="journey-node" aria-hidden="true">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <article className="journey-step-card">
                  <span className="journey-step-icon">
                    <Icon className="size-6 text-[#B91C1C]" aria-hidden="true" />
                  </span>
                  <div className="journey-step-copy">
                    <p>Bước {index + 1}</p>
                    <h3>{label}</h3>
                    <span>{detail}</span>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
