import { useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { authErrorMessage, createStaffAccount, type StaffAccountRole, type WardDto } from '@/lib/api';

const roleOptions: Array<{ value: StaffAccountRole; label: string; hint: string }> = [
  { value: 'FRONT_DESK_OFFICER', label: 'Cán bộ Một cửa', hint: 'Tiếp nhận và tiền kiểm hồ sơ tại phường được chọn.' },
  { value: 'MANAGER', label: 'Lãnh đạo UBND (Quản lý)', hint: 'Quản lý cán bộ, phân công và theo dõi hồ sơ của phường được chọn.' },
  { value: 'PROCEDURE_MANAGER', label: 'Quản lý thủ tục', hint: 'Quản lý danh mục thủ tục và biểu mẫu; không bắt buộc gán phường.' },
];

// Phường bắt buộc với vai trò làm việc theo phường; admin không có phường để BE tự suy ra.
const wardRequiredRoles: StaffAccountRole[] = ['FRONT_DESK_OFFICER', 'MANAGER'];

const staffSchema = z.object({
  role: z.enum(['FRONT_DESK_OFFICER', 'MANAGER', 'PROCEDURE_MANAGER']),
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên.').max(255, 'Họ và tên tối đa 255 ký tự.'),
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập.').max(100, 'Tên đăng nhập tối đa 100 ký tự.')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Tên đăng nhập không được có khoảng trắng hay chữ có dấu. Chỉ dùng chữ a-z, số, dấu chấm (.), gạch dưới (_) hoặc gạch ngang (-), ví dụ: anh.duc'),
  email: z.string().trim().min(1, 'Vui lòng nhập email.').email('Email không hợp lệ.').max(255, 'Email tối đa 255 ký tự.'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.')
    .refine(value => new TextEncoder().encode(value).length <= 72, 'Mật khẩu không được vượt quá 72 byte UTF-8.')
    .refine(value => /\p{Lu}/u.test(value), 'Mật khẩu phải có ít nhất một chữ hoa.')
    .refine(value => /\p{Ll}/u.test(value), 'Mật khẩu phải có ít nhất một chữ thường.')
    .refine(value => /\d/.test(value), 'Mật khẩu phải có ít nhất một chữ số.')
    .refine(value => /[\p{P}\p{S}]/u.test(value), 'Mật khẩu phải có ít nhất một ký tự đặc biệt.'),
  wardId: z.string(),
}).refine(value => !wardRequiredRoles.includes(value.role) || value.wardId !== '', {
  message: 'Vui lòng chọn phường/xã công tác.', path: ['wardId'],
});

type StaffFormValues = z.infer<typeof staffSchema>;
const defaultValues: StaffFormValues = { role: 'FRONT_DESK_OFFICER', fullName: '', username: '', email: '', password: '', wardId: '' };

const inputClass = 'w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 aria-[invalid=true]:border-red-400';

export function CreateStaffAccountModal({ open, wards, onOpenChange, onCreated }: {
  open: boolean;
  wards: WardDto[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { register, handleSubmit, reset, setError, watch, formState: { errors, isSubmitting } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues,
  });
  const role = watch('role');
  const password = watch('password');
  const roleOption = roleOptions.find(option => option.value === role);

  useEffect(() => { if (!open) reset(defaultValues); }, [open, reset]);

  async function submit(values: StaffFormValues) {
    try {
      await createStaffAccount(values.role, {
        username: values.username,
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        wardId: values.wardId || null,
      });
      toast.success(`Đã tạo tài khoản ${roleOption?.label ?? ''} cho ${values.fullName}.`);
      onOpenChange(false);
      onCreated();
    } catch (error) {
      // Lỗi validation của BE gắn vào đúng trường; còn lại hiện toast.
      const serverErrors: unknown = axios.isAxiosError(error) ? error.response?.data?.errors : null;
      const fields: Record<string, keyof StaffFormValues> = { username: 'username', email: 'email', password: 'password', fullname: 'fullName', wardid: 'wardId' };
      let mapped = false;
      if (serverErrors && typeof serverErrors === 'object') {
        for (const [key, messages] of Object.entries(serverErrors)) {
          const name = fields[key.toLowerCase()];
          if (name && Array.isArray(messages) && typeof messages[0] === 'string') {
            setError(name, { type: 'server', message: messages[0] }, { shouldFocus: !mapped });
            mapped = true;
          }
        }
      }
      if (!mapped) toast.error(authErrorMessage(error));
    }
  }

  const field = (name: keyof StaffFormValues, label: string, input: ReactNode) => (
    <div>
      <label htmlFor={`staff-${name}`} className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      {input}
      {errors[name] && <p id={`staff-${name}-error`} role="alert" className="mt-1 text-[11px] text-red-700">{errors[name]?.message}</p>}
    </div>
  );
  const aria = (name: keyof StaffFormValues) => ({
    id: `staff-${name}`,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `staff-${name}-error` : undefined,
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Tạo tài khoản cán bộ">
      <form onSubmit={handleSubmit(submit)} className="space-y-4 py-2" noValidate>
        {field('role', 'Vai trò *', (
          <select {...register('role')} {...aria('role')} className={inputClass}>
            {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ))}
        {roleOption && <p className="-mt-2 text-[11px] text-slate-500">{roleOption.hint}</p>}
        {field('wardId', wardRequiredRoles.includes(role) ? 'Phường / Xã công tác *' : 'Phường / Xã công tác (không bắt buộc)', (
          <select {...register('wardId')} {...aria('wardId')} className={inputClass}>
            <option value="">{wards.length ? '— Chọn phường / xã —' : 'Chưa có phường / xã nào'}</option>
            {wards.map(ward => <option key={ward.id} value={ward.id}>{ward.name} ({ward.code})</option>)}
          </select>
        ))}
        {field('fullName', 'Họ và tên *', <input {...register('fullName')} {...aria('fullName')} autoComplete="off" placeholder="Ví dụ: Trần Minh Hoàng" className={inputClass} />)}
        {field('username', 'Tên đăng nhập *', <input {...register('username')} {...aria('username')} autoComplete="off" placeholder="Ví dụ: hoang.tm" className={inputClass} />)}
        {field('email', 'Email công vụ *', <input {...register('email')} {...aria('email')} type="email" autoComplete="off" placeholder="hoang.tm@phuong.gov.vn" className={inputClass} />)}
        {field('password', 'Mật khẩu khởi tạo * (≥ 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt)', (
          <input {...register('password')} {...aria('password')} type="password" autoComplete="new-password" placeholder="••••••••" className={inputClass} />
        ))}
        <PasswordStrength value={password} strict />
        <p className="text-[11px] text-slate-500 italic">
          * Vai trò được gán tự động theo loại tài khoản. Hãy gửi mật khẩu khởi tạo cho cán bộ qua kênh an toàn và đề nghị đổi mật khẩu sau lần đăng nhập đầu tiên.
        </p>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50">
            Hủy bỏ
          </button>
          <button type="submit" disabled={isSubmitting} className="admin-primary-action text-xs disabled:opacity-50">
            {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
