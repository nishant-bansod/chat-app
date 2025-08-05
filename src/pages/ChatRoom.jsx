import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  collection, addDoc, query, orderBy, 
  onSnapshot, serverTimestamp, where, 
  doc, setDoc, getDoc 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Form, Image, Spinner, Alert } from 'react-bootstrap';
import { ArrowLeft, Send, Check2All, PersonCircle, BoxArrowRight, Chat } from 'react-bootstrap-icons';
import styled from 'styled-components';
import { colors, shadows, borderRadius } from '../theme/colors';

// Styled Components
const ChatContainer = styled(Container)`
  height: 100vh;
  max-width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: ${colors.background};
`;

const ChatHeader = styled(Card.Header)`
  background-color: ${colors.headerBackground};
  border-bottom: 1px solid ${colors.border};
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${shadows.small};
  z-index: 10;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: ${borderRadius.large};
  position: relative;
  word-wrap: break-word;
  line-height: 1.4;
  font-size: 0.95rem;
  box-shadow: ${shadows.small};
  animation: fadeInUp 0.3s ease-out;
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  ${props => props.sent ? `
    align-self: flex-end;
    background-color: ${colors.chatBubbleSent};
    color: ${colors.chatTextSent};
    border-bottom-right-radius: ${borderRadius.small};
  ` : `
    align-self: flex-start;
    background-color: ${colors.chatBubbleReceived};
    color: ${colors.chatTextReceived};
    border-bottom-left-radius: ${borderRadius.small};
  `}
`;

const MessageTime = styled.span`
  font-size: 0.7rem;
  color: ${colors.chatTime};
  display: block;
  text-align: right;
  margin-top: 4px;
`;

const MessageInputContainer = styled.div`
  padding: 16px;
  background-color: ${colors.background};
  border-top: 1px solid ${colors.border};
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
`;

const SendButton = styled(Button)`
  background-color: ${colors.primary};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-left: 10px;
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    background-color: ${colors.primaryDark};
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    background-color: ${colors.border};
    transform: none;
  }
`;

const BackButton = styled(Button)`
  background: none;
  border: none;
  color: ${colors.text};
  padding: 8px;
  margin-right: 10px;
  border-radius: ${borderRadius.medium};
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    background-color: rgba(0, 0, 0, 0.05);
    color: ${colors.text};
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAvatar = styled(Image)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${colors.border};
`;

const UserName = styled.span`
  font-weight: 600;
  font-size: 1.1rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4caf50;
  margin-right: 6px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: ${colors.textSecondary};
  
  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: ${colors.primary};
  }
`;

