import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NewsEditor } from './pages/NewsEditor';
import { NewsListPage } from './pages/NewsListPage';
import { ApprovalDashboard } from './pages/ApprovalDashboard';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { DashboardPage } from './pages/DashboardPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { UserManagementPage } from './pages/UserManagementPage';

const Settings = () => (
  <div className="max-w-7xl mx-auto p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
    <p className="text-gray-600">Admin settings page - coming soon</p>
  </div>
);

export const App = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/news/create"
              element={
                <ProtectedRoute requiredRoles={['EDITOR', 'ADMIN']}>
                  <NewsEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news/:id/edit"
              element={
                <ProtectedRoute requiredRoles={['EDITOR', 'ADMIN']}>
                  <NewsEditor />
                </ProtectedRoute>
              }
            />
            <Route path="/news" element={<NewsListPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route
              path="/approval"
              element={
                <ProtectedRoute requiredRoles={['REVIEWER', 'ADMIN']}>
                  <ApprovalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRoles={['REVIEWER', 'ADMIN']}>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
          },
        }}
      />
    </>
  );
};

export default App;
