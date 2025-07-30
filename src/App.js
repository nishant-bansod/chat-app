import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setUser(currentUser);
      setLoading(false);
    };
    checkAuth();
  }, [location.pathname]);

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

  return children;
};

function App() {
  const [initialized, setInitialized] = useState(false);
  const { notifications, addNotification, removeNotification } = useNotifications();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setInitialized(true);
      if (user) {
        addNotification(`Welcome back, ${user.displayName || user.email}!`, 'success', 3000);
      }
    });

    return () => unsubscribe();
  }, [addNotification]);

  useEffect(() => {
    return applyThemeClass();
  }, []);

  if (!initialized) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
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
      </BrowserRouter>
      
      {/* Notification System */}
      <NotificationToast 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </ThemeProvider>
  );
}

export default App;
