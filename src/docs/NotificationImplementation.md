# 📢 Global Notification System Implementation Guide

## Overview
This guide shows how to integrate the global notification system into all modules of the application.

## 🏗️ Architecture

### 1. Notification Context (`contexts/NotificationContext.jsx`)
- **Provider**: Wraps the entire app
- **Hook**: `useNotification()` for direct access
- **Container**: Auto-manages notification display

### 2. Custom Hook (`hooks/useNotifications.js`)
- **Convenience methods**: Pre-defined notification types
- **Module-specific helpers**: Easy integration
- **CRUD operations**: Standardized success/error messages

## 🚀 Quick Implementation

### Step 1: Import the Hook
```javascript
import { useNotifications } from '../hooks/useNotifications';
```

### Step 2: Initialize in Component
```javascript
const notifications = useNotifications();
```

### Step 3: Use Notifications
```javascript
// Success
notifications.success('Operation completed successfully');

// Error
notifications.error('Something went wrong');

// CRUD operations
notifications.crud.create('member');
notifications.crud.update('event');
notifications.crud.delete('record');

// Module-specific
notifications.modules.member.added();
notifications.modules.events.created();
notifications.modules.crisis.caseCreated();
```

## 📋 Module-Specific Implementation

### 1. Members Module
```javascript
// In MembersPage.jsx
const notifications = useNotifications();

const handleAddMember = async (memberData) => {
  try {
    await createMember(memberData);
    notifications.modules.member.added();
  } catch (err) {
    notifications.crud.createError('member');
  }
};

const handleUpdateMember = async (id, data) => {
  try {
    await updateMember(id, data);
    notifications.modules.member.updated();
  } catch (err) {
    notifications.crud.updateError('member');
  }
};
```

### 2. Events Module
```javascript
// In EventsPage.jsx
const notifications = useNotifications();

const handleCreateEvent = async (eventData) => {
  try {
    await createEvent(eventData);
    notifications.modules.events.created();
  } catch (err) {
    notifications.crud.createError('event');
  }
};
```

### 3. Prayer Requests Module
```javascript
// In PrayerDashboard.jsx
const notifications = useNotifications();

const handleAddPrayer = async (prayerData) => {
  try {
    await addPrayerRequest(prayerData);
    notifications.modules.prayers.added();
  } catch (err) {
    notifications.crud.createError('prayer request');
  }
};
```

### 4. Reports Module
```javascript
// In ReportDashboard.jsx
const notifications = useNotifications();

const handleGenerateReport = async (reportConfig) => {
  try {
    const report = await generateReport(reportConfig);
    notifications.modules.reports.generated();
  } catch (err) {
    notifications.error('Failed to generate report');
  }
};
```

### 5. Crisis Care Module
```javascript
// In CrisisFollowupPage.jsx
const notifications = useNotifications();

const handleCreateCase = async (caseData) => {
  try {
    await createCrisisFollowup(caseData);
    notifications.modules.crisis.caseCreated();
  } catch (err) {
    notifications.crud.createError('crisis case');
  }
};
```

### 6. Conflict Management Module
```javascript
// In ConflictManagement.jsx
const notifications = useNotifications();

const handleResolveConflict = async (conflictId) => {
  try {
    await resolveConflict(conflictId);
    notifications.modules.conflicts.resolved();
  } catch (err) {
    notifications.error('Failed to resolve conflict');
  }
};
```

## 🎨 Notification Types

### Success Notifications
```javascript
notifications.success('Message'); // Generic success
notifications.crud.create('item'); // "item created successfully"
notifications.modules.member.added(); // "Member added successfully"
```

### Error Notifications
```javascript
notifications.error('Message'); // Generic error
notifications.crud.createError('item'); // "Failed to create item"
notifications.network.error(); // "Network error"
```

### Warning Notifications
```javascript
notifications.warning('Message'); // Generic warning
notifications.auth.permissionDenied(); // "Permission denied"
```

