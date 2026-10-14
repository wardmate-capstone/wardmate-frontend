import { useEffect, useState } from 'react';
import { Button, Modal } from '@/components/ui';

export function useUnsavedChanges(dirty: boolean, busy = false) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const requestClose = (action: () => void) => {
    if (busy) return;
    if (dirty) setPending(() => action);
    else action();
  };
  const confirmation = <Modal open={Boolean(pending)} onOpenChange={open => { if (!open) setPending(null); }} title="Bỏ thay đổi chưa lưu?" description="Các thông tin bạn vừa chỉnh sửa sẽ bị mất nếu tiếp tục đóng." footer={<>
    <Button variant="outline" onClick={() => setPending(null)}>Tiếp tục chỉnh sửa</Button>
    <Button onClick={() => { const action = pending; setPending(null); action?.(); }}>Bỏ thay đổi</Button>
  </>}><p className="text-sm text-slate-600">Bạn có thể quay lại để kiểm tra và lưu trước khi rời màn hình.</p></Modal>;
  return { requestClose, confirmation };
}
