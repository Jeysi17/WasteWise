const { verifyToken, extractToken } = require('../utils/jwt');

// Middleware to verify JWT token and attach user to request
function authenticateToken(req, res, next) {
  // Skip authentication only for login/register routes
  const isLoginOrRegister = req.path === '/api/auth/login' || 
                           req.path === '/api/auth/register' ||
                           req.path === '/api/brgy/auth/login' ||
                           req.path === '/api/brgy/auth/register';
  
  if (isLoginOrRegister) {
    return next();
  }

  // Only check authentication for /api routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

// Middleware to require barangay admin
function requireBarangay(req, res, next) {
  if (!req.user || req.user.type !== 'brgy' || !req.user.barangay) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.barangay = req.user.barangay;
  next();
}

// Guard all non-auth /api routes (legacy name, now uses JWT)
function requireAuth(req, res, next) {
  authenticateToken(req, res, next);
}

module.exports = { requireBarangay, requireAuth, authenticateToken };