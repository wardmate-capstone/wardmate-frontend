import { useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { CaretDown, Check, MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type ListSelectOption = { value: string; label: string };

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
};

// Bỏ dấu tiếng Việt để tìm "dat dai" vẫn ra "đất đai"
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

/**
 * Ô chọn thay cho <select> gốc.
 * Danh sách gốc của trình duyệt bung ra ngoài hộp thoại và không xuống dòng được với tên thủ tục dài,
 * nên danh sách ở đây được hiển thị ngay trong luồng form (đẩy nội dung bên dưới xuống), tự xuống dòng
 * và cuộn bên trong khi quá dài.
 */
export function ListSelect({ id, value, onChange, onBlur, options, placeholder, disabled, invalid, describedBy, searchable, searchPlaceholder = 'Tìm kiếm…' }: ListSelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = `${id}-listbox`;
  const selected = options.find((o) => o.value === value);
  const optionId = (index: number) => `${id}-option-${index}`;

  const visible = useMemo(() => {
    const q = normalize(query);
    if (!searchable || !q) return options;
    const words = q.split(/\s+/);
    return options.filter((o) => {
      const label = normalize(o.label);
      return words.every((w) => label.includes(w));
    });
  }, [options, query, searchable]);

  const openList = () => {
    setQuery('');
    const index = options.findIndex((o) => o.value === value);
    setActive(index >= 0 ? index : 0);
    setOpen(true);
  };
  const close = (refocus = false) => {
    setOpen(false);
    setQuery('');
    if (refocus) trigger.current?.focus();
  };
  const choose = (index: number) => {
    const option = visible[index];
    if (!option) return;
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
    const last = visible.length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.min(i + 1, last));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        if (open && !fromSearch) { event.preventDefault(); setActive(0); }
        break;
      case 'End':
        if (open && !fromSearch) { event.preventDefault(); setActive(last); }
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
    <div ref={root} className="min-w-0" onBlur={onRootBlur}>
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
        data-value={value}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(event) => onKeyDown(event)}
        className={cn(
          'flex min-h-12 w-full min-w-0 items-center gap-2 rounded-xl border bg-white py-2.5 pl-3.5 pr-3 text-left text-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50',
          invalid ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : 'border-slate-300 hover:border-slate-400 focus:border-red-600 focus:ring-red-100',
          open && !invalid && 'border-red-600 ring-4 ring-red-100',
        )}
      >
        <span className={cn('min-w-0 flex-1 break-words leading-5', selected ? 'text-slate-900' : 'text-slate-500')}>
          {selected?.label ?? placeholder}
        </span>
        <CaretDown size={16} aria-hidden="true" className={cn('shrink-0 text-slate-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {searchable && (
            <div className="border-b border-slate-200 p-2">
              <div className="relative">
                <MagnifyingGlass size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={search}
                  type="text"
                  role="searchbox"
                  aria-label={searchPlaceholder}
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                  autoComplete="off"
                  value={query}
                  placeholder={searchPlaceholder}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
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
            {visible.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-slate-500">{query ? 'Không tìm thấy kết quả phù hợp.' : 'Không có lựa chọn.'}</li>
            )}
            {visible.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  // Giữ focus hiện tại để không kích hoạt blur trước khi chọn
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2.5 text-sm leading-5 break-words',
                    index === active ? 'bg-red-50 text-red-900' : 'text-slate-800',
                    isSelected && 'font-semibold',
                  )}
                >
                  <span className="min-w-0 flex-1">{option.label}</span>
                  {isSelected && <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-red-700" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
