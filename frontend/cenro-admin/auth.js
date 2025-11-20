// JWT Token Management for CENRO Admin
const TOKEN_KEY = 'wastewise_admin_token';

// Get token from localStorage
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Save token to localStorage
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Get authorization headers for API requests
function getAuthHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const BASE_URL = 'http://localhost:3000'; // adjust if using production

async function authFetch(path, options = {}) {
  const headers = getAuthHeaders();
  const response = await fetch(BASE_URL + path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });

  if (response.status === 401) {
    clearToken();
    if (!window.location.pathname.includes('index.html')) {
      window.location.href = 'index.html';
    }
  }

  return response;
}

// Check if user is authenticated
async function checkAuth() {
  const token = getToken();
  if (!token) return false;
  
  try {
    const response = await authFetch('/api/auth/me');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Logout function
function logout() {
  removeToken();
  window.location.href = 'index.html';
}

