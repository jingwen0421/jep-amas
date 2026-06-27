export function getCurrentUser() {
  return {
    id: localStorage.getItem('userId') || '',
    name: localStorage.getItem('userName') || 'User',
    email: localStorage.getItem('userEmail') || '',
    role: localStorage.getItem('userRole') || 'student',
  };
}

export function isStudent() {
  return getCurrentUser().role === 'student';
}

export function isAdminRole() {
  const role = getCurrentUser().role;

  return role === 'admin' || role === 'super_admin' || role === 'owner';
}