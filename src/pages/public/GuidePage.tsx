import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CaretDown, Check, Info, ShieldCheck } from '@phosphor-icons/react';
import { buttonVariants } from '@/components/ui';
import { guideSteps } from '@/data/preparationGuide';
import { PublicPageIntro } from './PublicPageIntro';

const stepActions: Partial<Record<string, { to: string; label: string }>> = {
  'tim-thu-tuc': { to: '/thu-tuc', label: 'Tra cứu thủ tục hành chính' },
  'tai-khoan': { to: '/dang-nhap?returnTo=%2Fcitizen%3Fsection%3Ddossiers_all', label: 'Đăng nhập để chuẩn bị hồ sơ' },
  'bo-sung': { to: '/citizen?section=dossiers_all', label: 'Theo dõi hồ sơ của tôi' },
};

export function GuidePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView({ block: 'start' });
    target?.querySelector('h2')?.focus({ preventScroll: true });
  }, [hash]);

  return (
    <div className="public-guide">
      <PublicPageIntro
        id="guide-title"
        label="Hướng dẫn thực hiện"
        title="Hướng dẫn thực hiện"
        description="Các bước chuẩn bị giấy tờ, gửi hồ sơ tiền kiểm và theo dõi phản hồi của cán bộ."
        aside={
          <figure className="guide-hero-photo">
            <img src="/van-mieu-quoc-tu-giam-1.jpg" alt="" width={1211} height={854} />
            <figcaption>Khuê Văn Các, Văn Miếu – Quốc Tử Giám</figcaption>
          </figure>
        }
      >
        <div className="public-masthead-actions">
          <Link to="#tim-thu-tuc" className={buttonVariants({ className: 'public-action' })}>Xem các bước</Link>
          <Link to="/citizen?section=dossiers_all" className="public-text-link">Hồ sơ của tôi</Link>
        </div>
      </PublicPageIntro>

      <div className="public-shell public-reading-layout">
        <nav aria-label="Mục lục hướng dẫn" className="guide-contents">
          <h2>Các bước thực hiện</h2>
          <ol>
            {guideSteps.map((step) => (
              <li key={step.id}>
                <Link to={'#' + step.id} aria-current={hash === '#' + step.id ? 'location' : undefined}>
                  <span aria-hidden="true">{step.number}</span>
                  {step.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="public-reading-body">
          <div className="public-notice">
            <ShieldCheck size={23} aria-hidden="true" />
            <p><strong>Tiền kiểm giúp bạn rà soát giấy tờ trước khi đến quầy.</strong> Cơ quan có thẩm quyền tiếp nhận chính thức và giải quyết thủ tục.</p>
          </div>

          <details className="guide-preparation">
            <summary>Trước khi bắt đầu <CaretDown size={17} aria-hidden="true" /></summary>
            <ul>
              <li>Email đăng ký có thể nhận thư để khôi phục mật khẩu khi cần.</li>
              <li>Thông tin cá nhân và giấy tờ theo đúng trường hợp của bạn.</li>
              <li>Ảnh hoặc bản quét rõ nét, đầy đủ nội dung và các góc giấy tờ.</li>
            </ul>
            <p>Danh sách giấy tờ cụ thể nằm ở <Link to="/thu-tuc">trang chi tiết thủ tục</Link> và trong hồ sơ của bạn.</p>
          </details>

          <ol className="guide-sequence">
            {guideSteps.map((step) => {
              const action = stepActions[step.id];
              return (
              <li key={step.id} id={step.id} className="guide-step">
                <span className="guide-step-number" aria-hidden="true">{step.number}</span>
                <section aria-labelledby={step.id + '-title'}>
                  <h2 id={step.id + '-title'} tabIndex={-1}>{step.title}</h2>
                  <p>{step.description}</p>
                  <ul>
                    {step.tasks.map(task => <li key={task}><Check size={17} aria-hidden="true" /><span>{task}</span></li>)}
                  </ul>
                  <div className="guide-outcome"><Info size={18} aria-hidden="true" /><p><strong>Sau bước này</strong> {step.outcome}</p></div>
                  {action && <Link to={action.to} className="public-text-link underline underline-offset-4">{action.label}</Link>}
                </section>
              </li>
              );
            })}
          </ol>

          <section className="guide-support" aria-labelledby="guide-help">
            <h2 id="guide-help">Khi cần hỗ trợ</h2>
            <details>
              <summary>Tôi quên mật khẩu hoặc chưa nhận được email? <CaretDown size={17} aria-hidden="true" /></summary>
              <p>Dùng email hoặc tên đăng nhập đã đăng ký tại trang quên mật khẩu. Kiểm tra cả thư rác, nhập mã 6 số trong 5 phút. Đợi ít nhất 60 giây trước khi yêu cầu gửi lại.</p>
              <Link to="/quen-mat-khau" className="public-text-link">Khôi phục mật khẩu <ArrowRight size={16} aria-hidden="true" /></Link>
            </details>
            <details>
              <summary>Giấy tờ đã sẵn sàng nhưng chưa có QR? <CaretDown size={17} aria-hidden="true" /></summary>
              <p>Mở chi tiết hồ sơ, tạo PDF từ bản khai đã sẵn sàng rồi tải lại mã QR. Nếu tạo PDF thất bại, giữ hồ sơ và thử lại theo thông báo trên màn hình.</p>
            </details>
            <Link to="/hoi-dap" className="public-text-link">Xem thêm câu hỏi thường gặp <ArrowRight size={16} aria-hidden="true" /></Link>
          </section>
        </div>
      </div>
    </div>
  );
}
