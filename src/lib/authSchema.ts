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
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Tên đăng nhập không được có khoảng trắng hay chữ có dấu. Chỉ dùng chữ a-z, số, dấu chấm (.), gạch dưới (_) hoặc gạch ngang (-), ví dụ: anh.duc'),
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

export const forgotPasswordSchema = z.object({
  emailOrUsername: z.string().trim().min(1, 'Vui lòng nhập email hoặc tên đăng nhập.').max(255, 'Tối đa 255 ký tự.'),
});

// Khớp rule mật khẩu mới của IAM (verify-and-change): hoa, thường, số, ký tự đặc biệt, 8 ký tự – 72 byte.
export const resetPasswordSchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, 'Mã xác thực gồm đúng 6 chữ số.'),
  newPassword: password.refine(value => value.length >= 8, 'Mật khẩu phải có ít nhất 8 ký tự.')
    .refine(value => /\p{Lu}/u.test(value), 'Mật khẩu phải có ít nhất một chữ hoa.')
    .refine(value => /\p{Ll}/u.test(value), 'Mật khẩu phải có ít nhất một chữ thường.')
    .refine(value => /\d/.test(value), 'Mật khẩu phải có ít nhất một chữ số.')
    .refine(value => /[\p{P}\p{S}]/u.test(value), 'Mật khẩu phải có ít nhất một ký tự đặc biệt.'),
  confirmNewPassword: z.string(),
}).refine(value => value.newPassword === value.confirmNewPassword, {
  message: 'Mật khẩu xác nhận chưa khớp.', path: ['confirmNewPassword'],
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
