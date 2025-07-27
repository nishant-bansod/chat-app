import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, ListGroup, Image, InputGroup, Form, Badge } from 'react-bootstrap';
import '../components/FunTheme.css';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchContacts = async () => {
      try {
        // Get user's contacts
        const contactsQuery = query(
          collection(db, 'contacts'),
          where('userId', '==', currentUser.uid),
          orderBy('lastChatAt', 'desc')
        );
        
        const contactsSnapshot = await getDocs(contactsQuery);
        const contactsList = [];

        // Fetch user details for each contact
        for (const contactDoc of contactsSnapshot.docs) {
          const contactData = contactDoc.data();
          const userDoc = await getDoc(doc(db, 'users', contactData.contactId));
          
          if (userDoc.exists()) {
            contactsList.push({
              id: contactDoc.id,
              ...contactData,
              userInfo: userDoc.data()
            });
          }
        }

        setContacts(contactsList);
        setFilteredContacts(contactsList);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
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
              📋 Share Link
            </Button>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => navigate('/users')}
            >
              Find Users
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

          {filteredContacts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">
                {searchTerm ? 'No contacts found matching your search.' : 'No contacts yet.'}
              </p>
              <Button 
                variant="primary"
                onClick={() => navigate('/users')}
              >
                Start Chatting
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
                  <div>
                    <Badge bg="primary">💬</Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Contacts;
