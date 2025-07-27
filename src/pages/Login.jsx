import React, { useState } from 'react';
import { auth, provider, db } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import './Login.css';
import { doc, setDoc } from 'firebase/firestore';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Store user in Firestore
  const saveUser = async (user) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName || email,
      email: user.email,
      photoURL: user.photoURL || '',
    }, { merge: true });
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUser(result.user);
      navigate('/contacts');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await saveUser(result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await saveUser(result.user);
      }
      navigate('/contacts');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Floating Decorative Shapes */}
      <div className="floating-shapes">
        <div className="shape shape-1">💬</div>
        <div className="shape shape-2">😊</div>
        <div className="shape shape-3">🎉</div>
      </div>
      
      <Container className="d-flex flex-column justify-content-center align-items-center vh-100">
        <Card className="login-card">
          <div className="login-title">
            ChatFun
            <span className="fun-emoji">💬</span>
            <span className="fun-emoji">🚀</span>
          </div>
          <div className="login-subtitle">
            Where conversations come alive! <span className="fun-emoji">✨</span>
          </div>
          
          {error && <Alert className="alert-fun">{error}</Alert>}
          
          <Form onSubmit={handleEmailLogin}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label style={{color: '#666', fontWeight: 'bold'}}>📧 Email Address</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="Enter your awesome email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </Form.Group>
            
            <Form.Group className="mb-4" controlId="formBasicPassword">
              <Form.Label style={{color: '#666', fontWeight: 'bold'}}>🔒 Password</Form.Label>
              <InputGroup>
                <Form.Control 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Super secret password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                <InputGroup.Text style={{cursor: 'pointer'}} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>
            
            <Button type="submit" className="btn-fun-primary w-100 mb-3" disabled={loading}>
              {loading ? 'Loading...' : (isRegister ? '🎉 Join the Fun!' : '🚀 Let\'s Chat!')}
            </Button>
            
            <Button 
              className="btn-fun-secondary w-100 mb-3" 
              onClick={() => setIsRegister(!isRegister)}
              type="button"
              disabled={loading}
            >
              {isRegister ? '👋 Already have an account?' : '✨ New here? Join us!'}
            </Button>
          </Form>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <Button onClick={handleGoogleLogin} className="btn-google w-100">
            <span style={{marginRight: '10px'}}>🌟</span>
            Continue with Google
            <span style={{marginLeft: '10px'}}>🌟</span>
          </Button>
        </Card>
      </Container>
    </div>
  );
}

export default Login; 