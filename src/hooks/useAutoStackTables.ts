import { useEffect, type RefObject } from 'react';

const ACTION_HEADER = /^thao tác$/i;

/**
 * Bảng danh sách bản ghi trong vùng `root` được hiển thị dạng thẻ có nhãn trên điện thoại
 * (CSS `table.mgr-stack` trong styles/workspace-ui.css). Hook gắn lớp `mgr-stack` và
 * `data-label` lấy từ tiêu đề cột cho từng ô, nên không phải viết nhãn tay ở mỗi bảng.
 * Cột "Thao tác" hoặc cột không tiêu đề thành hàng nút cuối thẻ. Bảng cần giữ cuộn ngang
 * (số liệu so sánh) gắn lớp `no-stack`.
 */
export function useAutoStackTables(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const apply = () => {
      root.querySelectorAll<HTMLTableElement>('table:not(.no-stack)').forEach(table => {
        // Tiêu đề chỉ dành cho trình đọc màn hình (sr-only) coi như cột thao tác, không hiện nhãn.
        const heads = Array.from(table.querySelectorAll('thead th'), th => th.querySelector('.sr-only') && !th.querySelector(':scope > :not(.sr-only)') && th.textContent?.trim() === th.querySelector('.sr-only')?.textContent?.trim() ? '' : th.textContent?.trim() ?? '');
        if (!heads.length) return;
        // Chỉ ghi khi thiếu để không tự kích hoạt lại MutationObserver.
        if (!table.classList.contains('mgr-stack')) table.classList.add('mgr-stack');
        table.querySelectorAll('tbody tr').forEach(row => {
          Array.from(row.children).forEach((cell, index) => {
            if (!(cell instanceof HTMLTableCellElement) || cell.colSpan > 1) return;
            const label = heads[index] ?? '';
            const action = label === '' || ACTION_HEADER.test(label);
            if (!cell.hasAttribute('data-label')) cell.setAttribute('data-label', action ? '' : label);
            if (action && !cell.classList.contains('mgr-stack-actions')) cell.classList.add('mgr-stack-actions');
          });
        });
      });
    };
    apply();
    // React có thể thay className của bảng hoặc thêm dòng mới: quan sát cả hai để gắn lại.
    const observer = new MutationObserver(apply);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [ref]);
}
