import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ChatRoom from './pages/ChatRoom';
import Invite from './pages/Invite';
import Contacts from './pages/Contacts';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/invite/:inviteId" element={<Invite />} />
        <Route path="/chat" element={<ChatRoom />} />
        <Route path="/chat/:userId" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
