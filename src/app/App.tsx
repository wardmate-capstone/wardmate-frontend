import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/Toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AuthPage } from '@/pages/AuthPage';
import { FaqPage } from '@/pages/FaqPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProceduresPage } from '@/pages/ProceduresPage';
import { AdminPage } from '@/pages/AdminPage';
import { OfficerPage } from '@/pages/officer/OfficerPage';
import { ProcedureManagerPage } from '@/pages/procedure-manager/ProcedureManagerPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <BrowserRouter>
          <Routes>
            <Route path="officer/*" element={<OfficerPage />} />
            <Route path="can-bo/*" element={<OfficerPage />} />
            <Route path="procedure-manager/*" element={<ProcedureManagerPage />} />
            <Route path="quan-ly-thu-tuc/*" element={<ProcedureManagerPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="dang-nhap" element={<AuthPage mode="login" />} />
              <Route path="dang-ky" element={<AuthPage mode="register" />} />
              <Route path="quen-mat-khau" element={<ForgotPasswordPage />} />
              <Route path="dat-lai-mat-khau" element={<ResetPasswordPage />} />
              <Route path="hoi-dap" element={<FaqPage />} />
              <Route path="tai-khoan" element={<ProfilePage />} />
              <Route path="thu-tuc" element={<ProceduresPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          <Toaster position="bottom-center" richColors closeButton />
        </BrowserRouter>
      </LazyMotion>
    </MotionConfig>
  );
}
