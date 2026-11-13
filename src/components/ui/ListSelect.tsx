import { useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { CaretDown, Check, MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type ListSelectOption = {
  value: string;
  label: string;
  /** Dòng phụ nhỏ bên dưới tên (ví dụ: số hồ sơ, lý do chưa chọn được) */
  description?: string;
  /** Lựa chọn hiển thị nhưng không chọn được */
  disabled?: boolean;
  /** Tiêu đề nhóm; các lựa chọn liền nhau cùng nhóm được gom dưới một tiêu đề */
  group?: string;
};

export type ListSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: ListSelectOption[];
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** Hiện ô tìm kiếm phía trên danh sách (dùng cho danh mục dài như thủ tục hành chính) */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Tìm phía server: khi có, danh sách không tự lọc mà gọi hàm này với từ khóa, options là kết quả trả về */
  onSearch?: (query: string) => void;
  /** Đang tải lựa chọn (hiện dòng "Đang tải…" trong danh sách) */
  loading?: boolean;
  /** Nhãn hiển thị khi giá trị đang chọn không có trong options (vd: kết quả tìm kiếm khác) */
  selectedLabel?: string;
  /** Tên cho trình đọc màn hình khi ô chọn không có <label> đi kèm (vd: ô lọc trên thanh công cụ) */
  ariaLabel?: string;
  /** Danh sách nổi đè lên nội dung bên dưới thay vì đẩy xuống — dùng trên thanh công cụ/bộ lọc */
  floating?: boolean;
  /** Lớp bổ sung cho nút chọn (ghi đè kích thước, chữ) */
  className?: string;
};

/** Danh sách có nhiều hơn số lựa chọn này thì hiện ô tìm kiếm */
export const LIST_SEARCH_THRESHOLD = 7;

// Bỏ dấu tiếng Việt để tìm "dat dai" vẫn ra "đất đai"
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

/**
 * Ô chọn thay cho <select> gốc.
 * Danh sách gốc của trình duyệt bung ra ngoài hộp thoại và không xuống dòng được với tên thủ tục dài,
 * nên danh sách ở đây được hiển thị ngay trong luồng form (đẩy nội dung bên dưới xuống), tự xuống dòng
 * và cuộn bên trong khi quá dài.
 */
export function ListSelect({ id, value, onChange, onBlur, options, placeholder, disabled, invalid, describedBy, searchable, searchPlaceholder = 'Tìm kiếm…', onSearch, loading, selectedLabel, ariaLabel, floating, className }: ListSelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = `${id}-listbox`;
  const selected = options.find((o) => o.value === value);
  const shownLabel = selected?.label ?? (value ? selectedLabel : undefined);
  const optionId = (index: number) => `${id}-option-${index}`;

  const visible = useMemo(() => {
    const q = normalize(query);
    if (!searchable || !q || onSearch) return options;
    const words = q.split(/\s+/);
    return options.filter((o) => {
      const label = normalize(o.label);
      return words.every((w) => label.includes(w));
    });
  }, [options, query, searchable, onSearch]);
  const updateQuery = (next: string) => {
    setQuery(next);
    onSearch?.(next);
  };

  // Tìm lựa chọn chọn được kế tiếp theo hướng step (bỏ qua lựa chọn bị khóa)
  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < visible.length; i += dir) if (!visible[i].disabled) return i;
    return from;
  };
  const firstEnabled = (list: ListSelectOption[]) => list.findIndex((o) => !o.disabled);

  const openList = () => {
    if (query) updateQuery('');
    const index = options.findIndex((o) => o.value === value && !o.disabled);
    setActive(index >= 0 ? index : firstEnabled(options));
    setOpen(true);
  };
  const close = (refocus = false) => {
    setOpen(false);
    if (query) updateQuery('');
    if (refocus) trigger.current?.focus();
  };
  const choose = (index: number) => {
    const option = visible[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    close(true);
  };

  // Đưa con trỏ vào ô tìm kiếm khi mở danh sách
  useEffect(() => {
    if (open && searchable) search.current?.focus();
  }, [open, searchable]);

  // Đóng danh sách khi bấm ra ngoài; Esc chỉ đóng danh sách, không đóng hộp thoại
  // (Radix nghe Esc ở document nên phải chặn từ window)
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close(true);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  // Giữ mục đang chọn bằng bàn phím trong vùng nhìn thấy
  useEffect(() => {
    if (open && active >= 0) list.current?.querySelector<HTMLElement>(`#${CSS.escape(optionId(active))}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  // Phím điều hướng dùng chung cho nút chọn và ô tìm kiếm
  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>, fromSearch = false) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => step(i, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => step(i, -1));
        break;
      case 'Home':
        if (open && !fromSearch) { event.preventDefault(); setActive(step(-1, 1)); }
        break;
      case 'End':
        if (open && !fromSearch) { event.preventDefault(); setActive(step(visible.length, -1)); }
        break;
      case 'Enter':
        event.preventDefault();
        if (open) choose(active);
        else openList();
        break;
      case ' ':
        if (fromSearch) break; // cho phép gõ khoảng trắng khi tìm
        event.preventDefault();
        if (open) choose(active);
        else openList();
        break;
      case 'Tab':
        close();
        break;
    }
  };

  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!root.current?.contains(event.relatedTarget as Node)) {
      close();
      onBlur?.();
    }
  };

  const activeId = open && active >= 0 && active < visible.length ? optionId(active) : undefined;

  return (
    <div ref={root} className={cn('min-w-0', floating && 'relative')} onBlur={onRootBlur}>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={searchable ? undefined : activeId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        data-value={value}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(event) => onKeyDown(event)}
        className={cn(
          'flex min-h-12 w-full min-w-0 items-center gap-2 rounded-xl border bg-white py-2.5 pl-3.5 pr-3 text-left text-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50',
          invalid ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : 'border-slate-300 hover:border-slate-400 focus:border-red-600 focus:ring-red-100',
          open && !invalid && 'border-red-600 ring-4 ring-red-100',
          className,
        )}
      >
        <span className={cn('min-w-0 flex-1 break-words leading-5', shownLabel ? 'text-slate-900' : 'text-slate-500')}>
          {shownLabel ?? placeholder}
        </span>
        <CaretDown size={16} aria-hidden="true" className={cn('shrink-0 text-slate-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className={cn('mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white', floating ? 'absolute left-0 top-full z-30 w-full min-w-64 shadow-lg' : 'shadow-sm')}>
          {searchable && (
            <div className="border-b border-slate-200 p-2">
              <div className="relative">
                <MagnifyingGlass size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={search}
                  type="text"
                  role="searchbox"
                  aria-label={ariaLabel ? `${ariaLabel}: ${searchPlaceholder}` : searchPlaceholder}
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                  autoComplete="off"
                  value={query}
                  placeholder={searchPlaceholder}
                  onChange={(event) => {
                    updateQuery(event.target.value);
                    setActive(-1);
                  }}
                  onKeyDown={(event) => onKeyDown(event, true)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          )}
          <ul
            ref={list}
            id={listId}
            role="listbox"
            aria-labelledby={id}
            tabIndex={-1}
            className="max-h-64 overflow-y-auto overscroll-contain p-1"
          >
            {loading && <li role="status" className="px-3 py-2.5 text-sm text-slate-500">Đang tải…</li>}
            {!loading && visible.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-slate-500">{query ? 'Không tìm thấy kết quả phù hợp.' : 'Không có lựa chọn.'}</li>
            )}
            {visible.map((option, index) => {
              const isSelected = option.value === value;
              const header = option.group && option.group !== visible[index - 1]?.group ? option.group : undefined;
              return [
                header && (
                  <li key={`group-${header}-${index}`} role="presentation" className="px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 first:pt-1.5">
                    {header}
                  </li>
                ),
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  // Giữ focus hiện tại để không kích hoạt blur trước khi chọn
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => !option.disabled && setActive(index)}
                  onClick={() => choose(index)}
                  className={cn(
                    'flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm leading-5 break-words',
                    option.disabled ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-800',
                    !option.disabled && index === active && 'bg-red-50 text-red-900',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn('block', isSelected ? 'font-semibold' : 'font-medium')}>{option.label}</span>
                    {option.description && (
                      <span className={cn('mt-0.5 block text-xs leading-5', option.disabled ? 'text-slate-400' : 'text-slate-500')}>{option.description}</span>
                    )}
                  </span>
                  {isSelected && <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-red-700" />}
                </li>,
              ];
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
