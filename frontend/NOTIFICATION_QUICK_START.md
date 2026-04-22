/**
 * QUICK START: Notification Bell Component Integration
 * 
 * Follow these steps to integrate the notification system into your app.
 */

// ============================================================================
// STEP 1: Import the Component
// ============================================================================

import NotificationDropdown from './components/NotificationDropdown';
// OR use standalone bell:
// import NotificationBell from './components/NotificationBell';

// ============================================================================
// STEP 2: Add State Management in Your Top-level Component (TopBar, Header, etc)
// ============================================================================

// Before:
// function TopBar({ user }) {
//   return (
//     <header>
//       <Logo />
//       <UserMenu />
//     </header>
//   );
// }

// After:
import { useState } from 'react';

function TopBar({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="flex items-center justify-between p-4">
      <Logo />

      <div className="flex items-center gap-4">
        {/* Add NotificationDropdown */}
        <NotificationDropdown
          userId={user?.id}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onToggle={() => {
            setShowNotifications(!showNotifications);
            setShowUserMenu(false); // Close user menu when opening notifications
          }}
        />

        {/* User Menu */}
        <button onClick={() => {
          setShowUserMenu(!showUserMenu);
          setShowNotifications(false); // Close notifications when opening user menu
        }}>
          {user?.name}
        </button>
      </div>
    </header>
  );
}

// ============================================================================
// STEP 3: Use the Hook Directly (Optional - for custom implementations)
// ============================================================================

import { useNotifications } from './hooks/useNotifications';

function CustomNotificationCenter({ userId }) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    loadNotifications,
  } = useNotifications(userId);

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <button onClick={markAllNotificationsAsRead}>
        Mark all as read
      </button>

      <ul>
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={notification.isRead ? 'opacity-50' : 'font-bold'}
            onClick={() => markNotificationAsRead(notification.id)}
          >
            {notification.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLES: Different Use Cases
// ============================================================================

// Example 1: Minimal Setup (Just show the bell)
// -------------------------------------------
function MinimalExample({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <NotificationDropdown
      userId={user?.id}
      isOpen={showNotifications}
      onClose={() => setShowNotifications(false)}
      onToggle={() => setShowNotifications(!showNotifications)}
    />
  );
}

// Example 2: With Multiple Menus (Notifications + User Menu)
// -------------------------------------------
function NavbarWithMenus({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };

  return (
    <nav className="flex items-center justify-between">
      <Logo />

      <div className="flex gap-4">
        <NotificationDropdown
          userId={user?.id}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onToggle={toggleNotifications}
        />

        <UserMenuDropdown
          user={user}
          isOpen={showUserMenu}
          onToggle={toggleUserMenu}
        />
      </div>
    </nav>
  );
}

// Example 3: Custom Styling
// -------------------------------------------
// You can customize by modifying the Tailwind classes in the components
// Open NotificationBell.jsx and change:
//   - bg-red-500 to your preferred color for the badge
//   - h-5 w-5 to adjust icon size
//   - rounded-2xl to adjust border radius

// Example 4: Real-time Updates with Polling
// -------------------------------------------
function NotificationsWithPolling({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { loadNotifications } = useNotifications(user?.id);

  useEffect(() => {
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  return (
    <NotificationDropdown
      userId={user?.id}
      isOpen={showNotifications}
      onClose={() => setShowNotifications(false)}
      onToggle={() => setShowNotifications(!showNotifications)}
    />
  );
}

// Example 5: With WebSocket for Real-time
// -------------------------------------------
import { useEffect, useRef } from 'react';

function NotificationsWithWebSocket({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { loadNotifications } = useNotifications(user?.id);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    wsRef.current = new WebSocket(`wss://api.example.com/notifications/${user?.id}`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_NOTIFICATION') {
        loadNotifications();
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, [user?.id, loadNotifications]);

  return (
    <NotificationDropdown
      userId={user?.id}
      isOpen={showNotifications}
      onClose={() => setShowNotifications(false)}
      onToggle={() => setShowNotifications(!showNotifications)}
    />
  );
}

// ============================================================================
// COMMON PATTERNS
// ============================================================================

// Pattern 1: Loading notifications immediately when dropdown opens
// ✅ Already implemented in NotificationDropdown via useEffect

// Pattern 2: Auto-close dropdown after action
function Example6({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <NotificationDropdown
      userId={user?.id}
      isOpen={showNotifications}
      onClose={() => setShowNotifications(false)}
      onToggle={() => setShowNotifications(!showNotifications)}
    />
  );
  // Dropdown auto-closes when clicking outside ✅
}

// Pattern 3: Sync notifications across tabs
function Example7({ user }) {
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'notification-refresh') {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadNotifications]);

  return <NotificationDropdown userId={user?.id} />;
}

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

// Issue: Badge not showing
// Solution: Check that API endpoint returns unread count
console.log('Debug: Checking notification count...');
// GET /notifications/user/{userId}/unread-count should return: { data: { unreadCount: 5 } }

// Issue: Dropdown not opening
// Solution: Verify state is being toggled
console.log('showNotifications state:', showNotifications);

// Issue: Notifications not loading
// Solution: Check API endpoints
// Required endpoints:
//   - GET /notifications/user/{userId}
//   - GET /notifications/user/{userId}/unread-count
//   - PUT /notifications/{notificationId}/read
//   - PUT /notifications/user/{userId}/read-all

// Issue: Tailwind styles not applied
// Solution: Ensure Tailwind is properly configured
// Check: tailwind.config.js and postcss.config.js

export {
  MinimalExample,
  NavbarWithMenus,
  NotificationsWithPolling,
  NotificationsWithWebSocket,
};
