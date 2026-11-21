export function getSession() {
  const token = localStorage.getItem('token');
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return { token, user };
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { token: null, user: null };
  }
}

export function getHomePath(user) {
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'citizen') return '/dashboard';
  return '/login';
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
