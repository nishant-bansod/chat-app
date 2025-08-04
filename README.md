# BumbleChat - Real-time Chat Application

A modern, real-time chat application built with React and Firebase, featuring a beautiful Bumble-inspired design.

## 🚀 Features

### Core Functionality
- **Real-time Messaging** - Instant message delivery with Firebase Firestore
- **User Authentication** - Google Sign-in and Email/Password authentication
- **Contact Management** - Add contacts via username search
- **Contact Requests** - Send and accept contact requests
- **Invite Links** - Share invite links to connect with others
- **Username System** - Unique usernames for easy contact discovery

### User Experience
- **Responsive Design** - Works perfectly on mobile and desktop
- **Beautiful UI** - Bumble-inspired design with smooth animations
- **Real-time Updates** - Live contact status and message notifications
- **Message Status** - See when messages are sent and delivered
- **Auto-scroll** - Automatically scrolls to latest messages
- **Loading States** - Smooth loading animations throughout

### Security
- **Firebase Security Rules** - Comprehensive data protection
- **User Authentication** - Secure login with multiple providers
- **Data Validation** - Input validation and sanitization
- **Privacy Controls** - Users control their own data

## 🛠️ Tech Stack

- **Frontend**: React 19.1.0, React Router DOM 7.7.1
- **UI Framework**: React Bootstrap 2.10.10, Styled Components 6.1.19
- **Backend**: Firebase 12.0.0 (Authentication, Firestore)
- **Styling**: Bootstrap 5.3.7, Custom Bumble theme
- **Icons**: React Icons, Bootstrap Icons

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd chat-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Google provider)
4. Create Firestore database
5. Get your Firebase config

#### Configure Firebase
1. Replace the Firebase config in `src/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

#### Set Up Firestore Security Rules
1. Copy the rules from `firestore.rules` to your Firebase console
2. Deploy the rules to your Firestore database

#### Create Firestore Indexes
1. Copy the indexes from `firestore.indexes.json` to your Firebase console
2. Deploy the indexes

### 4. Start Development Server
```bash
npm start
```

The app will be available at `http://localhost:3000`

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (not recommended)

## 📱 Usage Guide

### Getting Started
1. **Sign Up/Login** - Use Google Sign-in or create an account with email
2. **Set Username** - Choose a unique username for others to find you
3. **Add Contacts** - Search for users by username and send requests
4. **Start Chatting** - Begin real-time conversations with your contacts

### Adding Contacts
1. Click the "+" button or "Add Contact" button
2. Search for users by their exact username
3. Send a contact request
4. Wait for them to accept your request

### Sharing Invite Links
1. Copy your invite link from the contacts page
2. Share it with friends
3. They can click the link to connect with you

## 🎨 Customization

### Theme Colors
Edit `src/theme/colors.js` to customize the color scheme:
```javascript
export const colors = {
  primary: '#FFCD1F',  // Main brand color
  primaryDark: '#E5B91C',  // Darker variant
  // ... other colors
};
```

### Styling
- Global styles: `src/theme/GlobalStyles.js`
- Component styles: Use styled-components in individual components
- Bootstrap overrides: `src/theme/FunTheme.css`

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Deploy automatically

## 🔍 Troubleshooting

### Common Issues

#### Contact Addition Not Working
- Ensure usernames are exact matches (case-sensitive)
- Check Firebase security rules allow contact creation
- Verify user exists in the database

#### Username Setup Loop
- Clear browser cache and cookies
- Check if username already exists in database
- Ensure Firebase rules allow user document updates

#### Messages Not Sending
- Check Firebase security rules for messages collection
- Verify chatId format is correct
- Ensure both users are authenticated

#### Real-time Updates Not Working
- Check Firebase connection
- Verify Firestore indexes are deployed
- Check browser console for errors

### Debug Mode
Enable debug logging by adding to `src/firebase.js`:
```javascript
// Enable debug mode
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase config:', firebaseConfig);
}
```

## 📊 Database Structure

### Collections

#### users
```javascript
{
  uid: "user-id",
  email: "user@example.com",
  displayName: "User Name",
  username: "username",
  photoURL: "https://...",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

#### messages
```javascript
{
  text: "Message content",
  createdAt: timestamp,
  uid: "sender-id",
  displayName: "Sender Name",
  photoURL: "https://...",
  chatId: "user1_user2",
  recipientId: "recipient-id",
  status: "sent"
}
```

#### contacts
```javascript
{
  userId: "user-id",
  contactId: "contact-id",
  displayName: "Contact Name",
  photoURL: "https://...",
  createdAt: timestamp,
  lastChatAt: timestamp,
  lastMessage: "Last message text"
}
```

#### contactRequests
```javascript
{
  fromUid: "sender-id",
  toUid: "recipient-id",
  status: "pending|accepted|rejected",
  createdAt: timestamp,
  userInfo: {
    uid: "user-id",
    displayName: "User Name",
    email: "user@example.com",
    photoURL: "https://..."
  }
}
```

