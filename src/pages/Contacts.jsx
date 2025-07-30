import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  orderBy,
  onSnapshot,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { InputGroup, Button, Alert, Spinner } from 'react-bootstrap';
import { FiUserPlus, FiSearch, FiCheck, FiX, FiClock, FiUserCheck, FiUserX, FiCopy, FiMessageCircle, FiUsers } from 'react-icons/fi';
import AddContactModal from '../components/AddContactModal';
import { createInvite } from './Invite';
import {
  ContactsContainer,
  Header,
  Title,
  SearchContainer,
  SearchInput as StyledSearchInput,
  ContactList,
  ContactItem,
  ContactAvatar,
  ContactInfo,
  ContactName,
  LastMessage,
  TimeAgo,
  ActionButton,
  AddButton
} from './Contacts.styles';

// Create a styled search input that works with react-bootstrap
const SearchInput = ({ ...props }) => (
  <StyledSearchInput as="input" {...props} />
);

const Contacts = () => {
  const [inviteLink, setInviteLink] = useState('');
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Format time for last message
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const respondRequest = async (request, response) => {
    try {
      if (!currentUser) throw new Error('No current user');
      if (response === 'accepted') {
        // Create a contact for both users
        const contactRef1 = doc(collection(db, 'contacts'));
        await setDoc(contactRef1, {
          userId: currentUser.uid,
          contactId: request.userInfo.uid,
          displayName: request.userInfo.displayName,
          photoURL: request.userInfo.photoURL,
          createdAt: new Date(),
          lastChatAt: null,
          lastMessage: null
        });
        const contactRef2 = doc(collection(db, 'contacts'));
        await setDoc(contactRef2, {
          userId: request.userInfo.uid,
          contactId: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: new Date(),
          lastChatAt: null,
          lastMessage: null
        });
      }
      // Update the request status
      await updateDoc(doc(db, 'contactRequests', request.id), {
        status: response,
        updatedAt: new Date()
      });
      // Remove from local state
      setRequests(requests.filter(req => req.id !== request.id));
    } catch (error) {
      console.error('Error responding to request:', error, { request, response });
      setError('Failed to respond to request. Please try again. ' + (error && error.message ? error.message : ''));
    }
  };

  // Filter contacts based on search term
  const filterContacts = (search) => {
    if (!search.trim()) {
      setFilteredContacts(contacts);
      return;
    }
    
    const searchLower = search.toLowerCase();
    const filtered = contacts.filter(contact => 
      (contact.userInfo?.displayName || '').toLowerCase().includes(searchLower) ||
      (contact.userInfo?.email || '').toLowerCase().includes(searchLower)
    );
    setFilteredContacts(filtered);
  };

  // Load contacts and requests
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    if (!currentUser?.uid) return;
    
    setLoading(true);
    setError('');
    
    // Set up real-time listener for contacts
    const contactsQuery = query(
      collection(db, 'contacts'),
      where('userId', '==', currentUser.uid),
      orderBy('lastChatAt', 'desc')
    );
    
    const unsubscribeContacts = onSnapshot(contactsQuery, async (snapshot) => {
      try {
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

        const resolvedContacts = (await Promise.all(contactPromises)).filter(Boolean);
        setContacts(resolvedContacts);
        setFilteredContacts(resolvedContacts);
        setLoading(false);
      } catch (error) {
        console.error('Error loading contacts:', error);
        setError('Failed to load contacts. Please refresh the page.');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error in contacts listener:', error);
      setError('Failed to load contacts. Please refresh the page.');
      setLoading(false);
    });

    // Fetch incoming contact requests
    const incomingQuery = query(
      collection(db, 'contactRequests'),
      where('toUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
      const requestsList = [];
      snapshot.forEach((doc) => {
        requestsList.push({ id: doc.id, ...doc.data(), type: 'incoming' });
      });
      setRequests(requestsList);
    });

    // Fetch sent contact requests
    const sentQuery = query(
      collection(db, 'contactRequests'),
      where('fromUid', '==', currentUser.uid)
    );

    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
      const sentList = [];
      snapshot.forEach((doc) => {
        sentList.push({ id: doc.id, ...doc.data(), type: 'sent' });
      });
      setSentRequests(sentList);
    });

    return () => {
      unsubscribeContacts();
      unsubscribeIncoming();
      unsubscribeSent();
    };
  }, [currentUser, navigate]);

  // Set up invite link
  useEffect(() => {
    if (currentUser) {
      setInviteLink(`${window.location.origin}/invite/${currentUser.uid}`);
    }
  }, [currentUser]);

  // Copy invite link to clipboard
  const copyInviteLink = async () => {
    try {
      if (currentUser) {
        const link = await createInvite(currentUser);
        await navigator.clipboard.writeText(link);
        setInviteLink(link);
        // Optionally show a notification
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  // Get status for a contact
  const getContactStatus = (contactId) => {
    const sentRequest = sentRequests.find(req => req.toUid === contactId);
    if (sentRequest) {
      return {
        status: sentRequest.status,
        message: sentRequest.status === 'pending' ? 'Request sent' : 
                sentRequest.status === 'accepted' ? 'Contact added' : 'Request declined'
      };
    }
    return null;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-warning" />;
      case 'accepted':
        return <FiUserCheck className="text-success" />;
      case 'rejected':
        return <FiUserX className="text-danger" />;
      default:
        return null;
    }
  };

  // Render welcome section with action buttons
  const renderWelcomeSection = () => (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Welcome to Nishant Chat Room!</h4>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <FiUserPlus className="me-2" /> Add Contact (by email or name)
        </Button>
      </div>
      
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <h5 className="card-title d-flex align-items-center">
            <FiUsers className="me-2" /> Invite by Link
          </h5>
          <div className="input-group mb-2">
            <input 
              type="text" 
              className="form-control" 
              value={inviteLink} 
              readOnly 
            />
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={copyInviteLink}
            >
              <FiCopy className="me-1" /> Copy
            </button>
          </div>
          <p className="text-muted small mb-0">Share this link to invite others to chat with you</p>
        </div>
      </div>
    </div>
  );

  // Render contact list
  const renderContactList = () => {
    if (loading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading contacts...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading your contacts...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="my-4">
          {error}
        </Alert>
      );
    }

    if (contacts.length === 0 && requests.length === 0) {
      return (
        <div className="text-center my-5">
          <FiMessageCircle size={48} className="text-muted mb-3" />
          <h5>No contacts yet</h5>
          <p className="text-muted">Start by adding some contacts to begin chatting!</p>
          <Button variant="primary" onClick={() => setShowAdd(true)}>
            <FiUserPlus className="me-2" /> Add Your First Contact
          </Button>
        </div>
      );
    }

    return (
      <ContactList>
        {requests.length > 0 && (
          <div className="p-3 border-bottom bg-light">
            <h6 className="text-muted mb-3 d-flex align-items-center">
              <FiUserPlus className="me-2" /> Contact Requests ({requests.length})
            </h6>
            {requests.map((request) => (
              <ContactItem key={request.id} className="bg-white">
                <ContactAvatar 
                  src={request.userInfo?.photoURL || '/default-avatar.png'} 
                  alt={request.userInfo?.displayName}
                  roundedCircle
                />
                <ContactInfo>
                  <ContactName>{request.userInfo?.displayName || 'Unknown User'}</ContactName>
                  <LastMessage>Wants to connect with you</LastMessage>
                </ContactInfo>
                <div className="d-flex">
                  <ActionButton 
                    onClick={() => respondRequest(request, 'accepted')}
                    title="Accept"
                    className="text-success"
                  >
                    <FiCheck size={20} />
                  </ActionButton>
                  <ActionButton 
                    onClick={() => respondRequest(request, 'rejected')}
                    title="Reject"
                    className="text-danger"
                  >
                    <FiX size={20} />
                  </ActionButton>
                </div>
              </ContactItem>
            ))}
          </div>
        )}
        
        {filteredContacts.length > 0 && (
          <div>
            <h6 className="text-muted mb-3 px-3 pt-3">Your Contacts ({filteredContacts.length})</h6>
            {filteredContacts.map((contact) => (
              <ContactItem 
                key={contact.id} 
                onClick={() => navigate(`/chat/${contact.contactId}`)}
              >
                <ContactAvatar 
                  src={contact.userInfo?.photoURL || '/default-avatar.png'} 
                  alt={contact.userInfo?.displayName}
                  roundedCircle
                />
                <ContactInfo>
                  <div className="d-flex align-items-center">
                    <ContactName>{contact.userInfo?.displayName || 'Unknown User'}</ContactName>
                    {getContactStatus(contact.contactId) && (
                      <span className="ms-2" title={getContactStatus(contact.contactId).message}>
                        {getStatusIcon(getContactStatus(contact.contactId).status)}
                      </span>
                    )}
                  </div>
                  {contact.lastMessage && (
                    <LastMessage>{contact.lastMessage}</LastMessage>
                  )}
                  {getContactStatus(contact.contactId) && (
                    <small className="text-muted">
                      {getContactStatus(contact.contactId).message}
                    </small>
                  )}
                </ContactInfo>
                {contact.lastChatAt && (
                  <TimeAgo>{formatTimeAgo(contact.lastChatAt?.toDate())}</TimeAgo>
                )}
              </ContactItem>
            ))}
          </div>
        )}
      </ContactList>
    );
  };

  // Render the component
  return (
    <ContactsContainer>
      <Header>
        <Title>Contacts</Title>
        {currentUser && (
          <div style={{ fontSize: '0.95rem', color: '#6D6D6D', marginTop: 4 }}>
            Logged in as: <strong>{currentUser.email}</strong>
          </div>
        )}
      </Header>

      {renderWelcomeSection()}

      <SearchContainer className="mb-3">
        <InputGroup>
          <InputGroup.Text>
            <FiSearch />
          </InputGroup.Text>
          <SearchInput 
            placeholder="Search contacts by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              filterContacts(e.target.value);
            }}
            aria-label="Search contacts"
          />
        </InputGroup>
      </SearchContainer>

      {renderContactList()}

      <AddButton 
        onClick={() => setShowAdd(true)}
        aria-label="Add new contact"
      >
        <FiUserPlus />
      </AddButton>

      <AddContactModal
        show={showAdd}
        onHide={() => setShowAdd(false)}
        onContactAdded={() => {
          setShowAdd(false);
        }}
      />
    </ContactsContainer>
  );
};

export default Contacts;
