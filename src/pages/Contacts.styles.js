import styled from 'styled-components';
import { ListGroup, Image, Form, Button } from 'react-bootstrap';
import { colors, shadows, borderRadius } from '../theme/colors';

export const ContactsContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${colors.background};
  
  @media (max-width: 768px) {
    height: 100vh;
    overflow: hidden;
  }
`;

export const Header = styled.div`
  background: ${colors.primary};
  color: ${colors.text};
  padding: 20px;
  text-align: center;
  box-shadow: ${shadows.small};
  position: relative;
  z-index: 10;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

export const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const SearchContainer = styled.div`
  padding: 15px;
  background: ${colors.background};
  border-bottom: 1px solid ${colors.border};
`;

export const SearchInput = styled(Form.Control)`
  border-radius: ${borderRadius.medium};
  padding: 10px 15px;
  border: 1px solid ${colors.border};
  background-color: ${colors.background};
  font-size: 0.95rem;
  
  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 205, 31, 0.2);
  }
`;

export const ContactList = styled(ListGroup)`
  flex: 1;
  overflow-y: auto;
  border-radius: 0;
  border: none;
`;

export const ContactItem = styled(ListGroup.Item)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border: none;
  border-bottom: 1px solid ${colors.border};
  background: ${colors.background};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background-color: ${colors.surface};
  }
  
  &.active {
    background-color: ${colors.primary}20;
    border-left: 3px solid ${colors.primary};
  }
  
  @media (max-width: 768px) {
    padding: 12px 15px;
  }
`;

export const ContactAvatar = styled(Image)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 15px;
  border: 2px solid ${colors.border};
  
  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
    margin-right: 12px;
  }
`;

export const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const ContactName = styled.div`
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const LastMessage = styled.div`
  color: ${colors.textSecondary};
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const TimeAgo = styled.div`
  font-size: 0.75rem;
  color: ${colors.textSecondary};
  text-align: right;
  margin-left: 10px;
  white-space: nowrap;
`;

export const ActionButton = styled(Button)`
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  background: transparent;
  border: none;
  color: ${colors.textSecondary};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${colors.surface};
    color: ${colors.primary};
  }
  
  &.btn-danger {
    color: ${colors.error};
    
    &:hover {
      background: rgba(244, 67, 54, 0.1);
    }
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 20px;
  color: ${colors.textSecondary};
  
  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: ${colors.primary};
  }
`;

export const AddButton = styled(Button)`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${colors.primary};
  border: none;
  color: ${colors.text};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 100;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${colors.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.25);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
    width: 55px;
    height: 55px;
    font-size: 1.3rem;
  }
`;
