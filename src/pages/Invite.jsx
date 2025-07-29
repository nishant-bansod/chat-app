import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  updateDoc 
} from 'firebase/firestore';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { onAuthStateChanged } from 'firebase/auth';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function Invite() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  
  // Check if users are already contacts
  const [existingContact, setExistingContact] = useState(false);

  // Wait for Firebase Auth to resolve current currentUser
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // Memoize the checkExistingContact function with useCallback
  const checkExistingContact = React.useCallback(async (inviterId) => {
    if (!currentUser) return false;
    
    const contactRef = collection(db, 'contacts');
    const q = query(
      contactRef,
      where('userId', '==', currentUser.uid),
      where('contactId', '==', inviterId)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }, [currentUser]);

  // Memoize the fetchInvite function to avoid recreating it on every render
  const fetchInvite = React.useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const inviteDoc = await getDoc(doc(db, 'invites', inviteId));
      
      if (!inviteDoc.exists()) {
        setError('Invalid or expired invitation link');
        setLoading(false);
        return;
      }

      const data = inviteDoc.data();
      
      // Check if users are already contacts
      const isExistingContact = await checkExistingContact(data.inviterId);
      if (isExistingContact) {
        setExistingContact(true);
        setLoading(false);
        return;
      }
      
      // Check if invite is expired (24 hours)
      const now = new Date();
      const inviteTime = data.createdAt?.toDate();
      const hoursDiff = (now - inviteTime) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        setError('This invitation link has expired');
        setLoading(false);
        return;
      }

      setInviteData(data);
    } catch (err) {
      setError('Error loading invitation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [checkExistingContact, currentUser, inviteId]);

  useEffect(() => {
    if (currentUser === null) return; // still loading auth
    if (!currentUser) {
      navigate('/');
      return;
    }

    fetchInvite();
  }, [fetchInvite, currentUser, navigate]);



  const handleAccept = async () => {
    if (!currentUser || !inviteData) return;
    
    setProcessing(true);
    setError('');
    
    try {
      // Check again if users are already contacts
      const isExistingContact = await checkExistingContact(inviteData.inviterId);
      if (isExistingContact) {
        setExistingContact(true);
        setProcessing(false);
        return;
      }
      
      // Create a chat between users
      const chatRef = doc(collection(db, 'chats'));
      await setDoc(chatRef, {
        participants: [currentUser.uid, inviteData.inviterId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null
      });
      
      // Create contact entries for both users
      const batch = writeBatch(db);
      
      // Add inviter to current user's contacts
      const currentUserContactRef = doc(collection(db, 'contacts'));
      batch.set(currentUserContactRef, {
        userId: currentUser.uid,
        contactId: inviteData.inviterId,
        displayName: inviteData.inviterName,
        photoURL: inviteData.inviterPhoto || null,
        chatId: chatRef.id,
        createdAt: serverTimestamp(),
        lastChatAt: serverTimestamp(),
        lastMessage: 'Chat started'
      });
      
      // Add current user to inviter's contacts
      const inviterContactRef = doc(collection(db, 'contacts'));
      batch.set(inviterContactRef, {
        userId: inviteData.inviterId,
        contactId: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL || null,
        chatId: chatRef.id,
        createdAt: serverTimestamp(),
        lastChatAt: serverTimestamp(),
        lastMessage: 'Chat started'
      });
      
      await batch.commit();
      
      // Mark the invite as accepted
      await updateDoc(doc(db, 'invites', inviteId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      
      setSuccess(true);
      
      // Redirect to the new chat after a short delay
      setTimeout(() => {
        navigate(`/chat/${chatRef.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setProcessing(false);
    }  
  };



  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading invitation...</span>
      </Container>
    );
  }

  if (success) {
    return (
      <Container className="py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card className="text-center">
              <Card.Body>
                <FaCheckCircle className="text-success mb-3" size={48} />
                <h3>Invitation Accepted!</h3>
                <p>You are now connected with {inviteData?.inviterName}.</p>
                <p>Redirecting to your chat...</p>
                <Spinner animation="border" size="sm" className="mt-2" />
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    );
  }

  if (existingContact) {
    return (
      <Container className="py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
              <Card.Body className="text-center">
                <FaCheckCircle className="text-success mb-3" size={48} />
                <h3>Already Connected</h3>
                <p>You are already connected with {inviteData?.inviterName}.</p>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/contacts')}
                  className="mt-3"
                >
                  Go to Contacts
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5" style={{ maxWidth: 500 }}>
        <Card>
          <Card.Body className="text-center">
            <Alert variant="danger">{error}</Alert>
            <Button variant="primary" onClick={() => navigate('/contacts')}>
              Go to Contacts
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card>
            <Card.Body className="text-center">
              <h2>Chat Invitation</h2>
              
              {error ? (
                <Alert variant="danger" className="text-start">
                  <FaTimesCircle className="me-2" />
                  {error}
                </Alert>
              ) : (
                <>
                  <div className="my-4">
                    <div className="avatar-lg mx-auto mb-3">
                      {inviteData?.inviterPhoto ? (
                        <img 
                          src={inviteData.inviterPhoto} 
                          alt={inviteData.inviterName}
                          className="rounded-circle img-thumbnail"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center mx-auto"
                          style={{ 
                            width: '100px', 
                            height: '100px',
                            fontSize: '2.5rem',
                            color: 'white'
                          }}
                        >
                          {inviteData?.inviterName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <h4>{inviteData?.inviterName || 'Someone'}</h4>
                    <p className="text-muted">wants to connect with you!</p>
                  </div>
                  
                  <div className="d-grid gap-2 mt-4">
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={handleAccept}
                      disabled={!inviteData || processing}
                      className="mb-2"
                    >
                      {processing ? (
                        <>
                          <Spinner as="span" size="sm" animation="border" role="status" aria-hidden="true" className="me-2" />
                          Connecting...
                        </>
                      ) : (
                        'Accept Invitation'
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => navigate('/')}
                      disabled={processing}
                    >
                      Maybe Later
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
          
          <div className="text-center mt-3">
            <small className="text-muted">
              By accepting, you agree to our Terms of Service and Privacy Policy
            </small>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default Invite;
