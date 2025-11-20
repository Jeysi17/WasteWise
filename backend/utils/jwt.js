const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'replace-with-a-long-random-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * Generate a JWT token for a user
 * @param {Object} payload - User data to encode in token
 * @param {number} payload.id - User ID
 * @param {string} payload.username - Username
 * @param {string} payload.type - Token type: 'admin' or 'brgy'
 * @param {string} [payload.barangay] - Barangay name (for brgy tokens)
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} Token string or null
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');
  return parts.length === 2 ? parts[1] : parts[0];
}

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  JWT_SECRET
};

