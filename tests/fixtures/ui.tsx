import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Input, Badge, Modal, Toaster, toast } from '../../src/components/ui';
import '../../src/styles/globals.css';

function Fixture() {
  const [open, setOpen] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);
  return <main className="mx-auto grid max-w-xl gap-6 p-6">
    <h1 className="text-2xl font-bold">Design System Core</h1>
    <Input label="Email" type="email" hint="Địa chỉ nhận thông báo" error="Vui lòng kiểm tra email." />
    <Button loading>Đang lưu</Button>
    <div className="flex flex-wrap gap-2"><Badge>Nháp</Badge><Badge variant="success">Hoàn tất</Badge><Badge variant="warning">Cần bổ sung</Badge></div>
    <Modal open={open} onOpenChange={setOpen} title="Xác nhận thay đổi" description="Kiểm tra thông tin trước khi tiếp tục."
      trigger={<Button>Mở hộp thoại</Button>} footer={<Button onClick={() => setOpen(false)}>Hoàn tất</Button>}>
      <Input label="Họ và tên" />
    </Modal>
    <Button variant="outline" onClick={() => toast.success('Đã lưu thay đổi.')}>Hiện thông báo</Button>
    <Button onClick={() => setExternalOpen(true)}>Open controlled modal</Button>
    <Modal open={externalOpen} onOpenChange={setExternalOpen} title="Controlled modal"><p>Content</p></Modal>
    <Toaster />
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
