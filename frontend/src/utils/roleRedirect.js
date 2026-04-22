export function getDefaultRouteForRole(role) {
  switch (role) {
    case 'ADMIN':
      return '/dashboard';
    case 'TECHNICIAN':
      return '/technician-dashboard';
    case 'USER':
    default:
      return '/home';
  }
}
