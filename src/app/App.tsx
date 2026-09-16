import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AuthPage } from '@/pages/AuthPage';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="dang-nhap" element={<AuthPage mode="login" />} />
              <Route path="dang-ky" element={<AuthPage mode="register" />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          <Toaster position="bottom-center" richColors closeButton />
        </BrowserRouter>
      </LazyMotion>
    </MotionConfig>
  );
}
