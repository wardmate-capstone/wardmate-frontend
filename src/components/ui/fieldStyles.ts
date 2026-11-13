/**
 * Class chuẩn cho ô nhập trong form, dùng chung với <Input>:
 * viền slate-300, bo rounded-xl, focus viền đỏ + quầng đỏ nhạt, ô lỗi (aria-invalid) viền đỏ đậm.
 */
const FIELD_FOCUS = 'focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-100';
const FIELD_STATE = 'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 aria-[invalid=true]:border-red-700';

/** Ô nhập nhiều dòng (lý do, ghi chú, nhận xét…) */
export const textareaClass = `w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors ${FIELD_FOCUS} ${FIELD_STATE}`;

/** Ô chọn trong form (khác ô lọc trên thanh công cụ dùng <Select>) */
export const formSelectClass = `min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors ${FIELD_FOCUS} ${FIELD_STATE}`;
