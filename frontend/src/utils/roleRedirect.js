export function getDefaultRouteForRole(role) {
  const normalizedRole = normalizeRole(role);

  // Default to student dashboard for any unrecognized or null role
  switch (normalizedRole) {
    case 'ADMIN':
      return '/dashboard';
    case 'TECHNICIAN':
      return '/technician-dashboard';
    case 'USER':
    case 'STAFF':
      return '/student-dashboard';
    default:
      // Fallback: USER/STAFF share the student experience in this app
      return '/student-dashboard';
  }
}

export function normalizeRole(role) {
  // Handle null/undefined
  if (!role) return null;

  // Convert to string and trim
  const value = String(role).trim().toUpperCase();
  
  // Handle empty string after trim
  if (!value) return null;

  // Handle Spring Security ROLE_ prefix
  if (value.startsWith('ROLE_')) {
    return value.slice('ROLE_'.length);
  }

  // Return the normalized role
  return value;
}
