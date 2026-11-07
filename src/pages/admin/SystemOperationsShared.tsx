import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Input } from '@/components/ui';
import { backupStates, healthStates, emptyOperationsFilters, operationsFilterSchema, type OperationsFilters, type HealthObservation } from '@/lib/api/systemOperations';

// Tên dễ đọc cho mã dịch vụ trong cấu hình vận hành; mã chưa biết thì giữ nguyên
const SERVICE_LABELS: Record<string, string> = {
  iam: 'Tài khoản & phân quyền',
  catalog: 'Danh mục thủ tục', 'procedure-catalog': 'Danh mục thủ tục',
  workflow: 'Hồ sơ tiền kiểm', 'application-workflow': 'Hồ sơ tiền kiểm',
  documentform: 'Biểu mẫu & tài liệu', 'document-form': 'Biểu mẫu & tài liệu',
  'ai-ocr': 'AI & quét giấy tờ', aiocr: 'AI & quét giấy tờ',
  'analytics-system': 'Thống kê & thông báo', analytics: 'Thống kê & thông báo',
  gateway: 'Cổng kết nối',
};
export function serviceLabel(name: string) {
  return SERVICE_LABELS[name.toLowerCase()] ?? name;
}
// Các dịch vụ có thể sao lưu theo tài liệu vận hành (SystemBackups:Targets)
export const BACKUP_SERVICES = ['iam', 'catalog', 'workflow', 'documentform'];
export function OperationBadge({ status, backup = false }: { status: string; backup?: boolean }) {
  const labels: Record<string, string> = backup ? backupStates : healthStates;
  return <Badge variant={['Healthy', 'Succeeded', 'Verified'].includes(status) ? 'success' : ['Unhealthy', 'Failed'].includes(status) ? 'danger' : ['Degraded', 'Running', 'Queued'].includes(status) ? 'warning' : 'neutral'}>{labels[status] ?? `Chưa xác định (${status})`}</Badge>;
}
export function hasObservation(row: HealthObservation) {
  return row.id !== '00000000-0000-0000-0000-000000000000' && !row.checkedAtUtc.startsWith('0001-');
}
export function OperationsFilter({ backup = false, services = [], onApply }: { backup?: boolean; services?: string[]; onApply: (filters: OperationsFilters) => void }) {
  const id = useId();
  const form = useForm<OperationsFilters>({ resolver: zodResolver(operationsFilterSchema), defaultValues: emptyOperationsFilters });
  return <form noValidate onSubmit={form.handleSubmit(onApply)} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Input label="Dịch vụ (mã)" list={`${id}-services`} {...form.register('service')} error={form.formState.errors.service?.message} hint="Để trống để xem mọi dịch vụ." /><datalist id={`${id}-services`}>{services.map(name => <option key={name} value={name} label={serviceLabel(name)} />)}</datalist>
    {backup && <div className="grid content-start gap-2"><label htmlFor={`${id}-status`} className="text-sm font-semibold">Trạng thái sao lưu</label><select id={`${id}-status`} {...form.register('status')} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"><option value="">Tất cả trạng thái</option>{Object.entries(backupStates).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>}
    <Input label="Từ ngày" type="date" {...form.register('from')} error={form.formState.errors.from?.message} /><Input label="Đến ngày" type="date" {...form.register('to')} error={form.formState.errors.to?.message} />
    </div><div className="flex flex-wrap gap-3"><Button type="submit">Áp dụng</Button><Button variant="outline" onClick={() => { form.reset(emptyOperationsFilters); onApply({ ...emptyOperationsFilters }); }}>Xóa bộ lọc</Button></div><p className="text-sm text-slate-600">Khoảng ngày theo giờ Việt Nam. Nhập đúng mã dịch vụ (chọn từ gợi ý).</p></form>;
}
