// auth.js - Updated version
const BASE_URL = 'https://admin-backend-qkfm.onrender.com';
const TOKEN_KEY = 'wastewise_brgy_token';
const USER_KEY = 'wastewise_brgy_user';

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
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('🔐 getToken():', token ? `Found (${token.length} chars)` : 'Not found');
    
    if (token) {
        const validation = validateToken(token);
        console.log('🔐 Token validation:', validation);
    }
    
    return token;
}

export function setToken(token) {
    console.log('💾 setToken(): Saving token to localStorage');
    const validation = validateToken(token);
    console.log('🔐 Token validation before save:', validation);
    
    if (!validation.valid) {
        console.error('❌ Cannot save invalid token:', validation.reason);
        return false;
    }
    
    localStorage.setItem(TOKEN_KEY, token);
    return true;
}

export function removeToken() {
    console.log('🗑️ removeToken(): Clearing auth data');
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
        console.warn('❌ No token available for authFetch');
        redirectToLogin();
        throw new Error('No authentication token');
    }

    // Validate token before using it
    const validation = validateToken(token);
    if (!validation.valid) {
        console.warn('❌ Token invalid, removing:', validation.reason);
        removeToken();
        redirectToLogin();
        throw new Error('Token invalid: ' + validation.reason);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log(`🌐 authFetch: ${BASE_URL}${path}`);
    console.log(`🔐 Using token: ${token.substring(0, 50)}...`);

    try {
        const res = await fetch(BASE_URL + path, { ...options, headers });
        console.log(`📡 Response: ${res.status} ${res.statusText} for ${path}`);

        if (res.status === 401) {
            console.warn('🔐 Token rejected (401), checking response...');
            
            // Try to get more info from response
            try {
                const errorText = await res.text();
                console.warn('🔐 401 Response body:', errorText);
            } catch (e) {
                console.warn('🔐 Could not read 401 response body');
            }
            
            removeToken();
            redirectToLogin();
            throw new Error('Authentication failed - token rejected by server');
        }

        return res;
    } catch (error) {
        console.error('💥 Network error in authFetch:', error);
        throw error;
    }
}

function redirectToLogin() {
    console.log('🔄 Redirecting to login page...');
    if (!window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// --- Check Auth ---
export async function checkAuth() {
    const token = getToken();
    if (!token) {
        console.log('🔐 checkAuth(): No token found');
        return false;
    }

    try {
        console.log('🔐 checkAuth(): Validating token with server...');
        const res = await authFetch('/api/brgy/auth/me');
        const isValid = res.ok;
        console.log(`🔐 checkAuth(): Token is ${isValid ? 'valid' : 'invalid'}`);
        return isValid;
    } catch (err) {
        console.warn('🔐 checkAuth(): Token validation failed:', err);
        return false;
    }
}

// --- Login ---
export async function login(username, password) {
    console.log('🔑 login(): Attempting login for user:', username);
    
    try {
        const res = await fetch(BASE_URL + '/api/brgy/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        console.log(`🔑 login(): Server response: ${res.status} ${res.statusText}`);

        if (!res.ok) {
            const text = await res.text();
            console.error('🔑 login(): Login failed:', text);
            throw new Error(text || `Login failed (${res.status})`);
        }

        const data = await res.json();
        console.log('🔑 login(): Login successful, received data');

        if (!data.token) {
            console.error('🔑 login(): No token in response');
            throw new Error('No token received from server');
        }

        // Validate and save token
        if (!setToken(data.token)) {
            throw new Error('Received invalid token from server');
        }
        
        setUser(data.user);

        console.log('✅ login(): Authentication successful');
        return data.user;
    } catch (err) {
        console.error('🔑 login(): Error:', err);
        throw err;
    }
}

// --- Logout ---
export async function logout() {
    console.log('🚪 logout(): Starting logout process');
    try {
        await authFetch('/api/brgy/auth/logout', { method: 'POST' });
        console.log('✅ logout(): Server logout successful');
    } catch (err) {
        console.warn('⚠️ logout(): Server logout failed, continuing with client cleanup:', err);
    }
    removeToken();
    redirectToLogin();
}