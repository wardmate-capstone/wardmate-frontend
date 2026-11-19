import * as Accordion from '@radix-ui/react-accordion';
import { useState } from 'react';
import { ArrowRight, BookOpen, Files, MagnifyingGlass, Minus, Plus, X } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { PublicPageIntro } from './PublicPageIntro';

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
    answer: 'Mã QR chỉ được tạo sau khi cán bộ xác nhận giấy tờ sẵn sàng. Nếu chưa có mã, mở hồ sơ để tạo PDF từ bản khai đã hoàn tất rồi tải lại mã QR. QR không phải giấy hẹn, số thứ tự hoặc kết quả giải quyết thủ tục.',
  },
];

function searchText(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').trim();
}

export function FaqPage() {
  const [keyword, setKeyword] = useState('');
  const terms = searchText(keyword).split(/\s+/).filter(Boolean);
  const visibleQuestions = questions.filter(({ question, answer }) => {
    const text = searchText(question + ' ' + answer);
    return terms.every((term) => text.includes(term));
  });

  return (
    <div className="public-faq">
      <PublicPageIntro
        id="faq-page-title"
        label="Hỏi đáp"
        title="Câu hỏi thường gặp"
        description="Giải đáp về tiền kiểm, bổ sung giấy tờ và mã QR của hồ sơ."
      />
      <div className="public-shell public-faq-layout">
        <section className="public-faq-body" aria-label="Giải đáp câu hỏi thường gặp">
          <div className="public-faq-search" role="search" aria-label="Tìm trong câu hỏi thường gặp">
            <label htmlFor="faq-search-input">Tìm câu hỏi</label>
            <div>
              <MagnifyingGlass size={20} aria-hidden="true" />
              <input id="faq-search-input" type="search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Ví dụ: bổ sung giấy tờ, mã QR" />
              {keyword && <button type="button" aria-label="Xóa tìm kiếm câu hỏi" onClick={() => setKeyword('')}><X size={18} aria-hidden="true" /></button>}
            </div>
          </div>
          {terms.length > 0 && <p className="public-faq-count" role="status">{visibleQuestions.length ? `${visibleQuestions.length} câu hỏi phù hợp` : 'Không tìm thấy câu hỏi phù hợp.'}</p>}
          {visibleQuestions.length > 0 ? (
            <Accordion.Root type="single" collapsible className="public-faq-list">
              {visibleQuestions.map(({ question, answer }) => (
                <Accordion.Item value={question} key={question}>
                  <Accordion.Header>
                    <Accordion.Trigger className="public-faq-trigger">
                      <span>{question}</span>
                      <Plus className="faq-icon-plus" size={20} aria-hidden="true" />
                      <Minus className="faq-icon-minus" size={20} aria-hidden="true" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="public-faq-answer"><p>{answer}</p></Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          ) : <p className="public-faq-empty">Thử từ khóa ngắn hơn hoặc <button type="button" onClick={() => setKeyword('')}>xem tất cả câu hỏi</button>.</p>}
        </section>

        <aside className="public-faq-support" aria-labelledby="faq-support-title">
          <h2 id="faq-support-title">Hướng dẫn liên quan</h2>
          <Link to="/huong-dan"><BookOpen size={21} aria-hidden="true" /><span><strong>Hướng dẫn thực hiện</strong><small>Các bước chuẩn bị và gửi hồ sơ tiền kiểm</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
          <Link to="/thu-tuc"><Files size={21} aria-hidden="true" /><span><strong>Tra cứu thủ tục</strong><small>Danh sách giấy tờ và biểu mẫu</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
        </aside>
      </div>
    </div>
  );
}
