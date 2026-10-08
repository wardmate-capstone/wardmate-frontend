import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/Toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { HomePage } from '@/pages/public/HomePage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { FaqPage } from '@/pages/public/FaqPage';
import { ProceduresPage } from '@/pages/public/ProceduresPage';
import { ProcedureDetailPage } from '@/pages/public/ProcedureDetailPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { UserProfileProvider } from '@/hooks/useUserProfile';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { getManagementHome } from '@/lib/authRedirect';

// Lazy-loaded heavy role workspaces for optimal initial bundle size
const AdminPage = lazy(() => import('@/pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })));
const CitizenPage = lazy(() => import('@/pages/citizen').then((m) => ({ default: m.CitizenPage })));
const OfficerPage = lazy(() => import('@/pages/officer/OfficerPage').then((m) => ({ default: m.OfficerPage })));
const ProcedureManagerPage = lazy(() => import('@/pages/procedure-manager/ProcedureManagerPage').then((m) => ({ default: m.ProcedureManagerPage })));
const ManagerPage = lazy(() => import('@/pages/manager/ManagerPage').then((m) => ({ default: m.ManagerPage })));

function HomeRoute() {
  const user = useAuthStore((state) => state.user);
  const mgmtHome = getManagementHome(user?.roles, user?.permissions);

  if (mgmtHome) {
    return <Navigate to={mgmtHome} replace />;
  }

  return <HomePage />;
}

function WorkspaceLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center" role="status" aria-label="Đang tải dữ liệu phân hệ">
      <div className="size-9 animate-spin rounded-full border-3 border-red-200 border-t-red-800" />
      <p className="mt-3 text-xs font-semibold text-slate-500">Đang tải phân hệ làm việc...</p>
    </div>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <UserProfileProvider>
          <BrowserRouter>
            <Suspense fallback={<WorkspaceLoadingFallback />}>
              <Routes>
                <Route element={<ProtectedRoute roles={['REGISTERED_CITIZEN']} permissions={['document.submissions.']} />}>
                  <Route path="citizen/*" element={<CitizenPage />} />
                  <Route path="cong-dan/*" element={<CitizenPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={['FRONT_DESK_OFFICER']} />}>
                  <Route path="officer/*" element={<OfficerPage />} />
                  <Route path="can-bo/*" element={<OfficerPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={['MANAGER']} />}>
                  <Route path="manager/*" element={<ManagerPage />} />
                  <Route path="quan-ly/*" element={<ManagerPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={['PROCEDURE_MANAGER', 'IT_ADMIN']} permissions={['procedure.', 'document.templates.']} />}>
                  <Route path="procedure-manager/*" element={<ProcedureManagerPage />} />
                  <Route path="quan-ly-thu-tuc/*" element={<ProcedureManagerPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={['IT_ADMIN']} permissions={['iam.accounts.', 'iam.wards.', 'iam.rbac.', 'iam.audit.', 'iam.manage']} />}>
                  <Route path="admin" element={<AdminPage />} />
                </Route>
                <Route element={<MainLayout />}>
                  <Route index element={<HomeRoute />} />
                  <Route path="dang-nhap" element={<AuthPage key="login" mode="login" />} />
                  <Route path="dang-ky" element={<AuthPage key="register" mode="register" />} />
                  <Route path="quen-mat-khau" element={<ForgotPasswordPage />} />
                  <Route path="dat-lai-mat-khau" element={<ResetPasswordPage />} />
                  <Route path="hoi-dap" element={<FaqPage />} />
                  <Route path="thu-tuc" element={<ProceduresPage />} />
                  <Route path="thu-tuc/:procedureId" element={<ProcedureDetailPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
            <Toaster position="top-right" richColors closeButton />
          </BrowserRouter>
        </UserProfileProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
