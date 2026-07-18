import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout';
import { LoginPage, RegisterPage } from './components/auth';
import {
  DashboardPage, LearnPage, RevisionPage, MyWordsPage,
  StoriesPage, ChatPage, ReadingPage
} from './pages';
import SettingsPage from './components/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  }
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen cyber-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gradient">English OS</h2>
        <p className="text-gray-400 text-sm mt-2">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
      <Route path="/vocabulary/learn" element={<ProtectedRoute><MainLayout><LearnPage /></MainLayout></ProtectedRoute>} />
      <Route path="/vocabulary/revision" element={<ProtectedRoute><MainLayout><RevisionPage /></MainLayout></ProtectedRoute>} />
      <Route path="/vocabulary/my-words" element={<ProtectedRoute><MainLayout><MyWordsPage /></MainLayout></ProtectedRoute>} />
      <Route path="/stories" element={<ProtectedRoute><MainLayout><StoriesPage /></MainLayout></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><MainLayout><ChatPage /></MainLayout></ProtectedRoute>} />
      <Route path="/reading" element={<ProtectedRoute><MainLayout><ReadingPage /></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1b23',
                  color: '#f3f4f6',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }
              }}
            />
            <AppRoutes />
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
