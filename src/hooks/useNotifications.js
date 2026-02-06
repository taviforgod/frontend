import { useContext } from 'react';
import NotificationContext from '../contexts/NotificationContext';

// Custom hook to access notification methods
const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// Custom hook for different modules to use notifications
export const useNotifications = () => {
  const { addNotification } = useNotification();
  
  const success = (message, options) => addNotification({ type: 'success', message, ...options });
  const error = (message, options) => addNotification({ type: 'error', message, ...options });
  const warning = (message, options) => addNotification({ type: 'warning', message, ...options });
  const info = (message, options) => addNotification({ type: 'info', message, ...options });

  // Pre-defined messages for consistency
  const messages = {
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

  return {
    // Generic notification methods
    success,
    error,
    warning,
    info,
    
    // CRUD operation notifications
    crud: {
      create: (item, options) => {
        return success(messages.CREATE_SUCCESS(item), options);
      },
      createError: (item, options) => {
        return error(messages.CREATE_ERROR(item), options);
      },
      update: (item, options) => {
        return success(messages.UPDATE_SUCCESS(item), options);
      },
      updateError: (item, options) => {
        return error(messages.UPDATE_ERROR(item), options);
      },
      delete: (item, options) => {
        return success(messages.DELETE_SUCCESS(item), options);
      },
      deleteError: (item, options) => {
        return error(messages.DELETE_ERROR(item), options);
      },
    },
    
    // Data operation notifications
    data: {
      load: (item, options) => {
        return success(messages.LOAD_SUCCESS(item), options);
      },
      loadError: (item, options) => {
        return error(messages.LOAD_ERROR(item), options);
      },
      save: (item, options) => {
        return success(messages.SAVE_SUCCESS(item), options);
      },
      saveError: (item, options) => {
        return error(messages.SAVE_ERROR(item), options);
      },
    },
    
    // User action notifications
    auth: {
      loginSuccess: (options) => {
        return success(messages.LOGIN_SUCCESS, options);
      },
      loginError: (options) => {
        return error(messages.LOGIN_ERROR, options);
      },
      logoutSuccess: (options) => {
        return success(messages.LOGOUT_SUCCESS, options);
      },
      permissionDenied: (options) => {
        return warning(messages.PERMISSION_DENIED, options);
      },
    },
    
    // Network notifications
    network: {
      error: (options) => {
        return error(messages.NETWORK_ERROR, options);
      },
      serverError: (options) => {
        return error(messages.SERVER_ERROR, options);
      },
    },
    
    // Validation notifications
    validation: {
      error: (options) => {
        return error(messages.VALIDATION_ERROR, options);
      },
      requiredField: (fieldName, options) => {
        return error(messages.REQUIRED_FIELD, options);
      },
    },
    
    // Common module notifications
    modules: {
      member: {
        added: (options) => success(messages.MEMBER_ADDED, options),
        updated: (options) => success(messages.MEMBER_UPDATED, options),
      },
      events: {
        created: (options) => success(messages.EVENT_CREATED, options),
      },
      prayers: {
        added: (options) => success(messages.PRAYER_ADDED, options),
      },
      reports: {
        generated: (options) => success(messages.REPORT_GENERATED, options),
      },
      crisis: {
        caseCreated: (options) => success(messages.CRISIS_CASE_CREATED, options),
      },
      conflicts: {
        resolved: (options) => success(messages.CONFLICT_RESOLVED, options),
      },
    },
  };
};

export default useNotifications;
