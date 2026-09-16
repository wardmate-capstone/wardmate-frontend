import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle, EnvelopeSimple, PaperPlaneTilt } from '@phosphor-icons/react';

export function QuestionForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="question-form-success" role="status" aria-live="polite">
        <span><CheckCircle size={30} weight="fill" aria-hidden="true" /></span>
        <p>Đã ghi nhận câu hỏi</p>
        <h2>Cảm ơn bạn đã gửi thắc mắc</h2>
        <div>Bộ phận quản lý hệ thống sẽ xem nội dung và phản hồi qua thông tin liên hệ nếu bạn đã cung cấp.</div>
        <button type="button" onClick={() => setSubmitted(false)}>Gửi câu hỏi khác <ArrowRight size={17} aria-hidden="true" /></button>
      </div>
    );
  }

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <div className="question-form-heading">
        <span><PaperPlaneTilt size={24} aria-hidden="true" /></span>
        <div><p>Chưa có câu trả lời?</p><h2>Gửi câu hỏi đến bộ phận quản lý</h2></div>
      </div>

      <div className="question-field">
        <label htmlFor="question-topic">Chủ đề</label>
        <select id="question-topic" name="topic" defaultValue="" required>
          <option value="" disabled>Chọn chủ đề phù hợp</option>
          <option value="tra-cuu">Tra cứu thủ tục</option>
          <option value="tai-khoan">Tài khoản</option>
          <option value="ho-so">Hồ sơ và tài liệu</option>
          <option value="tien-kiem">Tiền kiểm và bổ sung</option>
          <option value="khac">Vấn đề khác</option>
        </select>
      </div>

      <div className="question-field">
        <label htmlFor="question-content">Câu hỏi của bạn</label>
        <textarea id="question-content" name="question" rows={5} minLength={10} required placeholder="Mô tả nội dung bạn cần được giải đáp" />
    </div>

      <div className="question-field">
        <label htmlFor="question-contact">Email hoặc số điện thoại <span>(không bắt buộc)</span></label>
        <div className="question-contact-input">
          <EnvelopeSimple size={20} aria-hidden="true" />
          <input id="question-contact" name="contact" type="text" autoComplete="email" placeholder="Dùng để nhận phản hồi" />
        </div>
      </div>

      <button type="submit" className="question-submit">Gửi câu hỏi <PaperPlaneTilt size={18} aria-hidden="true" /></button>
    </form>
  );
}
