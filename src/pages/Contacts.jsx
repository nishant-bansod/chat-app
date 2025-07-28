import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, doc, getDoc, orderBy, onSnapshot, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, ListGroup, Image, InputGroup, Form, Badge } from 'react-bootstrap';
import { Trash, ChatLeftText, PersonPlus } from 'react-bootstrap-icons';
import '../components/FunTheme.css';
import AddContactModal from '../components/AddContactModal';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    if (!currentUser?.uid) return;
    
    // Set up real-time listener for contacts
    const contactsQuery = query(
      collection(db, 'contacts'),
      where('userId', '==', currentUser.uid),
      orderBy('lastChatAt', 'desc')
    );
    
    const unsubscribeContacts = onSnapshot(contactsQuery, async (snapshot) => {
      // Process each contact in parallel
      const contactPromises = snapshot.docs.map(async (contactDoc) => {
        const contactData = contactDoc.data();
        try {
          const userDoc = await getDoc(doc(db, 'users', contactData.contactId));
          if (userDoc.exists()) {
            return {
              id: contactDoc.id,
              ...contactData,
              userInfo: userDoc.data()
            };
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
        return null;
      });
      
      // Wait for all user data to be fetched
      const contactsWithUserData = (await Promise.all(contactPromises)).filter(Boolean);
      
      setContacts(contactsWithUserData);
      setFilteredContacts(contactsWithUserData);
      setLoading(false);
    }, (error) => {
      console.error('Error in contacts listener:', error);
      setLoading(false);
    });
    
    // Subscribe to pending friend requests
    const requestsQuery = query(
      collection(db, 'contactRequests'),
      where('toUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    
    const unsubscribeRequests = onSnapshot(requestsQuery, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error('Error in requests listener:', error);
    });
    
    // Clean up all listeners on unmount
    return () => {
      unsubscribeContacts();
      unsubscribeRequests();
    };
   }, [currentUser, navigate]);

  useEffect(() => {
    const filtered = contacts.filter(contact =>
      contact.userInfo?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.userInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  const handleContactSelect = (contact) => {
    navigate(`/chat/${contact.contactId}`);
  };

  // save contact helper
  const saveContact = async (userId, contactId) => {
    const contactRef = doc(db, 'contacts', `${userId}_${contactId}`);
    await setDoc(contactRef, {
      userId,
      contactId,
      addedAt: serverTimestamp(),
      lastChatAt: serverTimestamp(),
    }, { merge: true });
  };

  const removeContact = async (contactId) => {
    if (!window.confirm('Remove this contact?')) return;
    try {
      const contactRef = doc(db, 'contacts', `${currentUser.uid}_${contactId}`);
      await deleteDoc(contactRef);
      // Optional: Also remove from filteredContacts for instant UI update
      setFilteredContacts(prev => prev.filter(c => c.contactId !== contactId));
    } catch (e) {
      console.error('Failed to remove contact', e);
      alert('Error removing contact');
    }
  };

  // respond to a request
  const respondRequest = async (req, status) => {
    try {
      const reqRef = doc(db, 'contactRequests', req.id);
      await updateDoc(reqRef, { status });

      if (status === 'accepted') {
        await saveContact(currentUser.uid, req.fromUid);
        await saveContact(req.fromUid, currentUser.uid);
      }
    } catch (e) {
      console.error('Failed to respond to request', e);
    }
  };

  const generateInviteLink = async () => {
    try {
      const inviteId = Math.random().toString(36).substring(2, 15);
      const inviteData = {
        id: inviteId,
        createdBy: currentUser.uid,
        creatorName: currentUser.displayName || currentUser.email,
        creatorPhoto: currentUser.photoURL || '',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      await setDoc(doc(db, 'invites', inviteId), inviteData);
      
      const inviteLink = `${window.location.origin}/invite/${inviteId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');
      
    } catch (error) {
      console.error('Error generating invite link:', error);
      alert('Error generating invite link');
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">Loading contacts...</div>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: 600 }}>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>My Contacts</span>
          <div>
            <Button 
              variant="success" 
              size="sm" 
              className="me-2"
              onClick={generateInviteLink}
            >
              <PersonPlus className="me-1" /> Share Link
            </Button>
            <Button 
               variant="outline-primary" 
               size="sm"
               onClick={() => setShowAdd(true)}
             >
               Add Contact {requests.length > 0 && <Badge bg="danger" className="ms-1">{requests.length}</Badge>}
             </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Search Bar */}
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          {/* Pending requests */}
          {requests.length > 0 && (
            <div className="mb-3">
              <h6>Pending Requests</h6>
              {requests.map((r) => (
                <Card key={r.id} className="p-2 mb-2 d-flex flex-row justify-content-between align-items-center">
                  <span>{r.fromUid}</span>
                  <div>
                    <Button size="sm" className="me-2" onClick={() => respondRequest(r, 'accepted')}>Accept</Button>
                    <Button size="sm" variant="secondary" onClick={() => respondRequest(r, 'rejected')}>Reject</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {filteredContacts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">
                {searchTerm ? 'No contacts found matching your search.' : 'No contacts yet.'}
              </p>
              <Button 
                variant="primary"
                onClick={() => navigate('/contacts')}
              >
                Share Invite Link
              </Button>
            </div>
          ) : (
            <ListGroup variant="flush">
              {filteredContacts.map((contact) => (
                <ListGroup.Item
                  key={contact.id}
                  className="d-flex align-items-center justify-content-between py-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleContactSelect(contact)}
                >
                  <div className="d-flex align-items-center">
                    <Image
                      src={contact.userInfo?.photoURL || 'https://via.placeholder.com/50'}
                      roundedCircle
                      width={50}
                      height={50}
                      className="me-3"
                      style={{ objectFit: 'cover' }}
                    />
                    <div>
                      <h6 className="mb-1">{contact.userInfo?.displayName || 'Unknown User'}</h6>
                      <small className="text-muted">{contact.userInfo?.email}</small>
                      <br />
                      <small className="text-muted">
                        Last chat: {contact.lastChatAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <Button 
                      variant="link" 
                      className="text-danger p-0 me-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeContact(contact.contactId);
                      }}
                    >
                      <Trash size={16} />
                    </Button>
                    <ChatLeftText className="text-primary" size={20} />
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    <AddContactModal show={showAdd} onHide={() => setShowAdd(false)} />
    </Container>
  );
}

export default Contacts;
