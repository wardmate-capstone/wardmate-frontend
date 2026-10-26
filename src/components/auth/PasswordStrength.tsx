import { Check, CheckCircle, WarningCircle, X as XIcon } from '@phosphor-icons/react';

export function getPasswordChecks(value: string) {
  const hasMin = value.length >= 8;
  const hasUpper = /\p{Lu}/u.test(value);
  const hasLower = /\p{Ll}/u.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[\p{P}\p{S}]/u.test(value);
  const passed = [hasMin, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  return { hasMin, hasUpper, hasLower, hasNumber, hasSpecial, passed };
}

/**
 * Thanh độ mạnh + checklist mật khẩu dùng chung cho mọi nơi đặt mật khẩu.
 * `strict`: IAM bắt buộc cả chữ thường và chữ số (đổi/đặt lại mật khẩu, tạo tài khoản cán bộ);
 * đăng ký công dân chỉ bắt buộc 8 ký tự, chữ hoa, ký tự đặc biệt nên 2 mục kia hiện là "nên có".
 */
export function PasswordStrength({ value, strict = false }: { value: string; strict?: boolean }) {
  if (!value) return null;
  const checks = getPasswordChecks(value);
  const tone = checks.passed <= 2 ? 'weak' : checks.passed <= 4 ? 'fair' : 'strong';
  const label = { weak: 'Yếu', fair: 'Khá', strong: 'Mạnh' }[tone];
  const textClass = { weak: 'text-red-700', fair: 'text-amber-700', strong: 'text-emerald-700' }[tone];
  const barClass = { weak: 'bg-red-600', fair: 'bg-amber-500', strong: 'bg-emerald-600' }[tone];
  const optional = strict ? '' : ' (nên có)';
  const items = [
    [checks.hasMin, 'Ít nhất 8 ký tự'],
    [checks.hasUpper, 'Có chữ in hoa'],
    [checks.hasSpecial, 'Ký tự đặc biệt (@#$...)'],
    [checks.hasLower, 'Có chữ thường' + optional],
    [checks.hasNumber, 'Có chữ số' + optional],
  ] as const;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-slate-600">Độ mạnh mật khẩu:</span>
        <span className={textClass}>{label}</span>
      </div>
      <div className="grid grid-cols-5 gap-1 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((level) => (
          <div key={level} className={`h-full transition-colors ${checks.passed >= level ? barClass : 'bg-transparent'}`} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-500">
        {items.map(([ok, text]) => (
          <li key={text} className={`inline-flex items-center gap-1 ${ok ? 'text-emerald-700 font-semibold' : ''}`}>
            {ok ? <Check size={12} weight="bold" aria-hidden="true" /> : <XIcon size={12} aria-hidden="true" />}
            <span>{text}<span className="sr-only">{ok ? ': đạt' : ': chưa đạt'}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Báo ngay khi đang gõ ô xác nhận mật khẩu: khớp hay chưa. */
export function PasswordMatchHint({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  const matched = password === confirm;
  return (
    <p aria-live="polite" className={`flex items-center gap-1.5 text-[11px] font-semibold ${matched ? 'text-emerald-700' : 'text-rose-600'}`}>
      {matched
        ? <CheckCircle size={15} weight="fill" className="text-emerald-600" aria-hidden="true" />
        : <WarningCircle size={15} weight="fill" className="text-rose-500" aria-hidden="true" />}
      <span>{matched ? 'Mật khẩu xác nhận trùng khớp' : 'Mật khẩu xác nhận chưa trùng khớp'}</span>
    </p>
  );
}
