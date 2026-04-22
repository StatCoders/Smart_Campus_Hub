# Notification Bell Component Guide

## Overview

The notification system consists of three main components:

1. **NotificationBell** - A clean, responsive bell icon with badge
2. **NotificationDropdown** - A complete dropdown with bell + notification list
3. **useNotifications** - Custom hook for managing notification state

## Component: NotificationBell

A standalone bell icon with unread count badge.

### Basic Usage (Standalone)

```jsx
import { useState } from 'react';
import NotificationBell from './components/NotificationBell';

export default function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NotificationBell
      userId={userId}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | string/number | Yes | The user ID to fetch notifications for |
| `isOpen` | boolean | Yes | Whether the dropdown is open (for styling) |
| `onToggle` | function | Yes | Callback when bell is clicked |
| `unreadCount` | number | No | External unread count (auto-fetched if not provided) |
| `onCountChange` | function | No | Callback when unread count changes |

### Features

- ✅ Fetches unread count automatically
- ✅ Displays badge with count (capped at 99+)
- ✅ Shows error indicator on API failure
- ✅ Responsive and accessible (ARIA labels)
- ✅ Smooth transitions and hover states
- ✅ Tailwind CSS styling

## Component: NotificationDropdown

Complete notification system with bell icon and dropdown list.

### Basic Usage (Recommended)

```jsx
import { useState } from 'react';
import NotificationDropdown from './components/NotificationDropdown';

export default function TopBar({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header>
      <NotificationDropdown
        userId={user?.id}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onToggle={() => setShowNotifications(!showNotifications)}
      />
    </header>
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | string/number | Yes | The user ID to fetch notifications for |
| `isOpen` | boolean | Yes | Whether the dropdown is open |
| `onClose` | function | Yes | Callback to close the dropdown |
| `onToggle` | function | Yes | Callback when bell is clicked |

### Features

- ✅ Bell icon with badge (using NotificationBell)
- ✅ Clickable outside to close
- ✅ Notification list with read/unread status
- ✅ Mark individual notifications as read
- ✅ Mark all notifications as read
- ✅ Loading state
- ✅ Error handling
- ✅ Empty state
- ✅ Relative time display
- ✅ Smooth animations

## Hook: useNotifications

Custom hook for managing notification state independently.

### Usage

```jsx
import { useNotifications } from './hooks/useNotifications';

export default function NotificationManager({ userId }) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    loadUnreadCount,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotifications(userId);

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      <button onClick={() => markAllNotificationsAsRead()}>
        Mark All Read
      </button>
      {notifications.map((notification) => (
        <div key={notification.id}>
          <p>{notification.message}</p>
          <button
            onClick={() => markNotificationAsRead(notification.id)}
            disabled={notification.isRead}
          >
            Mark Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Returned Values

| Value | Type | Description |
|-------|------|-------------|
| `notifications` | array | Array of notification objects |
| `unreadCount` | number | Total unread notifications |
| `loading` | boolean | Loading state |
| `error` | string | Error message if any |
| `loadUnreadCount` | function | Fetch unread count |
| `loadNotifications` | function | Fetch all notifications |
| `markNotificationAsRead` | function | Mark single notification as read |
| `markAllNotificationsAsRead` | function | Mark all as read |
| `setUnreadCount` | function | Manually set unread count |

### Features

- ✅ Optimistic updates (UI updates before API response)
- ✅ Automatic rollback on error
- ✅ Memoized callbacks to prevent unnecessary re-renders
- ✅ Clean error handling

## API Endpoints Used

The components use these API endpoints:

```
GET  /notifications/user/{userId}              - Get all notifications
GET  /notifications/user/{userId}/unread-count - Get unread count
PUT  /notifications/{notificationId}/read      - Mark as read
PUT  /notifications/user/{userId}/read-all     - Mark all as read
```

## Styling

All components use **Tailwind CSS** with a consistent design:

- Color scheme: Blue/Sky theme
- Rounded corners: 2xl (16px) borders
- Shadows: Subtle depth
- Responsive: Works on mobile, tablet, desktop
- Accessibility: ARIA labels and keyboard support

## Example: Integration in TopBar

```jsx
import { useState } from 'react';
import NotificationDropdown from './components/NotificationDropdown';
import UserMenu from './components/UserMenu';

export default function TopBar({ user }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowUserMenu(false); // Close user menu
  };

  const handleToggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
    setShowNotifications(false); // Close notifications
  };

  return (
    <header className="sticky top-0 z-30 border-b border-sky-100/80 bg-white/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-4">
        <div>Logo</div>

        <div className="flex items-center gap-4">
          <NotificationDropdown
            userId={user?.id}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onToggle={handleToggleNotifications}
          />

          <UserMenu
            user={user}
            isOpen={showUserMenu}
            onToggle={handleToggleUserMenu}
            onClose={() => setShowUserMenu(false)}
          />
        </div>
      </div>
    </header>
  );
}
```

## Best Practices

1. **Share state between menu and notifications**
   - Close notifications when opening user menu
   - Close user menu when opening notifications

2. **Error handling**
   - Always catch errors when calling mutation functions
   - Display user-friendly error messages

3. **Performance**
   - The hook uses `useCallback` to memoize functions
   - Optimistic updates prevent UI lag
   - Notifications only load when dropdown opens

4. **Accessibility**
   - Use ARIA labels for badge counts
   - Keyboard navigation support
   - Focus management when dropdown opens/closes

## Real-time Updates

For real-time notifications, integrate with WebSocket or polling:

```jsx
import { useEffect } from 'react';
import { useNotifications } from './hooks/useNotifications';

export default function RealtimeNotifications({ userId }) {
  const { loadNotifications } = useNotifications(userId);

  useEffect(() => {
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Or with WebSocket:
  // useEffect(() => {
  //   const ws = new WebSocket(`ws://api.com/notifications/${userId}`);
  //   ws.onmessage = (event) => {
  //     loadNotifications();
  //   };
  //   return () => ws.close();
  // }, [userId, loadNotifications]);
}
```

## Customization

### Change Colors

Update Tailwind classes in `NotificationBell.jsx`:

```jsx
// Change badge color from red-500 to orange-500
<span className="... bg-orange-500 ..." />
```

### Change Icon

Use different lucide-react icon:

```jsx
import { Bell, AlertCircle, MessageSquare } from 'lucide-react';

// In NotificationBell:
<AlertCircle className="h-5 w-5" />
```

### Change Badge Position

Update positioning classes:

```jsx
// Move badge to bottom-right instead of top-right
<span className="absolute bottom-0 right-0 ..." />
```

## Troubleshooting

### Badge not showing

- Verify `unreadCount > 0`
- Check API response in browser DevTools

### Dropdown not opening

- Check if `onToggle` is properly connected
- Verify `isOpen` state is being updated

### Notifications not loading

- Check API endpoint in browser DevTools Network tab
- Verify user ID is correct
- Check for CORS errors

### Styling issues

- Ensure Tailwind CSS is configured
- Check for CSS conflicts
- Inspect element to see applied classes

