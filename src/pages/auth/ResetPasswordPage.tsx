import { useLocation } from 'react-router-dom';
import { PasswordRecovery } from './PasswordRecovery';

/** Vào thẳng bước nhập mã khi được chuyển tới kèm tài khoản (qua router state, không đưa lên URL). */
export function ResetPasswordPage() {
  const state: unknown = useLocation().state;
  const identity = state && typeof state === 'object' && 'emailOrUsername' in state && typeof state.emailOrUsername === 'string'
    ? state.emailOrUsername : '';
  return <PasswordRecovery initialIdentity={identity} />;
}
