import { useState } from 'react';
import { Sparkle } from '@phosphor-icons/react';
import { Button, textareaClass } from '@/components/ui';
import { formatDateTime } from '@/lib/dateFormat';
import type { CommentDto } from '@/lib/api/workflow';

export const QUICK_COMMENT_TEMPLATES = [
  'Ảnh chụp/bản scan chưa rõ nét, vui lòng chụp lại góc thẳng đủ 4 góc.',
  'Cần ký và ghi rõ họ tên người làm đơn ở trang cuối.',
  'Thông tin họ tên hoặc ngày sinh chưa khớp chính xác với CCCD.',
  'Vui lòng tải lại bản chính hoặc bản sao có chứng thực theo đúng quy định.',
];

/**
 * Nhận xét gắn trực tiếp với một mục (giấy tờ trong danh mục hoặc trường tờ khai).
 * Hiện các nhận xét đang mở của mục và ô nhập nhận xét mới ngay tại chỗ,
 * để cán bộ không phải chuyển sang tab Nhận xét rồi chọn lại mục.
 */
export function TargetComments({
  idPrefix,
  label,
  comments,
  editable,
  composerOpen,
  onCloseComposer,
  onSave,
  onWithdraw,
}: {
  idPrefix: string;
  label: string;
  comments: CommentDto[];
  editable: boolean;
  composerOpen: boolean;
  onCloseComposer: () => void;
  /** Trả về thông báo lỗi nếu lưu thất bại */
  onSave: (text: string) => Promise<string | undefined>;
  onWithdraw: (comment: CommentDto) => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const open = comments.filter(x => x.status === 'OPEN');
  const textId = `${idPrefix}-comment-text`;

  async function save() {
    const value = text.trim();
    if (!value) { setError('Nhập nội dung nhận xét.'); return; }
    if (value.length > 4000) { setError('Nhận xét tối đa 4.000 ký tự.'); return; }
    setSaving(true);
    setError('');
    const failure = await onSave(value);
    setSaving(false);
    if (failure) { setError(failure); return; }
    setText('');
    onCloseComposer();
  }

  if (!open.length && !composerOpen) return null;

  return (
    <div className="space-y-2">
      {open.map(x => (
        <div key={x.id} className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
          <div className="min-w-0">
            <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{x.commentText}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Cần công dân chỉnh sửa · {formatDateTime(x.createdAt)}</p>
          </div>
          {editable && (
            <Button size="small" variant="dangerGhost" className="h-7 min-h-0 shrink-0 px-2 text-xs" onClick={() => onWithdraw(x)}>
              Rút nhận xét
            </Button>
          )}
        </div>
      ))}

      {composerOpen && editable && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <label htmlFor={textId} className="block text-xs font-bold text-slate-700">
            Nhận xét mới cho: <span className="font-semibold text-slate-900">{label}</span>
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <Sparkle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            {QUICK_COMMENT_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                title={tpl}
                onClick={() => setText(current => (current ? `${current}\n${tpl}` : tpl))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              >
                + {tpl.slice(0, 36)}…
              </button>
            ))}
          </div>
          <textarea
            id={textId}
            rows={3}
            maxLength={4000}
            autoFocus
            value={text}
            disabled={saving}
            onChange={e => { setText(e.target.value); setError(''); }}
            placeholder="Nhập điểm công dân cần chỉnh sửa…"
            className={textareaClass}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${textId}-error` : undefined}
          />
          {error && <p id={`${textId}-error`} role="alert" className="text-xs text-red-700">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="small" loading={saving} onClick={() => void save()}>Lưu nhận xét</Button>
            <Button size="small" variant="ghost" disabled={saving} onClick={() => { setText(''); setError(''); onCloseComposer(); }}>Hủy</Button>
            <span className="ml-auto text-[11px] text-slate-400">{text.length}/4.000 ký tự</span>
          </div>
        </div>
      )}
    </div>
  );
}
