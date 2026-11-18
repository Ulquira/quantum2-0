import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';

const LoginView = lazy(() => import('../features/auth/components/LoginView'));
const ChangePasswordView = lazy(() => import('../features/auth/components/ChangePasswordView'));
const OrdersListView = lazy(() => import('../features/orders/components/OrdersListView'));
const OrderDetailView = lazy(() => import('../features/orders/components/OrderDetailView'));
const OrderExecutionView = lazy(() => import('../features/orders/components/OrderExecutionView'));
const ProfileView = lazy(() => import('../features/auth/components/ProfileView'));

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Cargando...</div>}>
        <Routes>
          <Route path="/login" element={<LoginView />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePasswordView />} />
            <Route element={<AppShell />}>
              <Route path="/orders" element={<OrdersListView />} />
              <Route path="/orders/:id" element={<OrderDetailView />} />
              <Route path="/orders/:id/work" element={<OrderExecutionView />} />
              <Route path="/profile" element={<ProfileView />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
