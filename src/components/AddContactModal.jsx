import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { collection, query, where, getDocs, getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

function AddContactModal({ show, onHide, onContactAdded }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user);
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  console.log('AddContactModal rendered with props:', { show, onHide });
  console.log('Current user state:', {
    uid: currentUser?.uid,
    email: currentUser?.email,
    isLoggedIn: !!currentUser
  });

  const handleSend = async () => {
    console.log('handleSend called with username:', email);
    setError('');
    console.log('Starting contact request for username:', email);
    
    if (!email) {
      const errorMsg = 'Please enter a username';
      console.log('Validation error:', errorMsg);
      setError(errorMsg);
      return;
    }
    
    // Check if username is valid (alphanumeric, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(email)) {
      const errorMsg = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
      setError(errorMsg);
      return;
    }

    try {
      setLoading(true);
      console.log('Looking up user with username:', email, 'in database...');
      // look up user by username (case-insensitive)
      const q = query(
        collection(db, 'users'),
        where('username', '==', email.trim().toLowerCase())
      );
      
      const snap = await getDocs(q);
      
      console.log('User lookup results for username:', email, {
        empty: snap.empty,
        size: snap.size,
        docs: snap.docs.map(d => ({ 
          id: d.id, 
          data: d.data(),
          username: d.data().username
        })),
        firstDoc: snap.docs[0]?.data()
      });

      if (snap.empty) {
        const errorMsg = 'User not found. Please check the username and try again.';
        console.log('Error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const targetUserDoc = snap.docs[0];
      const targetUid = targetUserDoc.id;
      const targetUser = targetUserDoc.data();
      const myUid = currentUser?.uid;
      
      console.log('User comparison:', {
        targetUser: {
          uid: targetUid,
          username: targetUser.username,
          email: targetUser.email
        },
        currentUser: {
          uid: myUid,
          email: currentUser?.email
        }
      });

      if (!myUid) {
        const errorMsg = 'You must be logged in to add a contact';
        console.log('Error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Check if trying to add self
      if (targetUid === myUid) {
        const errorMsg = 'You cannot add yourself as a contact';
        console.log('Error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const requestId = `${myUid}_${targetUid}`;
      const requestData = {
        fromUid: myUid,
        fromUsername: currentUser?.displayName || currentUser?.email?.split('@')[0],
        toUid: targetUid,
        toUsername: targetUser.username,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      console.log('Creating contact request:', { requestId, requestData });
      
      try {
        // Check if request already exists
        const existingRequest = await getDoc(doc(db, 'contactRequests', requestId));
        if (existingRequest.exists()) {
          throw new Error('Contact request already sent');
        }
        
        // Check if already contacts
        const contactRef = doc(db, 'contacts', `${myUid}_${targetUid}`);
        const contactSnap = await getDoc(contactRef);
        if (contactSnap.exists()) {
          throw new Error('User is already in your contacts');
        }
        
        await setDoc(doc(db, 'contactRequests', requestId), requestData);
        console.log('Contact request created successfully');
        
        // Show success message and close modal after a short delay
        setError('Contact request sent!');
        setLoading(false);
        
        // Clear the input
        setEmail('');
        
        // Call the onContactAdded callback if provided
        if (onContactAdded) {
          onContactAdded();
        }
        
        // Close the modal after a short delay
        setTimeout(() => {
          onHide();
        }, 1500);
        
      } catch (error) {
        console.error('Error creating contact request:', {
          error,
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        throw error; // Re-throw to be caught by the outer catch
      }

      onHide();
    } catch (e) {
      const errorDetails = {
        error: e,
        message: e.message,
        code: e.code,
        stack: e.stack
      };
      console.error('Failed to send request:', errorDetails);
      
      let errorMessage = 'Failed to send request';
      if (e.code === 'permission-denied') {
        errorMessage = 'You do not have permission to send contact requests';
      } else if (e.code === 'unavailable') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Contact</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Search by Username</Form.Label>
          <Form.Control
            placeholder="Enter username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Form.Text className="text-muted">
            Type the exact username of the person you want to add
          </Form.Text>
        </Form.Group>
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSend} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Send Request'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddContactModal;
