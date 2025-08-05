import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, ListGroup, InputGroup } from 'react-bootstrap';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FiSearch, FiUserPlus, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

function AddContactModal({ show, onHide, onContactAdded }) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Clear messages when modal opens/closes
  useEffect(() => {
    if (show) {
      setError('');
      setSuccess('');
      setSearchResults([]);
      setSearchTerm('');
    }
  }, [show]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setError('');
    setSuccess('');
    setSearching(true);
    
    try {
      const usersRef = collection(db, 'users');
      const search = searchTerm.trim().toLowerCase();
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (
          userData.uid !== currentUser?.uid &&
          (
            (userData.email && userData.email.toLowerCase().includes(search)) ||
            (userData.displayName && userData.displayName.toLowerCase().includes(search))
          )
        ) {
          results.push({
            id: doc.id,
            ...userData
          });
        }
      });
      setSearchResults(results);
      if (results.length === 0) {
        setError('No users found with that email or name.');
      } else {
        setSuccess(`Found ${results.length} user(s)`);
      }
    } catch (err) {
      console.error('Error searching for users:', err);
      setError('Error searching for users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (user) => {
    if (!currentUser) return;
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Check if request already exists
      const requestsRef = collection(db, 'contactRequests');
      const q = query(
        requestsRef,
        where('fromUid', '==', currentUser.uid),
        where('toUid', '==', user.uid),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setError('A contact request is already pending with this user');
        return;
      }
      
      // Create a new contact request
      const requestRef = doc(collection(db, 'contactRequests'));
      await setDoc(requestRef, {
        fromUid: currentUser.uid,
        toUid: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        userInfo: {
          uid: user.uid,
          displayName: user.displayName || user.email,
          email: user.email,
          photoURL: user.photoURL
        }
      });
      
      // Update UI
      setSearchResults(prev => 
        prev.map(u => 
          u.id === user.id ? { ...u, requestSent: true } : u
        )
      );
      
      setSuccess(`Contact request sent to ${user.displayName || user.username}!`);
      
      if (onContactAdded) {
        onContactAdded();
      }
      
    } catch (err) {
      console.error('Error sending contact request:', err);
      setError('Failed to send contact request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Find and Add Contacts</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {success && <Alert variant="success" className="mb-3">{success}</Alert>}
        
        <Form onSubmit={handleSearch} className="mb-4">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search by email or name (e.g., john@example.com or John)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={searching || loading}
            />
            <Button 
              variant="primary" 
              type="submit"
              disabled={!searchTerm.trim() || searching || loading}
            >
              {searching ? <Spinner size="sm" /> : <FiSearch />}
            </Button>
          </InputGroup>
        </Form>
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <h6 className="mb-3">Search Results</h6>
            <ListGroup>
              {searchResults.map((user) => (
                <ListGroup.Item key={user.id} className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName} 
                        className="rounded-circle me-3"
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-3"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <span className="text-white">
                          {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="fw-bold">{user.displayName || 'User'}</div>
                      <small className="text-muted">@{user.username}</small>
                    </div>
                  </div>
                  <Button 
                    variant={user.requestSent ? 'outline-success' : 'outline-primary'} 
                    size="sm"
                    onClick={() => handleSendRequest(user)}
                    disabled={user.requestSent || loading}
                  >
                    {user.requestSent ? (
                      <>
                        <FiCheck className="me-1" /> Request Sent
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="me-1" /> Add
                      </>
                    )}
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
        
        {searchResults.length === 0 && searchTerm && !searching && !error && (
          <div className="text-center py-4">
            <p>No users found matching "{searchTerm}"</p>
            <p className="text-muted small">Try searching by exact username</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddContactModal;
