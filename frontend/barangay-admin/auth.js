// auth.js - Optimized version
const BASE_URL = 'https://admin-backend-qkfm.onrender.com';
const TOKEN_KEY = 'wastewise_brgy_token';
const USER_KEY = 'wastewise_brgy_user';

// Cache for token validation to avoid repeated parsing
let tokenCache = {
    token: null,
    validation: null,
    timestamp: 0
};

const CACHE_DURATION = 5000; // 5 seconds cache

// --- Token Validation (Optimized) ---
export function validateToken(token) {
    if (!token || typeof token !== 'string') {
        return { valid: false, reason: 'No token or invalid format' };
    }
    
    // Return cached validation if available and recent
    if (tokenCache.token === token && 
        Date.now() - tokenCache.timestamp < CACHE_DURATION) {
        return tokenCache.validation;
    }
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            const result = { valid: false, reason: 'Invalid JWT structure' };
            tokenCache = { token, validation: result, timestamp: Date.now() };
            return result;
        }
        
        // Use more efficient base64 decoding
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        const now = Date.now() / 1000;
        
        let result;
        if (payload.exp && payload.exp < now) {
            result = { valid: false, reason: 'Token expired', expiredAt: new Date(payload.exp * 1000) };
        } else {
            result = { valid: true, payload };
        }
        
        // Cache the result
        tokenCache = { token, validation: result, timestamp: Date.now() };
        return result;
    } catch (error) {
        const result = { valid: false, reason: 'Failed to parse token: ' + error.message };
        tokenCache = { token, validation: result, timestamp: Date.now() };
        return result;
    }
}

// More efficient base64 URL decoding
function base64UrlDecode(str) {
    // Convert base64url to base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const pad = base64.length % 4;
    if (pad) {
        if (pad === 1) {
            throw new Error('Invalid base64 string');
        }
        base64 += new Array(5 - pad).join('=');
    }
    
    return atob(base64);
}

// --- Token & User Management (Optimized) ---
export function getToken() {
    // Only validate token periodically to reduce overhead
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
        return null;
    }
    
    // Only validate if cache is stale or different token
    if (tokenCache.token !== token || Date.now() - tokenCache.timestamp > CACHE_DURATION) {
        const validation = validateToken(token);
        if (!validation.valid) {
            removeToken();
            return null;
        }
    }
    
    return token;
}

export function setToken(token) {
    const validation = validateToken(token);
    if (!validation.valid) {
        console.error('❌ Cannot save invalid token:', validation.reason);
        return false;
    }
    
    localStorage.setItem(TOKEN_KEY, token);
    // Update cache immediately
    tokenCache = { token, validation, timestamp: Date.now() };
    return true;
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    tokenCache = { token: null, validation: null, timestamp: 0 };
}

export function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
    try {
        const u = localStorage.getItem(USER_KEY);
        return u ? JSON.parse(u) : null;
    } catch {
        return null;
    }
}

// --- Authenticated Fetch (Optimized) ---
export async function authFetch(path, options = {}) {
    const token = getToken();
    
    if (!token) {
        redirectToLogin();
        throw new Error('No authentication token');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Merge headers efficiently
    const finalOptions = {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        }
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        const res = await fetch(BASE_URL + path, {
            ...finalOptions,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (res.status === 401) {
            removeToken();
            redirectToLogin();
            throw new Error('Authentication failed');
        }

        return res;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// Debounced redirect to prevent multiple rapid redirects
let redirectTimeout = null;
function redirectToLogin() {
    if (redirectTimeout) return;
    
    redirectTimeout = setTimeout(() => {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        redirectTimeout = null;
    }, 100);
}

// --- Check Auth (Optimized) ---
let authCheckPromise = null;
export async function checkAuth() {
    const token = getToken();
    if (!token) {
        return false;
    }

    // Prevent multiple simultaneous auth checks
    if (authCheckPromise) {
        return authCheckPromise;
    }

    authCheckPromise = (async () => {
        try {
            const res = await authFetch('/api/brgy/auth/me');
            return res.ok;
        } catch (err) {
            return false;
        } finally {
            authCheckPromise = null;
        }
    })();

    return authCheckPromise;
}

// --- Login (Optimized) ---
export async function login(username, password) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const res = await fetch(BASE_URL + '/api/brgy/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || `Login failed (${res.status})`);
        }

        const data = await res.json();

        if (!data.token) {
            throw new Error('No token received from server');
        }

        if (!setToken(data.token)) {
            throw new Error('Received invalid token from server');
        }
        
        if (data.user) {
            setUser(data.user);
        }

        return data.user || { username };
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Login request timeout');
        }
        throw err;
    }
}

// --- Logout (Optimized) ---
export async function logout() {
    // Don't wait for server logout - do it in background
    const serverLogout = authFetch('/api/brgy/auth/logout', { 
        method: 'POST' 
    }).catch(err => {
        console.warn('Server logout failed:', err);
    });

    // Immediate client cleanup
    removeToken();
    redirectToLogin();

    // Wait for server logout but don't block the user
    await serverLogout;
}

// --- Additional performance helpers ---

// Pre-warm the auth check when app loads
export function preloadAuth() {
    // This will cache the token validation
    getToken();
}

// Batch multiple auth requests
let pendingAuthRequests = [];
export function batchAuthCheck() {
    return checkAuth();
}

// Clear cache (useful for testing or force refresh)
export function clearAuthCache() {
    tokenCache = { token: null, validation: null, timestamp: 0 };
}