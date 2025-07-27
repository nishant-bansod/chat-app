import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, ListGroup, Image } from 'react-bootstrap';
import '../components/FunTheme.css';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), where('uid', '!=', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const usersList = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, navigate]);

  const handleUserSelect = async (selectedUser) => {
    // Save contact when starting a chat
    await saveContact(currentUser.uid, selectedUser.uid);
    await saveContact(selectedUser.uid, currentUser.uid);
    navigate(`/chat/${selectedUser.uid}`);
  };

  const saveContact = async (userId, contactId) => {
    try {
      const contactRef = doc(db, 'contacts', `${userId}_${contactId}`);
      await setDoc(contactRef, {
        userId,
        contactId,
        addedAt: serverTimestamp(),
        lastChatAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="fun-container">
        <Container className="d-flex justify-content-center align-items-center vh-100">
          <div className="fun-card p-4 text-center bounce-in">
            <div className="loading-fun mx-auto mb-3">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <h5>Finding awesome people... 🔍✨</h5>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="fun-container">
      <Container className="py-4" style={{ maxWidth: 700 }}>
        <Card className="fun-card bounce-in">
          <div className="fun-card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="fun-title">Find Chat Buddies! 🎯</h3>
                <p className="fun-subtitle">Discover amazing people to chat with</p>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <Button 
                  className="btn-fun btn-fun-secondary"
                  onClick={() => navigate('/contacts')}
                >
                  📞 My Contacts
                </Button>
                {currentUser && (
                  <div className="d-flex align-items-center ms-3">
                    <Image 
                      src={currentUser.photoURL || 'https://via.placeholder.com/40'} 
                      alt="avatar" 
                      width={40} 
                      height={40} 
                      className="avatar-fun me-2" 
                    />
                    <span className="text-white fw-bold me-3">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    <Button className="btn-fun btn-fun-accent" onClick={handleLogout}>
                      👋 Logout
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Card.Body className="p-4">
            {users.length === 0 ? (
              <div className="text-center py-5">
                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🤷‍♂️</div>
                <h4 style={{color: '#666', marginBottom: '1rem'}}>No chat buddies found!</h4>
                <p style={{color: '#999', fontSize: '1.1rem'}}>
                  🎉 Share this awesome app with friends to start chatting!
                </p>
                <div style={{fontSize: '2rem', marginTop: '1rem'}}>💬✨🚀</div>
              </div>
            ) : (
              <div>
                <div className="mb-3 text-center">
                  <span style={{color: '#666', fontSize: '1.1rem', fontWeight: 'bold'}}>
                    🎊 {users.length} awesome {users.length === 1 ? 'person' : 'people'} ready to chat!
                  </span>
                </div>
                <ListGroup className="list-group-flush">
                  {users.map((user, index) => (
                    <div 
                      key={user.uid}
                      className={`list-group-item-fun d-flex align-items-center p-3 ${index % 2 === 0 ? 'slide-in-left' : 'slide-in-right'}`}
                      onClick={() => handleUserSelect(user)}
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <Image 
                        src={user.photoURL || 'https://via.placeholder.com/50'} 
                        alt="avatar" 
                        width={50} 
                        height={50} 
                        className="avatar-fun me-3" 
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <span className="fw-bold" style={{color: '#333', fontSize: '1.1rem'}}>
                            {user.displayName || 'Anonymous'}
                          </span>
                          <span className="ms-2" style={{fontSize: '1.2rem'}}>💬</span>
                        </div>
                        <small style={{color: '#666'}}>
                          📧 {user.email}
                        </small>
                        <div className="mt-1">
                          <small style={{color: '#4ecdc4', fontWeight: 'bold'}}>
                            ✨ Ready to chat!
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>🚀</div>
                        <small style={{color: '#999'}}>Click to chat</small>
                      </div>
                    </div>
                  ))}
                </ListGroup>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default Users; 