function ChatRoom() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { userId } = useParams();

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    if (!userId) {
      navigate('/contacts');
      return;
    }

    setLoading(true);
    setError('');

    // Fetch other user's info
    const fetchOtherUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setOtherUser({ id: userDoc.id, ...userDoc.data() });
        } else {
          setError('User not found');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user information');
      }
    };

    if (userId) {
      fetchOtherUser();
    }

    // Listen to messages
    const chatId = [user.uid, userId].sort().join('_');
    console.log('Setting up message listener for chatId:', chatId);
    
    try {
      const q = query(
        collection(db, 'messages'), 
        where('chatId', '==', chatId),
        orderBy('createdAt')
      );
      
      const unsubscribe = onSnapshot(
        q, 
        (querySnapshot) => {
          console.log('Received message update:', querySnapshot.docs.length, 'messages');
          const msgs = [];
          querySnapshot.forEach((doc) => {
            console.log('Message data:', doc.id, doc.data());
            msgs.push({ id: doc.id, ...doc.data() });
          });
          setMessages(msgs);
          setLoading(false);
          
          // Scroll to bottom after messages are rendered
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        },
        (error) => {
          console.error('Error in message listener:', error);
          setError('Error loading messages. Please refresh the page.');
          setLoading(false);
        }
      );
      
      return () => {
        console.log('Cleaning up message listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up message listener:', error);
      setError('Failed to set up message listener');
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, [user, userId, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <ChatContainer>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </ChatContainer>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userId || isSending) return;
    
    setIsSending(true);
    const chatId = [user.uid, userId].sort().join('_');
    
    try {
      console.log('Sending message with chatId:', chatId);
      const messageData = {
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
        uid: user.uid,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        chatId,
        recipientId: userId,
        status: 'sent'
      };
      console.log('Message data:', messageData);
      
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      console.log('Message sent with ID:', docRef.id);
      
      // Update contact's last chat time
      console.log('Updating last chat time...');
      await Promise.all([
        updateContactLastChat(user.uid, userId),
        updateContactLastChat(userId, user.uid)
      ]);
      console.log('Contact timestamps updated');
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', {
        error: err,
        message: err.message,
        stack: err.stack
      });
      setError(`Failed to send message: ${err.message}. Please try again.`);
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
        lastChatAt: serverTimestamp(),
        lastMessage: newMessage.trim()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Format message time
  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (error) {
    return (
      <ChatContainer fluid>
        <Alert variant="danger" className="m-3">
          {error}
          <Button variant="outline-danger" className="ms-3" onClick={() => navigate('/contacts')}>
            Back to Contacts
          </Button>
        </Alert>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer fluid>
      <Card className="h-100 d-flex flex-column border-0 rounded-0">
        {/* Chat Header */}
        <ChatHeader>
          <div className="d-flex align-items-center">
            <BackButton 
              onClick={() => navigate('/contacts')}
              aria-label="Back to contacts"
            >
              <ArrowLeft size={24} />
            </BackButton>
            {otherUser && (
              <UserInfo>
                {otherUser.photoURL ? (
                  <UserAvatar 
                    src={otherUser.photoURL} 
                    alt={otherUser.displayName || 'User'}
                  />
                ) : (
                  <PersonCircle size={36} color={colors.textSecondary} />
                )}
                <div>
                  <UserName>{otherUser.displayName || 'User'}</UserName>
                  <div className="small" style={{ color: colors.textSecondary }}>
                    <StatusBadge /> Online
                  </div>
                </div>
              </UserInfo>
            )}
          </div>
          <Button 
            variant="link" 
            onClick={handleLogout}
            style={{ color: colors.text }}
            aria-label="Sign out"
            className="p-1"
          >
            <BoxArrowRight size={22} />
          </Button>
        </ChatHeader>

        {/* Messages */}
        <MessageList>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading messages...</span>
              </Spinner>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState>
              <Chat />
              <div className="mb-2">No messages yet</div>
              <small>Start the conversation!</small>
            </EmptyState>
          ) : (
            messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                sent={msg.uid === user.uid}
              >
                {msg.text}
                <MessageTime>
                  {msg.createdAt?.toDate ? formatTime(msg.createdAt) : 'Sending...'}
                  {msg.uid === user.uid && (
                    <Check2All size={12} className="ms-1" />
                  )}
                </MessageTime>
              </MessageBubble>
            ))
          )}
          <div ref={messagesEndRef} />
        </MessageList>

        {/* Message Input */}
        <MessageInputContainer>
          <Form onSubmit={handleSend} className="d-flex">
            <Form.Control
              as="input"
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="rounded-pill me-2"
              style={{
                padding: '10px 20px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text,
                boxShadow: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = 'none';
              }}
            />
            <SendButton 
              type="submit" 
              disabled={!newMessage.trim() || isSending}
              aria-label="Send message"
            >
              {isSending ? (
                <Spinner animation="border" size="sm" style={{ color: colors.text }} />
              ) : (
                <Send size={18} color={colors.text} />
              )}
            </SendButton>
          </Form>
        </MessageInputContainer>
      </Card>
    </ChatContainer>
  );
};

export default ChatRoom;