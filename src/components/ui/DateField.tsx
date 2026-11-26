import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ChangeEvent, type FocusEvent, type InputHTMLAttributes } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { validCalendarDate } from '@/lib/calendarRules';

/**
 * FE-19: ô ngày luôn hiển thị dd/mm/yyyy, không phụ thuộc ngôn ngữ trình duyệt.
 * Giá trị trao đổi với form vẫn là ISO `yyyy-mm-dd` (chuỗi rỗng khi chưa đủ/không hợp lệ), giống `<input type="date">`,
 * nên dùng được cả `{...register('x')}` lẫn `value` + `onChange={e => set(e.target.value)}`.
 * Nút lịch mở bộ chọn ngày của trình duyệt (input ẩn) để chọn bằng chuột.
 */
export type DateFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'> & {
  value?: string;
  defaultValue?: string;
  /** class của khung bao (mặc định chiếm hết chiều ngang) */
  wrapperClassName?: string;
};

type FieldHandle = {
  name?: string;
  type: string;
  value: string;
  readonly disabled: boolean;
  focus: () => void;
  blur: () => void;
  scrollIntoView: (options?: ScrollIntoViewOptions) => void;
};

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isoToDisplay(iso?: string | null) {
  const match = ISO.exec(iso ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

/** Nhận gõ dd/mm/yyyy (tự chèn "/"), hoặc dán ISO. Trả về chữ hiển thị và giá trị ISO ('' nếu chưa hợp lệ). */
export function parseDateText(raw: string): { display: string; iso: string } {
  const trimmed = raw.trim();
  if (ISO.test(trimmed)) return { display: isoToDisplay(trimmed), iso: validCalendarDate(trimmed) ? trimmed : '' };
  const digits = trimmed.replace(/\D/g, '').slice(0, 8);
  const display = digits.length > 4
    ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  if (digits.length < 8) return { display, iso: '' };
  const iso = `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  return { display, iso: validCalendarDate(iso) ? iso : '' };
}

export const DateField = forwardRef<FieldHandle, DateFieldProps>(function DateField(
  { value, defaultValue, onChange, onBlur, name, min, max, disabled, className, wrapperClassName, placeholder = 'dd/mm/yyyy', ...rest },
  ref,
) {
  const textRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const isoRef = useRef(value ?? defaultValue ?? '');
  const disabledRef = useRef(Boolean(disabled));
  disabledRef.current = Boolean(disabled);
  const [display, setDisplay] = useState(() => isoToDisplay(isoRef.current));

  // Đối tượng ổn định cho React Hook Form: RHF đọc/ghi `.value` (reset, setValue) và gọi `.focus()` khi lỗi.
  const handle = useRef<FieldHandle>({
    name,
    type: 'text',
    get value() { return isoRef.current; },
    set value(next: string) {
      const iso = next ?? '';
      if (iso === isoRef.current) return;
      isoRef.current = iso;
      setDisplay(isoToDisplay(iso));
    },
    get disabled() { return disabledRef.current; },
    focus: () => textRef.current?.focus(),
    blur: () => textRef.current?.blur(),
    scrollIntoView: options => textRef.current?.scrollIntoView(options),
  }).current;
  handle.name = name;
  useImperativeHandle(ref, () => handle, [handle]);

  // Chế độ điều khiển (value + onChange): đồng bộ khi giá trị ngoài đổi, không xóa chữ đang gõ dở.
  useEffect(() => {
    if (value === undefined || value === isoRef.current) return;
    isoRef.current = value;
    setDisplay(isoToDisplay(value));
  }, [value]);

  const emit = (iso: string) => {
    isoRef.current = iso;
    onChange?.({ target: handle, currentTarget: handle, type: 'change' } as unknown as ChangeEvent<HTMLInputElement>);
  };

  const openPicker = () => {
    const picker = pickerRef.current;
    if (!picker || disabled) return;
    picker.value = isoRef.current;
    try { picker.showPicker(); } catch { textRef.current?.focus(); }
  };

  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <input
        {...rest}
        ref={textRef}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        maxLength={10}
        disabled={disabled}
        value={display}
        onChange={event => {
          const next = parseDateText(event.target.value);
          setDisplay(next.display);
          if (next.iso !== isoRef.current) emit(next.iso);
        }}
        onBlur={() => onBlur?.({ target: handle, currentTarget: handle, type: 'blur' } as unknown as FocusEvent<HTMLInputElement>)}
        className={cn(className, 'pr-10')}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={openPicker}
        aria-label="Mở lịch chọn ngày"
        className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-50"
      >
        <CalendarBlank size={18} aria-hidden="true" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        min={min}
        max={max}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
        onChange={event => {
          const iso = event.target.value;
          if (iso === isoRef.current) return;
          setDisplay(isoToDisplay(iso));
          emit(iso);
        }}
      />
    </div>
  );
});
