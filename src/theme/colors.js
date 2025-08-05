export const lightColors = {
  // Bumble-inspired color palette
  primary: '#FFCD1F',  // Bumble yellow
  primaryDark: '#E5B91C',  // Darker yellow for hover states
  secondary: '#1A1A1A',  // Dark brown/black for text
  background: '#FFFFFF',  // White background
  surface: '#F8F8F8',  // Light gray background
  accent: '#FF7E47',  // Accent color (coral/orange)
  text: '#1A1A1A',  // Main text color - dark for good contrast
  textSecondary: '#555555',  // Darker secondary text for better visibility
  border: '#E0E0E0',  // Border color
  success: '#4CAF50',  // Success color
  error: '#F44336',  // Error color
  
  // Chat specific colors
  chatBubbleSent: '#FFCD1F',  // Sent message bubble (yellow)
  chatBubbleReceived: '#F0F0F0',  // Received message bubble (light gray)
  chatTextSent: '#1A1A1A',  // Sent message text
  chatTextReceived: '#1A1A1A',  // Received message text
  chatTime: '#666666',  // Darker message timestamp color for better visibility
  
  // Button variants
  buttonPrimary: '#FFCD1F',
  buttonPrimaryHover: '#E5B91C',
  buttonText: '#1A1A1A',
  
  // Header
  headerBackground: '#FFFFFF',
  headerText: '#1A1A1A',
  
  // Input fields
  inputBackground: '#FFFFFF',
  inputBorder: '#E0E0E0',
  inputFocus: '#FFCD1F',
  inputText: '#1A1A1D'
};

export const darkColors = {
  // WhatsApp-style dark theme with Bumble yellow branding
  primary: '#FFCD1F',  // Keep Bumble yellow for brand consistency
  primaryDark: '#E5B91C',  // Darker yellow for hover states
  secondary: '#FFFFFF',  // White for text in dark mode
  background: '#111B21',  // WhatsApp dark background
  surface: '#202C33',  // WhatsApp dark surface
  accent: '#FF7E47',  // Keep accent color
  text: '#E9EDEF',  // WhatsApp light text
  textSecondary: '#8696A0',  // WhatsApp secondary text
  border: '#374045',  // WhatsApp border color
  success: '#4CAF50',  // Success color
  error: '#F44336',  // Error color
  
  // Chat specific colors
  chatBubbleSent: '#FFCD1F',  // Keep yellow for sent messages
  chatBubbleReceived: '#202C33',  // WhatsApp dark surface for received messages
  chatTextSent: '#1A1A1A',  // Dark text on yellow
  chatTextReceived: '#E9EDEF',  // WhatsApp light text on dark surface
  chatTime: '#8696A0',  // WhatsApp secondary text for timestamps
  
  // Button variants
  buttonPrimary: '#FFCD1F',
  buttonPrimaryHover: '#E5B91C',
  buttonText: '#1A1A1A',
  
  // Header
  headerBackground: '#202C33',  // WhatsApp dark surface
  headerText: '#E9EDEF',  // WhatsApp light text
  
  // Input fields
  inputBackground: '#202C33',  // WhatsApp dark surface
  inputBorder: '#374045',  // WhatsApp border
  inputFocus: '#FFCD1F',  // Keep yellow focus
  inputText: '#E9EDEF'  // WhatsApp light text
};

// Default to light theme
export const colors = lightColors;

export const shadows = {
  small: '0 2px 4px rgba(0,0,0,0.1)',
  medium: '0 4px 8px rgba(0,0,0,0.1)',
  large: '0 8px 16px rgba(0,0,0,0.1)'
};

export const borderRadius = {
  small: '4px',
  medium: '8px',
  large: '12px',
  xlarge: '24px',
  circle: '50%'
};
