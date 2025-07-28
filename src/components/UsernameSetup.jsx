import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Alert, Modal } from 'react-bootstrap';
import styled from 'styled-components';

const SetupContainer = styled.div`
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const StyledForm = styled(Form)`
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-label {
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  .form-control {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #ddd;
    width: 100%;
    font-size: 1rem;
    
    &:focus {
      border-color: #FFCD1F;
      box-shadow: 0 0 0 0.2rem rgba(255, 205, 31, 0.25);
    }
  }
`;

const SubmitButton = styled(Button)`
  width: 100%;
  padding: 0.75rem;
  font-weight: 600;
  background-color: #FFCD1F;
  border: none;
  color: #000;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e6b800;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background-color: #f0f0f0;
    color: #999;
    transform: none;
  }
`;

function UsernameSetup() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Redirect if no user is logged in
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if username is already taken
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('This username is already taken');
      }
      
      // Update user document with username
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || username,
        username: username.toLowerCase(),
        photoURL: currentUser.photoURL || '',
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      // Redirect to contacts page
      navigate('/contacts');
      
    } catch (err) {
      console.error('Error setting username:', err);
      setError(err.message || 'Failed to set username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <Modal show={true} centered backdrop="static">
      <Modal.Body>
        <SetupContainer>
          <Title>Choose Your Username</Title>
          <p className="text-muted mb-4 text-center">
            Your username is how others will find and add you on BumbleChat.
          </p>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <StyledForm onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                disabled={loading}
                autoComplete="username"
                autoFocus
              />
              <small className="text-muted">
                3-20 characters (letters, numbers, and underscores)
              </small>
            </div>
            
            <SubmitButton 
              type="submit" 
              disabled={loading || username.length < 3}
            >
              {loading ? 'Saving...' : 'Continue'}
            </SubmitButton>
          </StyledForm>
        </SetupContainer>
      </Modal.Body>
    </Modal>
  );
}

export default UsernameSetup;
