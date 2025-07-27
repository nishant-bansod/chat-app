import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ChatLayout = ({ children, activeChat = null }) => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const fetchContacts = async () => {
      try {
        const contactsQuery = query(
          collection(db, 'contacts'),
          where('userId', '==', currentUser.uid),
          orderBy('lastChatAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(contactsQuery, async (snapshot) => {
          const contactsList = [];
          
          for (const contactDoc of snapshot.docs) {
            const contactData = contactDoc.data();
            const userDoc = await getDocs(
              query(collection(db, 'users'), where('uid', '==', contactData.contactId))
            );
            
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              contactsList.push({
                id: contactDoc.id,
                ...contactData,
                userInfo: userData
              });
            }
          }
          
          setContacts(contactsList);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, [currentUser]);

  useEffect(() => {
    const filtered = contacts.filter(contact =>
      contact.userInfo?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.userInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
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
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      await setDoc(doc(db, 'invites', inviteId), inviteData);
      
      const inviteLink = `${window.location.origin}/invite/${inviteId}`;
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard! 📋');
      
    } catch (error) {
      console.error('Error generating invite link:', error);
      alert('Error generating invite link');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-300">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 flex flex-col bg-gray-900">
        {/* Profile Header */}
        <div className="p-4 border-b border-gray-800 flex items-center space-x-3">
          <div className="relative">
            <img
              src={currentUser.photoURL || 'https://via.placeholder.com/40'}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-white">{currentUser.displayName || 'User'}</h3>
            <p className="text-xs text-gray-400">Online</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={generateInviteLink}
              className="text-gray-400 hover:text-indigo-400 transition-colors p-1 rounded"
              title="Share invite link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 text-gray-300 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800">
          <button 
            onClick={() => navigate('/contacts')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              window.location.pathname === '/contacts' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Contacts
          </button>
          <button 
            onClick={() => navigate('/contacts')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              window.location.pathname === '/contacts' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Invite
          </button>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <h3 className="text-xs uppercase font-semibold text-gray-500 px-3 mb-2">Recent Chats</h3>
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No recent chats</p>
                <button 
                  onClick={() => navigate('/contacts')}
                  className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  Find people to chat with
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredContacts.map((contact) => (
                  <li key={contact.id}>
                    <button
                      onClick={() => navigate(`/chat/${contact.contactId}`)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        activeChat === contact.contactId 
                          ? 'bg-gray-800 border-l-2 border-indigo-500' 
                          : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={contact.userInfo?.photoURL || 'https://via.placeholder.com/40'}
                          alt="Contact"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium truncate text-white">
                            {contact.userInfo?.displayName || 'Unknown User'}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {contact.lastChatAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {contact.userInfo?.email}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-800 flex justify-around">
          <button 
            onClick={() => navigate('/contacts')}
            className="p-2 text-indigo-400 hover:bg-gray-800 rounded-full transition-colors"
            title="Contacts"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button 
            onClick={() => navigate('/contacts')}
            className="p-2 text-gray-500 hover:bg-gray-800 rounded-full transition-colors"
            title="Find Users"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-950">
        {children}
      </div>
    </div>
  );
};

export default ChatLayout;
