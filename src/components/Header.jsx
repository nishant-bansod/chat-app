import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import { colors } from '../theme/colors';

const HeaderContainer = styled.header`
  background: ${colors.background};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: 1px solid ${colors.border};
  color: ${colors.text};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${colors.surface};
    border-color: ${colors.primary};
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const UserImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
`;

function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <HeaderContainer>
      <UserInfo>
        {user?.photoURL && <UserImage src={user.photoURL} alt="Profile" />}
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: colors.primary }}>{user?.displayName || user?.email}</span>
      </UserInfo>
      <LogoutButton onClick={handleLogout} style={{ fontWeight: 700, background: colors.primary, color: colors.secondary, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <span style={{ marginRight: 8 }}>🔒</span> Logout
      </LogoutButton>
    </HeaderContainer>
  );
}

export default Header;
