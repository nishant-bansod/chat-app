export const lightColors = {
  // Clean light theme - Bumble yellow branding
  primary: '#FFCD1F',  // Bumble yellow
  primaryDark: '#E5B91C',  // Darker yellow for hover states
  secondary: '#1A1A1A',  // Dark text
  background: '#FFFFFF',  // Pure white background
  surface: '#F8F9FA',  // Very light gray surface
  accent: '#FF7E47',  // Accent color
  text: '#1A1A1A',  // Dark text
  textSecondary: '#6C757D',  // Medium gray secondary text
  border: '#DEE2E6',  // Light border
  success: '#28A745',  // Success color
  error: '#DC3545',  // Error color
  
  // Chat specific colors
  chatBubbleSent: '#FFCD1F',  // Yellow sent messages
  chatBubbleReceived: '#F8F9FA',  // Light gray received messages
  chatTextSent: '#1A1A1A',  // Dark text on yellow
  chatTextReceived: '#1A1A1A',  // Dark text on light gray
  chatTime: '#6C757D',  // Medium gray timestamps
  
  // Button variants
  buttonPrimary: '#FFCD1F',
  buttonPrimaryHover: '#E5B91C',
  buttonText: '#1A1A1A',
  
  // Header
  headerBackground: '#FFCD1F',  // Yellow header
  headerText: '#1A1A1A',  // Dark text on yellow
  
  // Input fields
  inputBackground: '#FFFFFF',  // White input background
  inputBorder: '#DEE2E6',  // Light border
  inputFocus: '#FFCD1F',  // Yellow focus
  inputText: '#1A1A1A'  // Dark input text
};

export const darkColors = {
  // Clean dark theme - Pure dark with yellow accents
  primary: '#FFCD1F',  // Bumble yellow (only for accents)
  primaryDark: '#E5B91C',  // Darker yellow for hover states
  secondary: '#FFFFFF',  // White text
  background: '#000000',  // Pure black background
  surface: '#1A1A1A',  // Dark gray surface
  accent: '#FF7E47',  // Accent color
  text: '#FFFFFF',  // White text
  textSecondary: '#B0B0B0',  // Light gray secondary text
  border: '#333333',  // Dark border
  success: '#28A745',  // Success color
  error: '#DC3545',  // Error color
  
  // Chat specific colors
  chatBubbleSent: '#FFCD1F',  // Yellow sent messages
  chatBubbleReceived: '#1A1A1A',  // Dark gray received messages
  chatTextSent: '#1A1A1A',  // Dark text on yellow
  chatTextReceived: '#FFFFFF',  // White text on dark gray
  chatTime: '#B0B0B0',  // Light gray timestamps
  
  // Button variants
  buttonPrimary: '#FFCD1F',
  buttonPrimaryHover: '#E5B91C',
  buttonText: '#1A1A1A',
  
  // Header
  headerBackground: '#1A1A1A',  // Dark gray header
  headerText: '#FFFFFF',  // White text on dark header
  
  // Input fields
  inputBackground: '#1A1A1A',  // Dark input background
  inputBorder: '#333333',  // Dark border
  inputFocus: '#FFCD1F',  // Yellow focus
  inputText: '#FFFFFF'  // White input text
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
