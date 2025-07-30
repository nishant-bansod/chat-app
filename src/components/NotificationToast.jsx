import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import styled from 'styled-components';
import { colors, shadows, borderRadius } from '../theme/colors';

const StyledToastContainer = styled(ToastContainer)`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
`;

const StyledToast = styled(Toast)`
  background: ${colors.background};
  border: none;
  border-radius: ${borderRadius.medium};
  box-shadow: ${shadows.large};
  margin-bottom: 10px;
  min-width: 300px;
  
  .toast-header {
    background: ${colors.background};
    border-bottom: 1px solid ${colors.border};
    border-radius: ${borderRadius.medium} ${borderRadius.medium} 0 0;
    padding: 12px 16px;
  }
  
  .toast-body {
    padding: 12px 16px;
    color: ${colors.text};
  }
  
  &.bg-success {
    border-left: 4px solid ${colors.success};
  }
  
  &.bg-danger {
    border-left: 4px solid ${colors.error};
  }
  
  &.bg-warning {
    border-left: 4px solid #ffc107;
  }
  
  &.bg-info {
    border-left: 4px solid #17a2b8;
  }
`;

const NotificationToast = ({ notifications, onRemove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-success" />;
      case 'error':
        return <FaExclamationTriangle className="text-danger" />;
      case 'warning':
        return <FaExclamationTriangle className="text-warning" />;
      default:
        return <FaInfoCircle className="text-info" />;
    }
  };

  const getVariant = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <StyledToastContainer>
      {notifications.map((notification) => (
        <StyledToast
          key={notification.id}
          show={true}
          onClose={() => onRemove(notification.id)}
          bg={getVariant(notification.type)}
          autohide
          delay={5000}
        >
          <Toast.Header closeButton>
            <div className="d-flex align-items-center me-2">
              {getIcon(notification.type)}
            </div>
            <strong className="me-auto">
              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
            </strong>
            <small className="text-muted">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </small>
          </Toast.Header>
          <Toast.Body>
            {notification.message}
          </Toast.Body>
        </StyledToast>
      ))}
    </StyledToastContainer>
  );
};

export default NotificationToast; 