import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import Members from './pages/Members';
import Settings from './pages/Settings';

const Spinner = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0fdfa',
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid rgba(15,118,110,0.2)',
        borderTop: '3px solid #0f766e',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Protected route: redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  if (isLoading) return <Spinner />;

  if (!user) {
    if (inviteToken) {
      return <Navigate to={`/register?invite=${inviteToken}`} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Root route: handles invite token or auth redirect
function RootRedirect() {
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  if (inviteToken) {
    return <Navigate to={`/register?invite=${inviteToken}`} replace />;
  }

  if (isLoading) return <Spinner />;

  return <Navigate to={user ? '/chat' : '/login'} replace />;
}

// Catch-all: handle ?invite=TOKEN on any unknown path
function CatchAllRoute() {
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  if (inviteToken) {
    return <Navigate to={`/register?invite=${inviteToken}`} replace />;
  }

  if (isLoading) return <Spinner />;

  return <Navigate to={user ? '/chat' : '/login'} replace />;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth pages — redirect to /chat if already logged in */}
      <Route
        path="/login"
        element={
          isLoading ? <Spinner /> : user ? <Navigate to="/chat" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isLoading ? <Spinner /> : user ? <Navigate to="/chat" replace /> : <Register />
        }
      />

      {/* Protected pages */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:roomId"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <Members />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<CatchAllRoute />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
