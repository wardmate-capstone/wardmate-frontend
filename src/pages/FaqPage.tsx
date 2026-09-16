import * as Accordion from '@radix-ui/react-accordion';
import { ArrowRight, CaretDown, Question } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { QuestionForm } from '@/components/faq/QuestionForm';

const questions = [
  {
    question: 'Tiền kiểm hồ sơ là gì?',
    answer: 'Tiền kiểm là bước cán bộ kiểm tra trước để giúp bạn chuẩn bị hồ sơ đầy đủ trước khi đến cơ quan tiếp nhận. Đây chưa phải là bước nộp hồ sơ hành chính chính thức.',
  },
  {
    question: 'Gửi hồ sơ tiền kiểm có nghĩa là đã nộp hồ sơ chưa?',
    answer: 'Chưa. Hồ sơ chỉ được tiếp nhận chính thức khi bạn đến cơ quan có thẩm quyền, xuất trình giấy tờ và được cán bộ xác nhận tiếp nhận.',
  },
  {
    question: 'Tải tài liệu lên thành công có nghĩa là giấy tờ đã hợp lệ chưa?',
    answer: 'Chưa. Tải lên thành công chỉ xác nhận hệ thống đã nhận được tệp. Cán bộ sẽ xem nội dung trong quá trình tiền kiểm và hướng dẫn nếu giấy tờ cần được chụp lại hoặc bổ sung.',
  },
  {
    question: 'Nếu được yêu cầu bổ sung, tôi có phải làm lại toàn bộ hồ sơ không?',
    answer: 'Không. Hệ thống giữ nguyên những nội dung không bị góp ý và đưa bạn đến đúng thông tin hoặc tài liệu cần sửa. Sau khi hoàn tất, bạn gửi lại để cán bộ tiền kiểm lần nữa.',
  },
  {
    question: 'Khi nào hệ thống tạo mã QR?',
    answer: 'Mã QR chỉ được tạo sau khi cán bộ duyệt tiền kiểm. Mã QR đại diện cho phiên bản hồ sơ đã duyệt tiền kiểm, không phải giấy hẹn, số thứ tự hoặc kết quả giải quyết thủ tục.',
  },
];

export function FaqPage() {
  return (
    <div className="faq-page">
      <section className="faq-hero" aria-labelledby="faq-page-title">
        <div className="faq-hero-pattern" aria-hidden="true" />
        <div className="faq-hero-simple">
          <span className="faq-hero-icon"><Question size={26} aria-hidden="true" /></span>
          <p className="faq-eyebrow">Trung tâm hỗ trợ</p>
          <h1 id="faq-page-title">Câu hỏi thường gặp</h1>
          <p>Tìm hiểu những thông tin quan trọng khi tra cứu, chuẩn bị và gửi hồ sơ tiền kiểm.</p>
        </div>
      </section>

      <section className="faq-main" aria-label="Hỏi đáp và gửi câu hỏi">
        <div className="faq-list-column">
          <div className="faq-list-heading"><p>Giải đáp nhanh</p><h2>5 điều bạn cần biết</h2></div>
          <Accordion.Root type="single" collapsible className="faq-page-accordion">
            {questions.map((item, index) => (
              <Accordion.Item value={`question-${index}`} key={item.question} className="faq-page-item">
                <Accordion.Header>
                  <Accordion.Trigger className="faq-page-trigger group">
                    <span className="faq-question-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="flex-1">{item.question}</span>
                    <span className="faq-toggle-icon"><CaretDown size={20} aria-hidden="true" /></span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="faq-page-answer"><p>{item.answer}</p></Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        <aside className="faq-question-column" aria-label="Gửi câu hỏi mới"><QuestionForm /></aside>
      </section>

      <section className="faq-next-step">
        <div><p>Bạn đã hiểu rõ quy trình?</p><h2>Tra cứu thủ tục cần chuẩn bị</h2><span>Xem hướng dẫn công khai trước, đăng nhập khi bạn muốn lưu hoặc gửi hồ sơ tiền kiểm.</span></div>
        <Link to="/#trang-chu">Tra cứu thủ tục <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
