const bcrypt = require('bcryptjs');
const pool = require('../config/database.js');
const jwt = require('jsonwebtoken');
const { generateToken, verifyToken, extractToken } = require('../utils/jwt');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_here';
const JWT_EXPIRES_IN = '8h'; // adjust if needed

// CENRO Admin Auth
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const exists = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (exists.rowCount) return res.status(409).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 12);
    const out = await pool.query(
      'INSERT INTO admins (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );

    const user = { id: out.rows[0].id, username: out.rows[0].username };
    const token = generateToken({ id: user.id, username: user.username, type: 'admin' });
    console.log('✅ REGISTER generated token');
    res.json({ message: 'Registered', user, token });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
    try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query Barangay admin table (replace table name if different)
    const r = await pool.query(
      'SELECT id, username, password FROM admins WHERE username = $1',
      [username]
    );

    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate JWT with type 'brgy' and include barangay
    const token = jwt.sign(
      { id: user.id, username: user.username, type: 'brgy', barangay: user.barangay },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('✅ BRGY LOGIN generated token');
    res.json({
      message: 'Logged in',
      user: { id: user.id, username: user.username, barangay: user.barangay },
      token
    });

  } catch (e) {
    console.error('BRGY login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getMe = (req, res) => {
  // Token is already verified by middleware, user info is in req.user
  if (!req.user || req.user.type !== 'admin') {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ id: req.user.id, username: req.user.username });
};

exports.logout = (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // No server-side action needed since tokens are stateless
  res.json({ message: 'Logged out' });
};

// Barangay Admin Auth
exports.brgyRegister = async (req, res) => {
  try {
    const { username, password, barangay } = req.body || {};
    if (!username || !password || !barangay) {
      return res.status(400).json({ error: 'username, password, barangay are required' });
    }

    const exists = await pool.query('SELECT id FROM barangay_admins WHERE username = $1', [username]);
    if (exists.rowCount) return res.status(409).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 12);
    const out = await pool.query(
      `INSERT INTO barangay_admins (username, password_hash, barangay)
       VALUES ($1,$2,$3)
       RETURNING id, username, barangay`,
      [username, hash, barangay]
    );

    const user = {
      id: out.rows[0].id,
      username: out.rows[0].username,
      barangay: out.rows[0].barangay
    };
    const token = generateToken({ 
      id: user.id, 
      username: user.username, 
      barangay: user.barangay,
      type: 'brgy' 
    });
    console.log('✅ BRGY REGISTER generated token');
    res.json({
      message: 'Registered',
      user,
      token
    });
  } catch (e) {
    console.error('Barangay register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.brgyLogin = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const r = await pool.query(
      `SELECT id, username, password_hash, barangay
       FROM barangay_admins
       WHERE username = $1`,
      [username]
    );
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ 
      id: user.id, 
      username: user.username, 
      barangay: user.barangay,
      type: 'brgy' 
    });
    console.log('✅ BRGY LOGIN generated token');
    res.json({ message: 'Logged in', user: { id: user.id, username: user.username, barangay: user.barangay }, token });
  } catch (e) {
    console.error('Barangay login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.brgyGetMe = (req, res) => {
  // Token is already verified by middleware, user info is in req.user
  if (!req.user || req.user.type !== 'brgy') {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    id: req.user.id,
    username: req.user.username,
    barangay: req.user.barangay
  });
};

exports.brgyLogout = (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // No server-side action needed since tokens are stateless
  res.json({ message: 'Logged out' });
};