import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';

function Invite() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchInvite = async () => {
      try {
        const inviteDoc = await getDoc(doc(db, 'invites', inviteId));
        
        if (!inviteDoc.exists()) {
          setError('Invalid or expired invitation link');
          return;
        }

        const data = inviteDoc.data();
        
        // Check if invite is expired (24 hours)
        const now = new Date();
        const inviteTime = data.createdAt?.toDate();
        const hoursDiff = (now - inviteTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          setError('This invitation link has expired');
          return;
        }

        setInviteData(data);
      } catch (err) {
        setError('Error loading invitation');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [inviteId, user, navigate]);

  const handleJoinChat = async () => {
    if (!inviteData || !user) return;

    try {
      // Save contact for both users
      await saveContact(user.uid, inviteData.createdBy);
      await saveContact(inviteData.createdBy, user.uid);

      // Navigate to chat room
      navigate(`/chat/${inviteData.createdBy}`);
    } catch (err) {
      setError('Error joining chat');
      console.error(err);
    }
  };

  const saveContact = async (userId, contactId) => {
    const contactRef = doc(db, 'contacts', `${userId}_${contactId}`);
    await setDoc(contactRef, {
      userId,
      contactId,
      addedAt: serverTimestamp(),
      lastChatAt: serverTimestamp()
    }, { merge: true });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading invitation...</p>
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
    <Container className="py-5" style={{ maxWidth: 500 }}>
      <Card>
        <Card.Header className="text-center">
          <h4>Chat Invitation</h4>
        </Card.Header>
        <Card.Body className="text-center">
          <div className="mb-4">
            <img 
              src={inviteData?.creatorPhoto || '/default-avatar.png'} 
              alt="Creator" 
              className="rounded-circle mb-3"
              style={{ width: 80, height: 80, objectFit: 'cover' }}
            />
            <h5>{inviteData?.creatorName || 'Someone'}</h5>
            <p className="text-muted">has invited you to chat!</p>
          </div>
          
          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleJoinChat}
            >
              Join Chat
            </Button>
            <Button 
              variant="outline-secondary"
              onClick={() => navigate('/contacts')}
            >
              Maybe Later
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Invite;
