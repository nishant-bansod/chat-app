import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, addDoc, query, orderBy, 
  onSnapshot, serverTimestamp, where, 
  doc, setDoc, getDoc 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Form, Image, Spinner } from 'react-bootstrap';
import { ArrowLeft, Send, Check2All } from 'react-bootstrap-icons';
import '../components/FunTheme.css';

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const user = auth.currentUser;
  const navigate = useNavigate();
  const { userId } = useParams();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!userId) {
      navigate('/contacts');
      return;
    }

    // Fetch other user's info
    const fetchOtherUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setOtherUser({ id: userDoc.id, ...userDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    if (userId) {
      fetchOtherUser();
    }

    // Listen to messages
    const chatId = [user.uid, userId].sort().join('_');
    const q = query(
      collection(db, 'messages'), 
      where('chatId', '==', chatId),
      orderBy('createdAt')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return unsubscribe;
  }, [user, userId, navigate]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userId || isSending) return;
    
    setIsSending(true);
    const chatId = [user.uid, userId].sort().join('_');
    
    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        uid: user.uid,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        chatId,
        recipientId: userId,
        status: 'sent'
      });
      
      // Update contact's last chat time
      await updateContactLastChat(user.uid, userId);
      await updateContactLastChat(userId, user.uid);
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const updateContactLastChat = async (userId, contactId) => {
    try {
      const contactRef = doc(db, 'contacts', `${userId}_${contactId}`);
      await setDoc(contactRef, {
        userId,
        contactId,
        lastChatAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  // Removed unused generateInviteLink function

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Removed unused handleBackToUsers function

  // Format message time
  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Container className="chat-container py-0 px-0 h-100 d-flex flex-column">
      <Card className="h-100 d-flex flex-column border-0 rounded-0">
        {/* Chat Header */}
        <Card.Header className="d-flex justify-content-between align-items-center bg-light py-3 border-bottom">
          <div className="d-flex align-items-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/contacts')}
              className="p-0 me-2"
              aria-label="Back to contacts"
            >
              <ArrowLeft size={24} />
            </Button>
            <div className="d-flex align-items-center">
              <Image 
                src={otherUser?.photoURL || '/default-avatar.png'} 
                roundedCircle 
                width={40} 
                height={40}
                className="me-2"
                alt={otherUser?.displayName || 'User'}
              />
              <div>
                <h6 className="mb-0">{otherUser?.displayName || 'Loading...'}</h6>
                <small className="text-muted">
                  {otherUser?.status || 'Online'}
                </small>
              </div>
            </div>
          </div>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={handleLogout}
            className="d-flex align-items-center"
            aria-label="Sign out"
          >
            <span className="d-none d-md-inline">Sign Out</span>
          </Button>
        </Card.Header>
        
        {/* Messages Area */}
        <Card.Body className="chat-messages flex-grow-1 p-0" style={{ overflowY: 'auto', background: '#f8f9fa' }}>
          {messages.length === 0 ? (
            <div className="h-100 d-flex flex-column justify-content-center align-items-center text-center p-4">
              <div className="mb-3" style={{ fontSize: '3rem' }}>💬</div>
              <h5 className="text-muted mb-2">No messages yet</h5>
              <p className="text-muted">Send your first message to start the conversation!</p>
            </div>
          ) : (
            <div className="p-3">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`d-flex mb-3 ${msg.uid === user.uid ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  {msg.uid !== user.uid && (
                    <Image 
                      src={msg.photoURL || '/default-avatar.png'} 
                      roundedCircle 
                      width={36} 
                      height={36}
                      className="me-2 align-self-end"
                      alt={msg.displayName}
                    />
                  )}
                  <div className="d-flex flex-column" style={{ maxWidth: '70%' }}>
                    <div 
                      className={`p-3 rounded-3 position-relative ${
                        msg.uid === user.uid 
                          ? 'bg-primary text-white' 
                          : 'bg-white border'
                      }`}
                    >
                      {msg.text}
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className={`${msg.uid === user.uid ? 'text-white-50' : 'text-muted'}`}>
                          {formatTime(msg.createdAt)}
                        </small>
                        {msg.uid === user.uid && (
                          <span className="ms-2">
                            <Check2All size={16} className={msg.status === 'read' ? 'text-info' : 'text-white-50'} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </Card.Body>
        
        {/* Message Input */}
        <Card.Footer className="border-top bg-white p-3">
          <Form onSubmit={handleSend} className="d-flex gap-2">
            <Form.Control
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow-1"
              disabled={isSending}
              aria-label="Type a message"
            />
            <Button 
              variant="primary" 
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="d-flex align-items-center justify-content-center"
              style={{ width: '48px', height: '38px' }}
              aria-label="Send message"
            >
              {isSending ? (
                <Spinner animation="border" size="sm" role="status">
                  <span className="visually-hidden">Sending...</span>
                </Spinner>
              ) : (
                <Send size={18} />
              )}
            </Button>
          </Form>
        </Card.Footer>
      </Card>
    </Container>
  );
}

export default ChatRoom;