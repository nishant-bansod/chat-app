import React, { useState, useEffect } from 'react';
import { auth, provider, db } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Form, Alert, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import styled from 'styled-components';
import { FaGoogle, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight } from 'react-icons/fa';
import { colors, shadows, borderRadius } from '../theme/colors';

// Styled Components
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff9e6 0%, #fff 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: ${colors.background};
  border-radius: ${borderRadius.large};
  box-shadow: ${shadows.large};
  padding: 40px;
  width: 100%;
  max-width: 450px;
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const Title = styled.h1`
  color: ${colors.primary};
  font-weight: 800;
  font-size: 2.5rem;
  margin-bottom: 10px;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  color: ${colors.textSecondary};
  margin-bottom: 30px;
  font-size: 1.1rem;
`;

const StyledForm = styled(Form)`
  width: 100%;
`;

const FormGroup = styled(Form.Group)`
  margin-bottom: 1.5rem;
  text-align: left;
`;

const FormLabel = styled(Form.Label)`
  font-weight: 600;
  color: ${colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const StyledInput = styled(Form.Control)`
  border-radius: ${borderRadius.medium};
  padding: 12px 16px;
  border: 1px solid ${colors.border};
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 205, 31, 0.2);
  }
`;

const StyledButton = styled(Button)`
  width: 100%;
  padding: 12px;
  font-weight: 600;
  border-radius: ${borderRadius.medium};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
  
  &.btn-primary {
    background-color: ${colors.primary};
    border: none;
    color: ${colors.text};
    
    &:hover {
      background-color: ${colors.primaryDark};
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &.btn-outline {
    background: transparent;
    border: 1px solid ${colors.border};
    color: ${colors.text};
    
    &:hover {
      background: ${colors.surface};
      border-color: ${colors.primary};
    }
  }
`;

const ToggleText = styled.p`
  margin-top: 1.5rem;
  color: ${colors.textSecondary};
  
  button {
    background: none;
    border: none;
    color: ${colors.primary};
    font-weight: 600;
    padding: 0;
    cursor: pointer;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${colors.primaryDark};
      text-decoration: underline;
    }
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: ${colors.textSecondary};
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid ${colors.border};
  }
  
  span {
    padding: 0 10px;
    font-size: 0.9rem;
  }
`;

const PasswordToggle = styled(Button)`
  background: none;
  border: none;
  color: ${colors.textSecondary};
  padding: 0 10px;
  
  &:hover, &:focus {
    background: none;
    color: ${colors.primary};
  }
`;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const redirectTo = location.state?.from?.pathname || '/contacts';
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, location]);

  // Store minimal user data in Firestore
  const saveUser = async (user) => {
    if (!user) return;
    
    // Only save essential data during login/registration
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString()
    };
    
    // Username will be set in the UsernameSetup component
    await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
    return userData;
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUser(result.user);
      // Let the useEffect handle navigation after auth state changes
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Login form submitted', { email, password, isRegister });
    if (isRegister && (!email || !password)) {
      setError('Please enter both email and password');
      console.warn('Missing email or password');
      return;
    }
    setLoading(true);
    try {
      let result;
      if (isRegister) {
        console.log('Attempting registration...');
        result = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Registration successful', result);
        await saveUser(result.user);
      } else {
        console.log('Attempting sign in...');
        result = await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful', result);
        await saveUser(result.user);
      }
      // Let the useEffect handle navigation after auth state changes
    } catch (err) {
      console.error('Email login error:', err);
      setError((err && err.message) ? err.message : 'Failed to sign in. Please try again.');
      // Show alert if error is not visible
      alert('Login error: ' + ((err && err.message) ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Nishant Chat Room</Title>
        <Subtitle>Connect with friends in real-time</Subtitle>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <StyledButton 
          variant="outline" 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-outline"
        >
          <FaGoogle /> Continue with Google
        </StyledButton>
        
        <Divider><span>OR</span></Divider>
        
        <StyledForm onSubmit={handleEmailLogin}>
          {isRegister && (
            <FormGroup controlId="formBasicUsername" className="mb-3">
              <FormLabel>Username</FormLabel>
              <StyledInput 
                type="text" 
                placeholder="Choose a username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </FormGroup>
          )}
          <FormGroup controlId="formBasicEmail" className="mb-3">
            <FormLabel>
              <FaEnvelope /> Email Address
            </FormLabel>
            <StyledInput 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </FormGroup>
          
          <FormGroup controlId="formBasicPassword">
            <FormLabel>
              <FaLock /> Password
            </FormLabel>
            <InputGroup>
              <StyledInput 
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={isRegister ? 6 : 1}
              />
              <PasswordToggle 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </InputGroup>
          </FormGroup>
          
          <StyledButton 
            type="submit" 
            variant="primary"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {isRegister ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              <>
                {isRegister ? 'Sign Up' : 'Sign In'} <FaArrowRight />
              </>
            )}
          </StyledButton>
          
          <ToggleText>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button 
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </ToggleText>
        </StyledForm>
      </LoginCard>
    </LoginContainer>
  );
}

export default Login;