import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import Login from './pages/Login';
import ChatRoom from './pages/ChatRoom';
import Invite from './pages/Invite';
import Contacts from './pages/Contacts';
import { useEffect } from 'react';

// Apply theme class to body for global styles
const applyThemeClass = () => {
  document.body.classList.add('bumble-theme');
  return () => {
    document.body.classList.remove('bumble-theme');
  };
};

function App() {
  useEffect(() => {
    return applyThemeClass();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/invite/:inviteId" element={<Invite />} />
          <Route path="/chat" element={<ChatRoom />} />
          <Route path="/chat/:userId" element={<ChatRoom />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
