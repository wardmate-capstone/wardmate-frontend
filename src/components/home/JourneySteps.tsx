import {
  ArrowRight,
  ClipboardText as ClipboardList,
  FileMagnifyingGlass as FileSearch,
  QrCode,
  SealCheck,
  ShieldCheck,
} from '@phosphor-icons/react';

const steps = [
  { label: 'Tìm đúng thủ tục', detail: 'Tra cứu bằng tên thủ tục hoặc nhu cầu của bạn để xem đúng hướng dẫn.', icon: FileSearch },
  { label: 'Chuẩn bị giấy tờ', detail: 'Đọc điều kiện và hoàn thành danh sách giấy tờ theo từng mục rõ ràng.', icon: ClipboardList },
  { label: 'Nhận góp ý tiền kiểm', detail: 'Cán bộ kiểm tra trước và chỉ rõ nội dung cần bổ sung nếu có.', icon: ShieldCheck },
  { label: 'Nhận QR sau khi duyệt', detail: 'Mang giấy tờ và mã QR đến cơ quan để thực hiện tiếp nhận chính thức.', icon: QrCode },
];

export function JourneySteps() {
  return (
    <section className="journey-section" aria-labelledby="journey-title">
      <div className="journey-workspace">
        <div className="journey-overview">
          <div className="journey-overview-pattern" aria-hidden="true" />
          <div className="journey-overview-content">
            <span className="journey-overview-icon"><SealCheck size={27} aria-hidden="true" /></span>
            <p className="journey-eyebrow">Quy trình chuẩn bị hồ sơ</p>
            <h2 id="journey-title">Chuẩn bị hồ sơ<br />qua 4 bước</h2>
            <a href="#trang-chu" className="journey-start-link">Bắt đầu tra cứu <ArrowRight size={18} aria-hidden="true" /></a>
          </div>
        </div>

        <div className="journey-timeline-wrap">
          <div className="journey-timeline-heading"><p>Hành trình của bạn</p></div>
          <ol className="journey-timeline">
            {steps.map(({ label, detail, icon: Icon }, index) => (
              <li key={label} className="journey-timeline-item">
                <div className="journey-node" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span></div>
                <div className="journey-step-card">
                  <span className="journey-step-icon"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span>
                  <div className="journey-step-copy"><p>Bước {index + 1}</p><h3>{label}</h3><span>{detail}</span></div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
