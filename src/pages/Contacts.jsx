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
  deleteDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { InputGroup, Button } from 'react-bootstrap';
import { FiTrash2, FiUserPlus, FiSearch, FiCheck, FiX, FiClock, FiUserCheck, FiUserX } from 'react-icons/fi';
import AddContactModal from '../components/AddContactModal';
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
  EmptyState,
  AddButton
} from './Contacts.styles';

// Create a styled search input that works with react-bootstrap
const SearchInput = ({ ...props }) => (
  <StyledSearchInput as="input" {...props} />
);

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

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

  // Handle contact removal
  const handleRemoveContact = async (contactId) => {
    if (window.confirm('Are you sure you want to remove this contact?')) {
      try {
        await deleteDoc(doc(db, 'contacts', contactId));
      } catch (error) {
        console.error('Error removing contact:', error);
      }
    }
  };

  // Handle contact request response
  const respondRequest = async (request, response) => {
    try {
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
      console.error('Error responding to request:', error);
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
    
    // Set up real-time listener for contacts
    const contactsQuery = query(
      collection(db, 'contacts'),
      where('userId', '==', currentUser.uid),
      orderBy('lastChatAt', 'desc')
    );
    
    const unsubscribeContacts = onSnapshot(contactsQuery, async (snapshot) => {
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

  // Render contact list
  const renderContactList = () => {
    if (loading) {
      return <div className="text-center my-4">Loading contacts...</div>;
    }

    if (filteredContacts.length === 0) {
      return (
        <EmptyState>
          <p>No contacts found</p>
          <Button variant="primary" onClick={() => setShowAdd(true)}>
            <FiUserPlus /> Add Contact
          </Button>
        </EmptyState>
      );
    }

    return (
      <ContactList>
        {requests.length > 0 && (
          <div className="p-3 border-bottom">
            <h6 className="text-muted mb-2">Contact Requests</h6>
            {requests.map((request) => (
              <ContactItem key={request.id}>
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
      </ContactList>
    );
  };

  // Render the component
  return (
    <ContactsContainer>
      <Header>
        <Title>Messages</Title>
      </Header>
      
      <SearchContainer>
        <InputGroup>
          <SearchInput
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              filterContacts(e.target.value);
            }}
            aria-label="Search contacts"
          />
          <InputGroup.Text style={{ backgroundColor: 'transparent', borderLeft: 'none' }}>
            <FiSearch />
          </InputGroup.Text>
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
