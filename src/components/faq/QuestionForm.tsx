import { EnvelopeSimple, PaperPlaneTilt } from '@phosphor-icons/react';

export function QuestionForm() {
  return (
    <form className="question-form" onSubmit={event => event.preventDefault()}>
      <div className="question-form-heading">
        <span><PaperPlaneTilt size={24} aria-hidden="true" /></span>
        <div><p>Chưa có câu trả lời?</p><h2>Gửi câu hỏi đến bộ phận quản lý</h2></div>
      </div>

      <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">Chức năng gửi câu hỏi chưa khả dụng. Bạn có thể xem câu trả lời thường gặp; chưa có câu hỏi nào được gửi đến cán bộ.</p>

      <div className="question-field">
        <label htmlFor="question-topic">Chủ đề</label>
        <select id="question-topic" name="topic" defaultValue="" disabled>
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
        <textarea id="question-content" name="question" rows={5} disabled placeholder="Chưa hỗ trợ gửi câu hỏi" />
    </div>

      <div className="question-field">
        <label htmlFor="question-contact">Email hoặc số điện thoại <span>(không bắt buộc)</span></label>
        <div className="question-contact-input">
          <EnvelopeSimple size={20} aria-hidden="true" />
          <input id="question-contact" name="contact" type="text" autoComplete="email" disabled placeholder="Chưa hỗ trợ gửi câu hỏi" />
        </div>
      </div>

      <button type="submit" className="question-submit disabled:cursor-not-allowed disabled:opacity-50" disabled>Gửi câu hỏi <PaperPlaneTilt size={18} aria-hidden="true" /></button>
    </form>
  );
}
