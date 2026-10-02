import { z } from 'zod';

export const VIETNAMESE_PHONE_REGEX = /^0[35789]\d{8}$/;
export const VIETNAMESE_CITIZEN_ID_REGEX = /^\d{12}$/;
export const VIETNAMESE_NAME_REGEX = /^[\p{L}\s]+$/u;

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập họ và tên.')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự.')
    .regex(
      VIETNAMESE_NAME_REGEX,
      'Họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không chứa số hoặc ký tự đặc biệt.'
    )
    .refine(
      (val) => val.trim().split(/\s+/).filter(Boolean).length >= 2,
      'Họ và tên cần bao gồm ít nhất 2 từ (gồm Họ và Tên).'
    ),

  identityNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || VIETNAMESE_CITIZEN_ID_REGEX.test(val),
      'Số CCCD / Mã định danh cá nhân phải gồm đúng 12 chữ số.'
    ),

  phoneNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true;
      const cleanPhone = val.replace(/[\s.-]/g, '');
      return VIETNAMESE_PHONE_REGEX.test(cleanPhone);
    }, 'Số điện thoại không hợp lệ (gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09).'),

  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true;
      // Kiểm tra định dạng YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
      const [year, month, day] = val.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    }, 'Ngày sinh không đúng định dạng hoặc không tồn tại trên lịch.')
    .refine((val) => {
      if (!val) return true;
      const [year, month, day] = val.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date <= today;
    }, 'Ngày sinh không được vượt quá ngày hiện tại.')
    .refine((val) => {
      if (!val) return true;
      const [year] = val.split('-').map(Number);
      return year >= 1900;
    }, 'Năm sinh không hợp lệ (từ năm 1900 trở lại đây).'),

  gender: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || ['Nam', 'Nữ', 'Khác'].includes(val),
      'Giới tính phải là Nam, Nữ hoặc Khác.'
    ),

  permanentAddress: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || val.length >= 5,
      'Địa chỉ thường trú quá ngắn (vui lòng nhập rõ số nhà/đường, phường/xã, quận/huyện, tỉnh/thành phố).'
    )
    .refine(
      (val) => !val || val.length <= 255,
      'Địa chỉ thường trú không được vượt quá 255 ký tự.'
    ),

  temporaryAddress: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || val.length >= 5,
      'Địa chỉ tạm trú quá ngắn (vui lòng nhập rõ địa chỉ).'
    )
    .refine(
      (val) => !val || val.length <= 255,
      'Địa chỉ tạm trú không được vượt quá 255 ký tự.'
    ),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export type ProfileFieldErrors = Partial<Record<keyof ProfileFormValues, string>>;

export function validateProfile(values: {
  fullName: string;
  identityNumber?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  permanentAddress?: string | null;
  temporaryAddress?: string | null;
}): { isValid: boolean; errors: ProfileFieldErrors } {
  const result = profileSchema.safeParse({
    fullName: values.fullName || '',
    identityNumber: values.identityNumber || '',
    phoneNumber: values.phoneNumber || '',
    dateOfBirth: values.dateOfBirth || '',
    gender: values.gender || '',
    permanentAddress: values.permanentAddress || '',
    temporaryAddress: values.temporaryAddress || '',
  });

  if (result.success) {
    return { isValid: true, errors: {} };
  }

  const errors: ProfileFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ProfileFormValues;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { isValid: false, errors };
}
