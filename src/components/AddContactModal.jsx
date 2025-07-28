import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

function AddContactModal({ show, onHide }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setError('');
    if (!email) {
      setError('Please enter an email');
      return;
    }

    try {
      setLoading(true);
      // look up user by email (email is stored in users collection)
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('User not found');
        setLoading(false);
        return;
      }

      const targetUid = snap.docs[0].id;
      const myUid = auth.currentUser.uid;

      if (targetUid === myUid) {
        setError('You cannot add yourself');
        setLoading(false);
        return;
      }

      // create a pending contact request doc id <from>_<to>
      await setDoc(doc(db, 'contactRequests', `${myUid}_${targetUid}`), {
        fromUid: myUid,
        toUid: targetUid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      onHide();
    } catch (e) {
      console.error('Failed to send request', e);
      setError('Failed to send request');
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
        <Form.Control
          placeholder="Friend's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
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
