import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/Toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { HomePage } from '@/pages/public/HomePage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { FaqPage } from '@/pages/public/FaqPage';
import { ProceduresPage } from '@/pages/public/ProceduresPage';
import { ProcedureDetailPage } from '@/pages/public/ProcedureDetailPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { CitizenPage } from '@/pages/citizen';
import { OfficerPage } from '@/pages/officer/OfficerPage';
import { ProcedureManagerPage } from '@/pages/procedure-manager/ProcedureManagerPage';
import { ManagerPage } from '@/pages/manager/ManagerPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { UserProfileProvider } from '@/hooks/useUserProfile';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <UserProfileProvider>
          <BrowserRouter>
            <Routes>
            <Route element={<ProtectedRoute roles={['REGISTERED_CITIZEN']} />}>
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
            <Route element={<ProtectedRoute roles={['PROCEDURE_MANAGER', 'IT_ADMIN']} />}>
            <Route path="procedure-manager/*" element={<ProcedureManagerPage />} />
            <Route path="quan-ly-thu-tuc/*" element={<ProcedureManagerPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['IT_ADMIN']} />}>
            <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route element={<MainLayout />}>
              <Route index element={<HomePage />} />
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
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </UserProfileProvider>
    </LazyMotion>
    </MotionConfig>
  );
}
