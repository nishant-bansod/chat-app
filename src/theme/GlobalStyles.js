import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    --primary: ${props => props.theme.colors.primary};
    --primary-dark: ${props => props.theme.colors.primaryDark};
    --secondary: ${props => props.theme.colors.secondary};
    --background: ${props => props.theme.colors.background};
    --surface: ${props => props.theme.colors.surface};
    --accent: ${props => props.theme.colors.accent};
    --text: ${props => props.theme.colors.text};
    --text-secondary: ${props => props.theme.colors.textSecondary};
    --border: ${props => props.theme.colors.border};
    --success: ${props => props.theme.colors.success};
    --error: ${props => props.theme.colors.error};
    --chat-bubble-sent: ${props => props.theme.colors.chatBubbleSent};
    --chat-bubble-received: ${props => props.theme.colors.chatBubbleReceived};
    --chat-text-sent: ${props => props.theme.colors.chatTextSent};
    --chat-text-received: ${props => props.theme.colors.chatTextReceived};
    --chat-time: ${props => props.theme.colors.chatTime};
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    margin: 0;
    padding: 0;
    background-color: var(--background);
    color: var(--text);
    line-height: 1.5;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--surface);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--primary-dark);
  }

  /* Button styles */
  .btn-primary {
    background-color: var(--primary);
    color: var(--secondary);
    border: none;
    border-radius: 50px;
    padding: 10px 24px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
  }

  .btn-primary:hover {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  /* Input styles */
  .form-control {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 1rem;
    width: 100%;
    transition: all 0.2s ease;
    background-color: var(--input-background, #fff);
  }

  .form-control:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(255, 205, 31, 0.2);
  }
`;