### Info Notifications
```javascript
notifications.info('Message'); // Generic info
```

## 🔧 Advanced Usage

### Custom Notifications
```javascript
notifications.addNotification({
  message: 'Custom message',
  title: 'Custom Title',
  severity: 'success', // 'error', 'warning', 'info'
  autoHideDuration: 10000, // Custom duration
  vertical: 'bottom', // 'top', 'bottom'
  horizontal: 'left', // 'left', 'center', 'right'
  variant: 'filled', // 'standard', 'filled', 'outlined'
});
```

### Module-Specific Notifications
```javascript
// Create custom module notifications
const moduleNotifications = useModuleNotifications('MyModule');

moduleNotifications.success('Operation completed');
moduleNotifications.error('Something failed');
```

## 📝 Best Practices

### 1. Always Use Notifications for User Actions
```javascript
// ✅ Good
try {
  await createItem(data);
  notifications.success('Item created successfully');
} catch (err) {
  notifications.error('Failed to create item');
}

// ❌ Bad - No user feedback
await createItem(data);
```

### 2. Be Specific with Messages
```javascript
// ✅ Good
notifications.modules.member.added();

// ❌ Too generic
notifications.success('Success');
```

### 3. Handle Both Success and Error
```javascript
// ✅ Good - Handle both cases
try {
  await operation();
  notifications.success('Operation completed');
} catch (err) {
  notifications.error('Operation failed');
}

// ❌ Bad - Only handle success
try {
  await operation();
  notifications.success('Operation completed');
} catch (err) {
  // Silent error
}
```

### 4. Use Appropriate Severity Levels
```javascript
// Success: Successful operations
notifications.success('Data saved successfully');

// Error: Failed operations, validation errors
notifications.error('Invalid email address');

// Warning: Non-critical issues, confirmations
notifications.warning('This action cannot be undone');

// Info: Neutral information
notifications.info('New features available');
```

## 🔄 Migration from Old Snackbar

### Before (Old Way)
```javascript
const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

// Show notification
setSnackbar({ open: true, message: 'Success', severity: 'success' });

// JSX
<Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
  <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
</Snackbar>
```

### After (New Way)
```javascript
const notifications = useNotifications();

// Show notification
notifications.success('Success');

// No JSX needed - handled automatically!
```

## 🎯 Module Checklist

For each module, ensure you have:

- [ ] Import `useNotifications` hook
- [ ] Initialize notifications in component
- [ ] Add success notifications for CRUD operations
- [ ] Add error notifications for failed operations
- [ ] Use module-specific helpers where available
- [ ] Remove old snackbar code
- [ ] Test all user actions show appropriate feedback

## 📚 Available Notification Helpers

### CRUD Operations
- `notifications.crud.create(item)`
- `notifications.crud.createError(item)`
- `notifications.crud.update(item)`
- `notifications.crud.updateError(item)`
- `notifications.crud.delete(item)`
- `notifications.crud.deleteError(item)`

### Data Operations
- `notifications.data.load(item)`
- `notifications.data.loadError(item)`
- `notifications.data.save(item)`
- `notifications.data.saveError(item)`

### Authentication
- `notifications.auth.loginSuccess()`
- `notifications.auth.loginError()`
- `notifications.auth.logoutSuccess()`
- `notifications.auth.permissionDenied()`

### Network
- `notifications.network.error()`
- `notifications.network.serverError()`

### Module-Specific
- `notifications.modules.member.added()`
- `notifications.modules.member.updated()`
- `notifications.modules.events.created()`
- `notifications.modules.prayers.added()`
- `notifications.modules.reports.generated()`
- `notifications.modules.crisis.caseCreated()`
- `notifications.modules.conflicts.resolved()`

## 🚀 Implementation Priority

1. **High Priority**: User actions (create, update, delete)
2. **Medium Priority**: Data operations (load, save)
3. **Low Priority**: Informational messages

Start with the most critical user-facing operations and work through each module systematically.
