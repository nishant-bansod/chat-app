import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, doc, setDoc, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Form, Image } from 'react-bootstrap';
import '../components/FunTheme.css';

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
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
        const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          // Removed unused state variable
          // setOtherUser(userSnapshot.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchOtherUser();

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
    if (!newMessage.trim() || !user || !userId) return;
    
    const chatId = [user.uid, userId].sort().join('_');
    
    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        uid: user.uid,
        displayName: user.displayName || user.email,
        photoURL: user.photoURL || '',
        chatId,
        recipientId: userId,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      alert(`Send failed: ${err.message}`);
      return;
    }
    
    // Update contact's last chat time
    await updateContactLastChat(user.uid, userId);
    await updateContactLastChat(userId, user.uid);
    
    setNewMessage('');
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

  const generateInviteLink = async () => {
    try {
      const inviteId = Math.random().toString(36).substring(2, 15);
      const inviteData = {
        id: inviteId,
        createdBy: user.uid,
        creatorName: user.displayName || user.email,
        creatorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      await setDoc(doc(db, 'invites', inviteId), inviteData);
      
      const inviteLink = `${window.location.origin}/invite/${inviteId}`;
      
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard! Share it with anyone to start chatting.');
      
    } catch (error) {
      console.error('Error generating invite link:', error);
      alert('Error generating invite link');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleBackToUsers = () => {
    navigate('/contacts');
  };

  return (
    <div className="fun-container">
      <Container className="py-4" style={{ maxWidth: 800 }}>
        <Card className="fun-card bounce-in">
          <div className="fun-card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <Button className="btn-fun btn-fun-secondary me-3" onClick={handleBackToUsers}>
                  🔙 Back to Buddies
                </Button>
                <div>
                  <h4 className="fun-title mb-0">💬 Chat Time!</h4>
                  <p className="fun-subtitle mb-0">Let the conversation flow ✨</p>
                </div>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <Button 
                  className="btn-fun btn-fun-accent"
                  onClick={generateInviteLink}
                  title="Generate shareable invite link"
                >
                  🔗 Share Magic Link
                </Button>
                <Button 
                  className="btn-fun btn-fun-secondary"
                  onClick={() => navigate('/contacts')}
                >
                  📞 Contacts
                </Button>
                {user && (
                  <div className="d-flex align-items-center ms-3">
                    <Image 
                      src={user.photoURL || 'https://via.placeholder.com/40'} 
                      alt="avatar" 
                      width={40} 
                      height={40} 
                      className="avatar-fun me-2" 
                    />
                    <span className="text-white fw-bold me-3">
                      {user.displayName || user.email}
                    </span>
                    <Button className="btn-fun btn-fun-accent" onClick={handleLogout}>
                      👋 Logout
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Card.Body className="fun-scrollbar" style={{ height: '500px', overflowY: 'auto', padding: '2rem', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            {messages.length === 0 ? (
              <div className="text-center py-5">
                <div style={{fontSize: '3rem', marginBottom: '1rem'}}>💭</div>
                <h5 style={{color: '#666'}}>Start the conversation!</h5>
                <p style={{color: '#999'}}>Send your first message to break the ice 🧊</p>
                <div style={{fontSize: '2rem', marginTop: '1rem'}}>🚀✨💫</div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={message.id} 
                  className={`d-flex mb-4 ${message.uid === user.uid ? 'justify-content-end' : 'justify-content-start'}`}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className={`message-bubble ${message.uid === user.uid ? 'message-bubble-sent' : 'message-bubble-received'}`}>
                    <div className="d-flex align-items-center mb-2">
                      <Image 
                        src={message.photoURL || 'https://via.placeholder.com/24'} 
                        alt="avatar" 
                        width={24} 
                        height={24} 
                        className="avatar-fun me-2" 
                        style={{width: '24px', height: '24px'}}
                      />
                      <small className={`fw-bold ${message.uid === user.uid ? 'text-white' : 'text-dark'}`}>
                        {message.displayName} {message.uid === user.uid ? '🚀' : '💬'}
                      </small>
                    </div>
                    <div style={{fontSize: '1rem', lineHeight: '1.4'}}>
                      {message.text}
                    </div>
                    <div className="message-time text-end">
                      {message.createdAt?.toDate().toLocaleTimeString()} ⏰
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </Card.Body>
          
          <Card.Footer style={{background: 'rgba(255, 255, 255, 0.9)', borderRadius: '0 0 20px 20px', padding: '1.5rem'}}>
            <Form onSubmit={handleSend}>
              <div className="d-flex gap-3 align-items-end">
                <div className="flex-grow-1">
                  <Form.Control
                    className="form-control-fun"
                    type="text"
                    placeholder="Type something awesome... 🎉"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{fontSize: '1rem', padding: '15px 20px'}}
                  />
                </div>
                <Button 
                  className="btn-fun btn-fun-primary" 
                  type="submit"
                  style={{padding: '15px 25px', fontSize: '1rem'}}
                  disabled={!newMessage.trim()}
                >
                  🚀 Send
                </Button>
              </div>
            </Form>
          </Card.Footer>
        </Card>
      </Container>
    </div>
  );
}

export default ChatRoom;