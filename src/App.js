import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import ChatRoom from './pages/ChatRoom';
import Invite from './pages/Invite';
import Contacts from './pages/Contacts';
import NotificationToast from './components/NotificationToast';
import { useNotifications } from './hooks/useNotifications';

// Apply theme class to body for global styles
const applyThemeClass = () => {
  document.body.classList.add('bumble-theme');
  return () => {
    document.body.classList.remove('bumble-theme');
  };
};

// Protected route that checks for authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <>
      <Header />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </>
  );
};

function App() {
  const { notifications, removeNotification } = useNotifications();

  // Apply theme class
  React.useEffect(() => {
    return applyThemeClass();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute>
                    <Contacts />
                  </ProtectedRoute>
                }
              />
          <Route
            path="/invite/:inviteId"
            element={
              <ProtectedRoute>
                <Invite />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:userId"
            element={
              <ProtectedRoute>
                <ChatRoom />
              </ProtectedRoute>
            }
          />
            </Routes>
            {/* Notification System */}
            <NotificationToast 
              notifications={notifications} 
              onRemove={removeNotification} 
            />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
