import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { RequireAdmin } from './components/RequireAdmin';
import { AdminLayout } from './components/AdminLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComponentsListPage } from './pages/ComponentsListPage';
import { ComponentCreatePage } from './pages/ComponentCreatePage';
import { ComponentEditPage } from './pages/ComponentEditPage';
import { CustomersPage } from './pages/CustomersPage';

export const App: React.FC = () => {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Admin Protected App Routes guarded by RequireAdmin */}
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/components" element={<ComponentsListPage />} />
              <Route path="/components/new" element={<ComponentCreatePage />} />
              <Route path="/components/:id/edit" element={<ComponentEditPage />} />
              <Route path="/customers" element={<CustomersPage />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
};
