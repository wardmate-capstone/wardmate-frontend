import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Lock,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui";
import {
  PasswordMatchHint,
  PasswordStrength,
} from "@/components/auth/PasswordStrength";
import {
  authErrorMessage,
  iamErrorCode,
  requestPasswordOtp,
  resetPasswordWithOtp,
} from "@/lib/api";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/authSchema";
import { useAuthStore } from "@/stores/authStore";

const RESEND_SECONDS = 60;
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-xs text-slate-950 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100/70 disabled:bg-slate-100 transition-all shadow-2xs aria-[invalid=true]:border-rose-400";

/** Đổi mật khẩu khi đã đăng nhập bằng mã OTP gửi về email (IAM password-otp, purpose CHANGE_PASSWORD). */
export function ChangePasswordOtpForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const active = useRef(true);
  const otpId = useId();
  const newId = useId();
  const confirmId = useId();
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", newPassword: "", confirmNewPassword: "" },
  });
  const newPassword = watch("newPassword");
  const confirmNewPassword = watch("confirmNewPassword");

  if (!user) return null;
  const identity = user.username;

  async function sendOtp() {
    if (sending || cooldown > 0) return;
    setSending(true);
    setError(null);
    try {
      const { message } = await requestPasswordOtp(identity, "CHANGE_PASSWORD");
      if (!active.current) return;
      setNotice(message);
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      if (active.current) setError(authErrorMessage(err));
    } finally {
      if (active.current) setSending(false);
    }
  }

  async function submit(values: ResetPasswordValues) {
    setError(null);
    try {
      await resetPasswordWithOtp(
        { emailOrUsername: identity, ...values, otp: values.otp.trim() },
        "CHANGE_PASSWORD",
      );
      if (active.current) onSuccess();
    } catch (err) {
      if (!active.current) return;
      if (iamErrorCode(err) === "iam.otp_invalid") {
        setFieldError(
          "otp",
          { type: "server", message: authErrorMessage(err) },
          { shouldFocus: true },
        );
      } else {
        setError(authErrorMessage(err));
      }
    }
  }

  const fieldError = (id: string, message?: string) =>
    message ? (
      <p
        id={`${id}-error`}
        role="alert"
        className="text-[11px] font-medium text-rose-600"
      >
        {message}
      </p>
    ) : null;

  return (
    <div className="p-6 sm:p-8 space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-rose-800 text-xs"
        >
          <WarningCircle
            size={18}
            className="shrink-0 mt-0.5 text-rose-600"
            weight="fill"
          />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      <div
        className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs leading-relaxed text-sky-950"
        role={sent ? "status" : undefined}
      >
        <EnvelopeSimple
          size={18}
          className="shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <span>
          {sent ? (
            notice
          ) : (
            <>
              Hệ thống sẽ gửi mã xác thực gồm 6 chữ số tới email của bạn. Mã có
              hiệu lực 5 phút.
            </>
          )}
        </span>
      </div>

      {!sent ? (
        <Button
          type="button"
          variant="primary"
          loading={sending}
          onClick={() => void sendOtp()}
          className="w-full sm:w-auto gap-2 px-5 py-2.5"
        >
          <EnvelopeSimple size={15} weight="bold" />
          <span>Gửi mã xác thực qua email</span>
        </Button>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor={otpId}
              className="block text-xs font-semibold text-slate-800"
            >
              Mã xác thực (6 chữ số) <span className="text-red-600">*</span>
            </label>
            <input
              {...register("otp")}
              id={otpId}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              aria-invalid={Boolean(errors.otp)}
              aria-describedby={errors.otp ? `${otpId}-error` : undefined}
              className={`${inputClass} tracking-[0.3em]`}
            />
            {fieldError(otpId, errors.otp?.message)}
          </div>

          <div className="space-y-2">
            <label
              htmlFor={newId}
              className="block text-xs font-semibold text-slate-800"
            >
              Mật khẩu mới <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                {...register("newPassword")}
                id={newId}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập mật khẩu mới"
                aria-invalid={Boolean(errors.newPassword)}
                aria-describedby={
                  errors.newPassword ? `${newId}-error` : undefined
                }
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 p-1 rounded-lg transition-colors"
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldError(newId, errors.newPassword?.message)}
            <PasswordStrength value={newPassword} strict />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={confirmId}
              className="block text-xs font-semibold text-slate-800"
            >
              Xác nhận mật khẩu mới <span className="text-red-600">*</span>
            </label>
            <input
              {...register("confirmNewPassword")}
              id={confirmId}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu mới"
              aria-invalid={Boolean(errors.confirmNewPassword)}
              aria-describedby={
                errors.confirmNewPassword ? `${confirmId}-error` : undefined
              }
              className={inputClass}
            />
            {fieldError(confirmId, errors.confirmNewPassword?.message)}
            <PasswordMatchHint
              password={newPassword}
              confirm={confirmNewPassword}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void sendOtp()}
              disabled={cooldown > 0 || sending}
              className="text-xs font-semibold text-red-800 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            >
              {cooldown > 0
                ? `Gửi lại mã sau ${cooldown}s`
                : sending
                  ? "Đang gửi lại..."
                  : "Gửi lại mã"}
            </button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full sm:w-auto shadow-sm gap-2 px-5 py-2.5"
            >
              <Lock size={15} weight="bold" />
              <span>Đổi mật khẩu</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
