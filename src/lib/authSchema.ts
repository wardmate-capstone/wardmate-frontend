import { z } from 'zod';

const password = z.string().min(1, 'Vui lòng nhập mật khẩu.').refine(
  value => new TextEncoder().encode(value).length <= 72, 'Mật khẩu không được vượt quá 72 byte UTF-8.',
);

export const loginSchema = z.object({
  identity: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập hoặc email.').max(255, 'Tối đa 255 ký tự.'),
  password,
  fullName: z.string(),
  email: z.string(),
  confirmPassword: z.string(),
  terms: z.boolean(),
});

export const registerSchema = loginSchema.extend({
  identity: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập.').max(100, 'Tên đăng nhập tối đa 100 ký tự.')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Chỉ dùng chữ không dấu, số, dấu chấm, gạch dưới và gạch ngang.'),
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ và tên.').max(255, 'Họ và tên tối đa 255 ký tự.'),
  email: z.string().trim().min(1, 'Vui lòng nhập email.').email('Email không hợp lệ.').max(255, 'Email tối đa 255 ký tự.'),
  password: password.refine(value => value.length >= 8, 'Mật khẩu phải có ít nhất 8 ký tự.')
    .refine(value => /\p{Lu}/u.test(value), 'Mật khẩu phải có ít nhất một chữ hoa.')
    .refine(value => /[\p{P}\p{S}]/u.test(value), 'Mật khẩu phải có ít nhất một ký tự đặc biệt.'),
  terms: z.boolean().refine(value => value, 'Vui lòng đồng ý với điều khoản sử dụng.'),
}).refine(value => value.password === value.confirmPassword, {
  message: 'Mật khẩu xác nhận chưa khớp.', path: ['confirmPassword'],
});

export type AuthFormValues = z.infer<typeof loginSchema>;
