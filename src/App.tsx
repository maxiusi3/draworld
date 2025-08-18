import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { useAuth } from './hooks/useAuthContext';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreatePage from './pages/CreatePage';
import ResultPage from './pages/ResultPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CallbackPage from './pages/CallbackPage';
import TestCreditsPage from './pages/TestCreditsPage';
import GalleryPage from './pages/GalleryPage';
import CreditStorePage from './pages/CreditStorePage';
import CreditHistoryPage from './pages/CreditHistoryPage';
import InvitationPage from './pages/InvitationPage';
import CommunityPage from './pages/CommunityPage';
import ArtworkDetailPage from './pages/ArtworkDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminModerationPage from './pages/AdminModerationPage';
import AdminPaymentMonitorPage from './pages/AdminPaymentMonitorPage';
import OIDCDebugPage from './pages/OIDCDebugPage';
import AuthTestPage from './pages/AuthTestPage';
import { PageErrorBoundary } from './components/ErrorBoundary';
import './App.css';

// 受保护的路由组件
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

// 公开路由组件（已登录用户重定向到dashboard）
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  return currentUser ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

function App() {
  return (
    <PageErrorBoundary>
      <AuthProvider>
        <Router>
        <Routes>
          {/* 公开路由 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            
            {/* 公开路由（已登录用户重定向） */}
            <Route path="login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/oidc-debug" element={<OIDCDebugPage />} />
            <Route path="/auth-test" element={<AuthTestPage />} />

            {/* 受保护的路由 */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="create" element={
              <ProtectedRoute>
                <CreatePage />
              </ProtectedRoute>
            } />
            <Route path="result/:taskId" element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="test-credits" element={
              <ProtectedRoute>
                <TestCreditsPage />
              </ProtectedRoute>
            } />
            <Route path="community" element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            } />
            {/* 保持向后兼容性 */}
            <Route path="gallery" element={
              <ProtectedRoute>
                <GalleryPage />
              </ProtectedRoute>
            } />
            <Route path="credits" element={
              <ProtectedRoute>
                <CreditStorePage />
              </ProtectedRoute>
            } />
            <Route path="credit-store" element={
              <ProtectedRoute>
                <CreditStorePage />
              </ProtectedRoute>
            } />
            <Route path="credit-history" element={
              <ProtectedRoute>
                <CreditHistoryPage />
              </ProtectedRoute>
            } />
            <Route path="invitation" element={
              <ProtectedRoute>
                <InvitationPage />
              </ProtectedRoute>
            } />
            <Route path="community/artwork/:id" element={
              <ProtectedRoute>
                <ArtworkDetailPage />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="admin/moderation" element={
              <ProtectedRoute>
                <AdminModerationPage />
              </ProtectedRoute>
            } />
            <Route path="admin/payment-monitor" element={
              <ProtectedRoute>
                <AdminPaymentMonitorPage />
              </ProtectedRoute>
            } />

            {/* 404页面 */}
            <Route path="*" element={
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">页面不存在</h2>
                  <p className="text-gray-600 mb-8">您要访问的页面不存在或已被移除</p>
                  <a
                    href="/"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    返回首页
                  </a>
                </div>
              </div>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
    </PageErrorBoundary>
  );
}

export default App;