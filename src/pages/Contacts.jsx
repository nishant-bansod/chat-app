import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  orderBy,
  onSnapshot,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { InputGroup, Button, Alert, Spinner } from 'react-bootstrap';
import { FiUserPlus, FiSearch, FiCheck, FiX, FiClock, FiUserCheck, FiUserX, FiCopy, FiMessageCircle, FiUsers, FiTrash2, FiSun, FiMoon } from 'react-icons/fi';
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
  const { user: currentUser, loading: authLoading } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [inviteLink, setInviteLink] = useState('');
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Clean up duplicate contacts (utility function)
  const cleanupDuplicateContacts = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      const contactsQuery = query(
        collection(db, 'contacts'),
        where('userId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(contactsQuery);
      const contactMap = new Map();
      const duplicates = [];
      
      snapshot.forEach((doc) => {
        const contactData = doc.data();
        const key = `${contactData.userId}_${contactData.contactId}`;
        
        if (contactMap.has(key)) {
          duplicates.push(doc.id);
        } else {
          contactMap.set(key, doc.id);
        }
      });
      
      // Delete duplicate contacts
      if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicate contacts, cleaning up...`);
        const batch = writeBatch(db);
        duplicates.forEach(docId => {
          batch.delete(doc(db, 'contacts', docId));
        });
        await batch.commit();
        console.log('Duplicate contacts cleaned up successfully');
      }
    } catch (error) {
      console.error('Error cleaning up duplicate contacts:', error);
    }
  }, [currentUser]);

  // Load contacts and requests
  useEffect(() => {
    if (!currentUser) {
      navigate('/', { replace: true });
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

    // Listen for notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, async (snapshot) => {
      for (const doc of snapshot.docs) {
        const notification = doc.data();
        if (notification.type === 'contact_accepted') {
          // Show a toast notification
          setSuccess(`${notification.fromUser.displayName} accepted your contact request!`);
          
          // Create contact for the current user if it doesn't exist
          if (notification.contactInfo) {
            const existingContactQuery = query(
              collection(db, 'contacts'),
              where('userId', '==', currentUser.uid),
              where('contactId', '==', notification.contactInfo.contactId)
            );
            
            const existingContactSnapshot = await getDocs(existingContactQuery);
            
            if (existingContactSnapshot.empty) {
              const contactRef = doc(collection(db, 'contacts'));
              await setDoc(contactRef, {
                userId: currentUser.uid,
                contactId: notification.contactInfo.contactId,
                displayName: notification.contactInfo.displayName,
                photoURL: notification.contactInfo.photoURL,
                createdAt: serverTimestamp(),
                lastChatAt: null,
                lastMessage: null
              });
            }
          }
          
          // Mark notification as read
          updateDoc(doc(db, 'notifications', doc.id), { read: true });
        }
      }
    });

    return () => {
      unsubscribeContacts();
      unsubscribeIncoming();
      unsubscribeSent();
      unsubscribeNotifications();
    };
  }, [currentUser, navigate]);

  // Set up invite link and cleanup duplicates
  useEffect(() => {
    if (currentUser) {
      setInviteLink(`${window.location.origin}/invite/${currentUser.uid}`);
      // Clean up any existing duplicate contacts
      cleanupDuplicateContacts();
    }
  }, [currentUser, cleanupDuplicateContacts]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <ContactsContainer>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </ContactsContainer>
    );
  }

  // Redirect if not authenticated
  if (!currentUser) {
    return null;
  }

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
      
      // First update the request status
      await updateDoc(doc(db, 'contactRequests', request.id), {
        status: response
      });
      
      if (response === 'accepted') {
        // Check if contact already exists to prevent duplicates
        const existingContactQuery = query(
          collection(db, 'contacts'),
          where('userId', '==', currentUser.uid),
          where('contactId', '==', request.userInfo.uid)
        );

        const existingContactSnapshot = await getDocs(existingContactQuery);

        // Only create contact if it doesn't already exist
        if (existingContactSnapshot.empty) {
          const contactRef = doc(collection(db, 'contacts'));
          await setDoc(contactRef, {
            userId: currentUser.uid,
            contactId: request.userInfo.uid,
            displayName: request.userInfo.displayName,
            photoURL: request.userInfo.photoURL,
            createdAt: serverTimestamp(),
            lastChatAt: null,
            lastMessage: null
          });
        }

        // Send notification to the other user with contact info
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          userId: request.userInfo.uid, // Send to the person who sent the request
          type: 'contact_accepted',
          title: 'Contact Request Accepted',
          message: `${currentUser.displayName || currentUser.email} accepted your contact request!`,
          fromUser: {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          },
          contactInfo: {
            userId: request.userInfo.uid,
            contactId: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
          },
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
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

  // Delete contact function
  const deleteContact = async (contactId, contactName) => {
    try {
      if (!currentUser) return;
      
      if (window.confirm(`Are you sure you want to delete ${contactName || 'this contact'}?`)) {
        await deleteDoc(doc(db, 'contacts', contactId));
        setSuccess(`${contactName || 'Contact'} deleted successfully!`);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError('Failed to delete contact. Please try again.');
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

    if (success) {
      setTimeout(() => setSuccess(''), 3000);
      return (
        <Alert variant="success" className="my-4">
          {success}
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
                <div className="d-flex align-items-center justify-content-end">
                  {contact.lastChatAt && (
                    <TimeAgo className="me-2">{formatTimeAgo(contact.lastChatAt?.toDate())}</TimeAgo>
                  )}
                  <ActionButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteContact(contact.id, contact.userInfo?.displayName);
                    }}
                    title="Delete Contact"
                    className="text-danger"
                  >
                    <FiTrash2 size={16} />
                  </ActionButton>
                </div>
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
      <Header style={{ backgroundColor: colors.headerBackground, color: colors.headerText }}>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div>
            <Title style={{ color: colors.headerText }}>Contacts</Title>
            {currentUser && (
              <div style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: 4 }}>
                Logged in as: <strong>{currentUser.email}</strong>
              </div>
            )}
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={toggleTheme}
            style={{
              borderColor: colors.primary,
              color: colors.primary,
              backgroundColor: 'transparent'
            }}
          >
            {isDarkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
            <span className="ms-2 d-none d-sm-inline">
              {isDarkMode ? 'Light' : 'Dark'} Mode
            </span>
          </Button>
        </div>
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
