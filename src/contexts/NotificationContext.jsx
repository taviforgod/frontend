import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

// Notification context for global notification management
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      severity: 'info',
      autoHideDuration: 6000,
      ...notification,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after duration
    if (newNotification.autoHideDuration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.autoHideDuration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for common notification types
  const success = useCallback((message, options = {}) => {
    return addNotification({ message, severity: 'success', ...options });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({ message, severity: 'error', autoHideDuration: 10000, ...options });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({ message, severity: 'warning', ...options });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({ message, severity: 'info', ...options });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Notification container component
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{
            vertical: notification.vertical || 'top',
            horizontal: notification.horizontal || 'right',
          }}
          sx={{
            mt: notification.vertical === 'top' ? 8 : 0,
            zIndex: 9999,
          }}
        >
          <Alert
            severity={notification.severity}
            onClose={() => removeNotification(notification.id)}
            variant={notification.variant || 'filled'}
            sx={{
              minWidth: 300,
              maxWidth: 500,
              '& .MuiAlert-message': {
                wordBreak: 'break-word',
              },
            }}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

// Pre-defined notification messages for consistency
export const NotificationMessages = {
  // CRUD Operations
  CREATE_SUCCESS: (item) => `${item} created successfully`,
  CREATE_ERROR: (item) => `Failed to create ${item}`,
  UPDATE_SUCCESS: (item) => `${item} updated successfully`,
  UPDATE_ERROR: (item) => `Failed to update ${item}`,
  DELETE_SUCCESS: (item) => `${item} deleted successfully`,
  DELETE_ERROR: (item) => `Failed to delete ${item}`,
  
  // Data Operations
  LOAD_SUCCESS: (item) => `${item} loaded successfully`,
  LOAD_ERROR: (item) => `Failed to load ${item}`,
  SAVE_SUCCESS: (item) => `${item} saved successfully`,
  SAVE_ERROR: (item) => `Failed to save ${item}`,
  
  // User Actions
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_ERROR: 'Login failed',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PERMISSION_DENIED: 'Permission denied',
  
  // Network Operations
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  
  // Validation
  VALIDATION_ERROR: 'Please check your input and try again',
  REQUIRED_FIELD: 'This field is required',
  
  // Success Messages
  OPERATION_SUCCESS: 'Operation completed successfully',
  CHANGES_SAVED: 'Changes saved successfully',
  
  // Common Module Messages
  MEMBER_ADDED: 'Member added successfully',
  MEMBER_UPDATED: 'Member information updated',
  EVENT_CREATED: 'Event created successfully',
  PRAYER_ADDED: 'Prayer request added',
  REPORT_GENERATED: 'Report generated successfully',
  CRISIS_CASE_CREATED: 'Crisis case created successfully',
  CONFLICT_RESOLVED: 'Conflict resolved successfully',
};

export { NotificationProvider, useNotification, NotificationMessages };
export default NotificationContext;
