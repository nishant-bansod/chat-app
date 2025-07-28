import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './pages/Login';
import ChatRoom from './pages/ChatRoom';
import Invite from './pages/Invite';
import Contacts from './pages/Contacts';
import UsernameSetup from './components/UsernameSetup';

// Apply theme class to body for global styles
const applyThemeClass = () => {
  document.body.classList.add('bumble-theme');
  return () => {
    document.body.classList.remove('bumble-theme');
  };
};

// Protected route that checks for authentication and username setup
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Check if user has a username set
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setNeedsUsername(!userDoc.exists() || !userDoc.data()?.username);
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
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

  if (!auth.currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (needsUsername) {
    return <UsernameSetup />;
  }

  return children;
};

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

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
    </ThemeProvider>
  );
}

export default App;
