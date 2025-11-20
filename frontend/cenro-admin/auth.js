// Backend URL configuration
const BACKEND_URL = 'https://admin-backend-qkfm.onrender.com';
    
const TOKEN_KEY = 'wastewise_admin_token';
const USER_KEY = 'wastewise_admin_user';

// --- Token Validation ---
export function validateToken(token) {
    if (!token || typeof token !== 'string') {
        return { valid: false, reason: 'No token or invalid format' };
    }
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { valid: false, reason: 'Invalid JWT structure' };
        }
        
        const payload = JSON.parse(atob(parts[1]));
        const now = Date.now() / 1000;
        
        if (payload.exp && payload.exp < now) {
            return { valid: false, reason: 'Token expired', expiredAt: new Date(payload.exp * 1000) };
        }
        
        return { valid: true, payload };
    } catch (error) {
        return { valid: false, reason: 'Failed to parse token: ' + error.message };
    }
}

// --- Token & User Management ---
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    const validation = validateToken(token);
    if (!validation.valid) {
        console.error('❌ Cannot save invalid token:', validation.reason);
        return false;
    }
    localStorage.setItem(TOKEN_KEY, token);
    return true;
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
}

// --- Authenticated Fetch ---
export async function authFetch(path, options = {}) {
    const token = getToken();
    
    if (!token) {
        redirectToLogin();
        throw new Error('No authentication token');
    }

    // Validate token before using it
    const validation = validateToken(token);
    if (!validation.valid) {
        removeToken();
        redirectToLogin();
        throw new Error('Token invalid: ' + validation.reason);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}) // Merge existing headers if any
    };

    try {
        // FIXED: Changed BASE_URL to BACKEND_URL
        const res = await fetch(BACKEND_URL + path, { ...options, headers });

        if (res.status === 401) {
            removeToken();
            redirectToLogin();
            throw new Error('Authentication failed - session expired');
        }

        return res;
    } catch (error) {
        console.error('💥 Network error in authFetch:', error);
        throw error;
    }
}

function redirectToLogin() {
    if (!window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// --- Check Auth ---
export async function checkAuth() {
    const token = getToken();
    if (!token) return false;

    try {
        const res = await authFetch('/api/auth/me');
        return res.ok;
    } catch (err) {
        return false;
    }
}

// --- Login ---
export async function login(username, password) {
    try {
        // FIXED: Changed BASE_URL to BACKEND_URL
        const res = await fetch(BACKEND_URL + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            const text = await res.text();
            // Parse JSON error if possible
            try {
                const json = JSON.parse(text);
                throw new Error(json.error || 'Login failed');
            } catch (e) {
                throw new Error('Invalid credentials');
            }
        }

        const data = await res.json();

        if (!data.user || !data.user.token) {
             // Handle case where token might be at root or inside user object
             // Adjusting based on your previous server code structure
             const token = data.token || (data.user ? data.user.token : null);
             
             if(!token) throw new Error('No token received from server');
             
             if (!setToken(token)) {
                throw new Error('Received invalid token from server');
             }
             
             // If the user object doesn't exist in root, maybe it was structured differently
             const userToSave = data.user || { username: username }; 
             setUser(userToSave);
             return userToSave;
        }
        
        // Standard path
        setToken(data.user.token);
        setUser(data.user);
        return data.user;

    } catch (err) {
        console.error('Login error:', err);
        throw err;
    }
}

// --- Logout ---
export async function logout() {
    try {
        await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
        console.warn('Logout warning:', err);
    }
    removeToken();
    redirectToLogin();
}