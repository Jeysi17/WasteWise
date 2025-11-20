const jwt = require('jsonwebtoken');
// Use env var in production!
const JWT_SECRET = process.env.JWT_SECRET || '1e5b69df00b3fe2751684dc522701f7a5cc2463f9d7f3825cb4b0dee3ee60744deef6395abe5458b6348f810faea787ab7ad76653cb7010969ee080f8925feca';

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
// Use the port Render assigns, or fallback to 3000 for local testing
const port = process.env.PORT || 3000;

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const publicUploadsDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
  console.log('📁 Created public/uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to uploads directory
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use original filename or generate one based on timestamp
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    
    // If filename already has complaint_ prefix, use it; otherwise generate new one
    let filename;
    if (nameWithoutExt.startsWith('complaint_')) {
      filename = originalName;
    } else {
      filename = `complaint_${Date.now()}${ext}`;
    }
    
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ---- Core middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// ---- Sessions (must be BEFORE routes)
app.use(session({
  name: 'wastewise.sid',
  secret: 'replace-with-a-long-random-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,            // keep false on http://localhost
    sameSite: 'lax',         // OK for same-origin
    maxAge: 60 * 60 * 1000
  },
  rolling: true
}));

// ---- Route to serve images with fallback - checks multiple locations
// This MUST be before static middleware to catch /uploads/:filename requests
app.get('/uploads/:filename', (req, res, next) => {
  const filename = req.params.filename;
  
  // Check multiple possible locations
  const possiblePaths = [
    path.join(__dirname, 'uploads', filename),
    path.join(__dirname, 'public', 'uploads', filename),
    path.join(__dirname, 'public', filename),
    // Check if there's a parent directory with uploads (in case server runs from subdirectory)
    path.join(__dirname, '..', 'uploads', filename),
    path.join(__dirname, '..', 'public', 'uploads', filename)
  ];
  
  console.log(`🔍 [Image Request] Looking for: ${filename}`);
  
  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`✅ [Image Request] Found at: ${path.relative(__dirname, filePath)}`);
        return res.sendFile(filePath);
      }
    } catch (err) {
      console.error(`❌ [Image Request] Error checking ${filePath}:`, err.message);
    }
  }
  
  // Log all checked paths
  console.log(`❌ [Image Request] Not found. Checked paths:`, possiblePaths.map(p => path.relative(__dirname, p)));
  
  // If not found, pass to next middleware (static file serving)
  console.log(`⚠️ [Image Request] Passing to static middleware`);
  next();
});

// ---- Static (serve frontend from same origin)
// Serve barangay-admin files
app.use('/barangay-admin', express.static(path.join(__dirname, 'barangay-admin')));

// Serve cenro-admin files  
app.use('/cenro-admin', express.static(path.join(__dirname, 'cenro-admin')));

// Serve root-level files (if any)
app.use(express.static(path.join(__dirname)));

// ---- Serve uploaded images from root uploads directory
// This serves uploads/image.jpg at /uploads/image.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  dotfiles: 'ignore',
  index: false,
  setHeaders: (res, filePath) => {
    // Set proper content type for images
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.gif') {
      res.setHeader('Content-Type', 'image/gif');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));
// ---- PostgreSQL (Nile)
const pool = new Pool({
  user: "01971842-d24f-7abd-ace2-a2ff5c9d83cf",
  password: "b4a6c17e-b03a-46a1-b720-23ae0dfc8ce5",
  host: "us-west-2.db.thenile.dev",
  port: 5432,
  database: "wastewise_app",
  ssl: { rejectUnauthorized: false },
});

// ================== MIDDLEWARE (JWT Verification) ==================

// Middleware to verify JWT Token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get "token" from "Bearer token"

  if (!token) {
    // If no token, check session as fallback (optional, good for transition)
    if (req.session && req.session.brgyAdminId) {
      return next(); 
    }
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      return res.status(403).json({ error: 'Invalid token.' });
    }
    
    // Attach user info to request
    req.user = decodedUser; // Use req.user for clarity
    req.session = decodedUser; // Maintain compatibility
    req.barangay = decodedUser.barangay;
    
    next();
  });
}

// Middleware to require barangay session/token
function requireBarangay(req, res, next) {
  verifyToken(req, res, () => {
      if (!req.session?.brgyAdminId || !req.session?.barangay) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.barangay = req.session.barangay;
      next();
  });
}

// --- ADDED: Helper for generic auth requirement (used by /me route) ---
function requireAuth(req, res, next) {
  verifyToken(req, res, next);
}


// ================== AUTH ==================
app.post('/api/auth/register', async (req, res) => {
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

    req.session.userId = out.rows[0].id;
    req.session.username = out.rows[0].username;
    console.log('✅ REGISTER set session:', req.session);
    res.json({ message: 'Registered', user: { id: out.rows[0].id, username: out.rows[0].username } });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const r = await pool.query('SELECT id, username, password FROM admins WHERE username = $1', [username]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user.id;
    req.session.username = user.username;
    console.log('✅ LOGIN set session:', req.session);
    res.json({ message: 'Logged in', user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  console.log('🔎 /api/auth/me cookie:', req.headers.cookie);
  console.log('🔎 session contents:', req.session);
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ id: req.session.userId, username: req.session.username });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('wastewise.sid');
    res.json({ message: 'Logged out' });
  });
});


// ========== Barangay Admin Auth (mirror of admin auth) ==========

// POST /api/brgy/auth/register
app.post('/api/brgy/auth/register', async (req, res) => {
  try {
    const { username, password, barangay } = req.body || {};
    if (!username || !password || !barangay) {
      return res.status(400).json({ error: 'username, password, barangay are required' });
    }

    // ensure unique username for barangay_admins
    const exists = await pool.query(
      'SELECT id FROM barangay_admins WHERE username = $1',
      [username]
    );
    if (exists.rowCount) return res.status(409).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 12);
    const out = await pool.query(
      `INSERT INTO barangay_admins (username, password_hash, barangay)
       VALUES ($1,$2,$3)
       RETURNING id, username, barangay`,
      [username, hash, barangay]
    );

    // set session just like admin
    // --- START OF NEW CODE ---
    const user = out.rows[0];

    // 1. Create the Token
    const token = jwt.sign(
      { 
        brgyAdminId: user.id, 
        brgyUsername: user.username, 
        barangay: user.barangay 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ BRGY REGISTER successful');
    
    // 2. Send Token in Response
    res.json({
      message: 'Registered',
      token: token, // <--- Frontend needs this!
      user: user
    });
  } catch (e) {
    console.error('Barangay register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/brgy/auth/login
app.post('/api/brgy/auth/login', async (req, res) => {
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

    // --- START OF NEW CODE ---
    // 1. Create the Token
    const token = jwt.sign(
      { 
        brgyAdminId: user.id, 
        brgyUsername: user.username, 
        barangay: user.barangay 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ BRGY LOGIN successful');
    
    // 2. Send Token in Response
    res.json({ 
      message: 'Logged in', 
      token: token, // <--- Frontend needs this!
      user: { id: user.id, username: user.username, barangay: user.barangay } 
    });

  } catch (e) {
    console.error('Barangay login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/brgy/auth/me
// 1. Add 'requireAuth' to protect the route
app.get('/api/brgy/auth/me', requireAuth, (req, res) => {
  // 2. Read from 'req.user' (which your middleware created)
  res.json({
    id: req.user.brgyAdminId,
    username: req.user.brgyUsername,
    barangay: req.user.barangay
  });
});

// POST /api/brgy/auth/logout
app.post('/api/brgy/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Barangay logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('wastewise.sid');
    res.json({ message: 'Logged out' });
  });
});


// ================== YOUR EXISTING API ROUTES (unchanged bodies) ==================
app.get('/api/pendings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pendings');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Query error:', error);
    res.status(500).json({ error: 'Failed to fetch data from pendings' });
  }
});

// POST endpoint to handle file uploads from mobile app
// This accepts multipart/form-data with image file and saves it to uploads directory
app.post('/api/pendings', upload.single('image'), async (req, res) => {
  try {
    const { name, title, details, location, category } = req.body;
    const imageFile = req.file;

    console.log('📤 Received upload request:', { name, title, location, hasImage: !!imageFile });

    // If image file was uploaded, save it
    let imagePath = null;
    if (imageFile) {
      // The file is already saved by multer to uploads directory
      imagePath = `/uploads/${imageFile.filename}`;
      console.log('✅ Image saved:', imagePath, 'at:', imageFile.path);
    } else if (req.body.image) {
      // If image path is provided in body (e.g., from mobile app)
      imagePath = req.body.image;
      console.log('📝 Using provided image path:', imagePath);
    }

    // Generate ID for the post
    const id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const postDate = new Date().toISOString();

    // Insert into pendings table
    const result = await pool.query(
      `INSERT INTO pendings (id, name, title, image, details, location, post_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [id, name, title, imagePath, details, location, postDate]
    );

    console.log('✅ Post created with ID:', result.rows[0].id);
    res.json({ 
      message: 'Post created successfully', 
      id: result.rows[0].id,
      image: imagePath 
    });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
});

// GET solved posts for the logged-in barangay admin
app.get('/api/brgy/solved-posts', requireBarangay, async (req, res) => {
  try {
    // req.barangay is added by the requireBarangay middleware
    const barangay = req.barangay;

    const query = 'SELECT * FROM solved_posts WHERE location = $1 ORDER BY solved_at DESC';
    const params = [barangay];
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching barangay solved posts:', err);
    res.status(500).json({ error: 'Failed to fetch solved posts' });
  }
});

// Debug endpoint to check if image file exists and where
app.get('/api/debug/image/:filename', (req, res) => {
  const filename = req.params.filename;
  const possiblePaths = [
    path.join(__dirname, 'uploads', filename),
    path.join(__dirname, 'public', 'uploads', filename),
    path.join(__dirname, 'public', filename)
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return res.json({ 
        exists: true, 
        path: filePath,
        accessible: `/uploads/${filename}`,
        relativePath: path.relative(__dirname, filePath)
      });
    }
  }
  
  res.json({ 
    exists: false, 
    checkedPaths: possiblePaths.map(p => path.relative(__dirname, p)),
    message: 'Image file not found in any expected location',
    suggestion: 'Ensure images are saved to either uploads/ or public/uploads/ directory'
  });
});


app.delete('/api/decline/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM pendings WHERE id = $1', [id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('❌ Error declining post:', err);
    res.status(500).json({ error: 'Failed to decline post' });
  }
});

app.get('/api/schedules', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM schedules ORDER BY schedule_date ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching schedules:', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// ✅ Utility: send push notification through Expo
async function sendExpoNotification(pushTokens, title, body, data = {}) {
  if (!pushTokens || pushTokens.length === 0) {
    console.log("ℹ️ No push tokens available, skipping notification.");
    return;
  }

  const messages = pushTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log("🔔 Expo push result:", result);
  } catch (err) {
    console.error("❌ Expo push error:", err.message);
  }
}

//Create Schedule
// 📅 Add a schedule + notify
app.post("/api/schedules", async (req, res) => {
  const { barangay, zone_number, schedule_date } = req.body;

  if (!barangay || !zone_number || !schedule_date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await pool.query(
      "INSERT INTO schedules (barangay, zone_number, schedule_date) VALUES ($1, $2, $3)",
      [barangay, zone_number, schedule_date]
    );

    const result = await pool.query(
      "SELECT expo_push_token FROM user_devices WHERE barangay = $1",
      [barangay]
    );

    const tokens = result.rows.map((r) => r.expo_push_token);

    await sendExpoNotification(
      tokens,
      "🗑 New Collection Schedule",
      `New schedule added for ${barangay}, Zone ${zone_number} on ${schedule_date}`,
      { type: "new_schedule", barangay, zone_number, schedule_date }
    );

    res.json({ message: "Schedule added & notifications sent" });
  } catch (err) {
    // handleError(res, "Failed to add schedule", err); // handleError not defined, using standard res
    console.error("Failed to add schedule", err);
    res.status(500).json({ error: "Failed to add schedule" });
  }
});

// 📱 Register a device
app.post("/api/register-device", async (req, res) => {
  const { user_id, barangay, expo_push_token } = req.body;
  console.log("📥 Register request:", req.body);

  if (!barangay || !expo_push_token) {
    return res
      .status(400)
      .json({ error: "barangay and expo_push_token are required" });
  }

  try {
    await pool.query(
      `INSERT INTO user_devices (user_id, barangay, expo_push_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, expo_push_token) DO UPDATE 
         SET barangay = EXCLUDED.barangay`,
      [user_id || null, barangay, expo_push_token]
    );

    res.json({ message: "✅ Device registered successfully" });
  } catch (err) {
    // handleError(res, "Failed to register device", err);
    console.error("Failed to register device", err);
    res.status(500).json({ error: "Failed to register device" });
  }
});

// 🗑 Delete a schedule + notify
app.delete("/api/schedules/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const scheduleResult = await pool.query(
      "SELECT * FROM schedules WHERE id = $1",
      [id]
    );
    const schedule = scheduleResult.rows[0];

    await pool.query("DELETE FROM schedules WHERE id = $1", [id]);

    if (schedule) {
      const usersResult = await pool.query(
        "SELECT expo_push_token FROM user_devices WHERE barangay = $1",
        [schedule.barangay]
      );

      const tokens = usersResult.rows.map((u) => u.expo_push_token);

      await sendExpoNotification(
        tokens,
        "Schedule Cancelled",
        `Schedule cancelled for ${schedule.barangay}, Zone ${schedule.zone_number} on ${schedule.schedule_date}`,
        { type: "deleted_schedule", ...schedule }
      );
    }

    res.json({ message: "Schedule deleted" });
  } catch (err) {
     // handleError(res, "Failed to delete schedule", err);
    console.error("Failed to delete schedule", err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});


// ================== ANALYTICS API (NEW) ==================

// Add a waste entry
app.post('/api/waste-entries', async (req, res) => {
  const { category, kilograms, barangay, week_of_month } = req.body || {};
  if (!category || !kilograms || !barangay || !week_of_month) {
    return res.status(400).json({ error: 'category, kilograms, barangay, week_of_month are required' });
  }
  try {
    await pool.query(
      `INSERT INTO waste_entries (category, kilograms, barangay, week_of_month)
       VALUES ($1,$2,$3,$4)`,
      [category, kilograms, barangay, week_of_month]
    );
    res.json({ message: 'Waste entry saved' });
  } catch (e) {
    console.error('Add waste entry error:', e);
    res.status(500).json({ error: 'Failed to save waste entry' });
  }
});

// Upsert KPIs for a given date
app.post('/api/kpis', async (req, res) => {
  const { kpi_date, complaints, solved, users_count } = req.body || {};
  if (!kpi_date) return res.status(400).json({ error: 'kpi_date is required' });
  try {
    await pool.query(
      `INSERT INTO kpi_daily (kpi_date, complaints, solved, users_count)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (kpi_date) DO UPDATE
       SET complaints = EXCLUDED.complaints,
           solved = EXCLUDED.solved,
           users_count = EXCLUDED.users_count`,
      [kpi_date, complaints ?? 0, solved ?? 0, users_count ?? 0]
    );
    res.json({ message: 'KPIs saved' });
  } catch (e) {
    console.error('Save KPIs error:', e);
    res.status(500).json({ error: 'Failed to save KPIs' });
  }
});

// Add this enhanced endpoint to your server.js file (replace the existing /api/analytics/summary endpoint)

// Analytics summary with time period filtering
// Update the analytics summary endpoint to support barangay filter
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const { period = 'month', year, month, week, barangay } = req.query;
    
    // Build dynamic WHERE clause based on period
    let whereClause = '';
    let kpiWhereClause = '';
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Add barangay filter if provided
    const barangayCondition = barangay ? `AND barangay = '${barangay}'` : '';
    
    if (period === 'week') {
      const startOfYear = new Date(currentYear, 0, 1);
      const weekNum = Math.ceil(((currentDate - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      const targetWeek = week || weekNum;
      const targetYear = year || currentYear;
      
      whereClause = `WHERE EXTRACT(YEAR FROM created_at) = ${targetYear} 
                     AND EXTRACT(WEEK FROM created_at) = ${targetWeek} ${barangayCondition}`;
      kpiWhereClause = `WHERE EXTRACT(YEAR FROM kpi_date) = ${targetYear} 
                        AND EXTRACT(WEEK FROM kpi_date) = ${targetWeek}`;
    } 
    else if (period === 'month') {
      const targetMonth = month || currentMonth;
      const targetYear = year || currentYear;
      
      whereClause = `WHERE EXTRACT(YEAR FROM created_at) = ${targetYear} 
                     AND EXTRACT(MONTH FROM created_at) = ${targetMonth} ${barangayCondition}`;
      kpiWhereClause = `WHERE EXTRACT(YEAR FROM kpi_date) = ${targetYear} 
                        AND EXTRACT(MONTH FROM kpi_date) = ${targetMonth}`;
    } 
    else if (period === 'year') {
      const targetYear = year || currentYear;
      
      whereClause = `WHERE EXTRACT(YEAR FROM created_at) = ${targetYear} ${barangayCondition}`;
      kpiWhereClause = `WHERE EXTRACT(YEAR FROM kpi_date) = ${targetYear}`;
    }

    // Rest of the endpoint remains the same...
    const totalQ = await pool.query(
      `SELECT COALESCE(SUM(kilograms),0)::float AS total
       FROM waste_entries
       ${whereClause}`
    );
    const total = totalQ.rows[0].total;

    const byCatQ = await pool.query(
      `SELECT category, COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${whereClause}
       GROUP BY category
       ORDER BY category`
    );

    const byBrgyQ = await pool.query(
      `SELECT barangay, COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${whereClause}
       GROUP BY barangay
       ORDER BY barangay`
    );

    let periodData = [];
    if (period === 'week') {
      const dayQ = await pool.query(
        `SELECT EXTRACT(DOW FROM created_at) AS day_num,
                TO_CHAR(created_at, 'Day') AS day_name,
                COALESCE(SUM(kilograms),0)::float AS kg
         FROM waste_entries
         ${whereClause}
         GROUP BY EXTRACT(DOW FROM created_at), TO_CHAR(created_at, 'Day')
         ORDER BY day_num`
      );
      periodData = dayQ.rows.map(r => ({
        label: r.day_name.trim(),
        kg: r.kg
      }));
    } 
    else if (period === 'month') {
      const weekQ = await pool.query(
        `SELECT week_of_month AS week, COALESCE(SUM(kilograms),0)::float AS kg
         FROM waste_entries
         ${whereClause}
         GROUP BY week_of_month
         ORDER BY week_of_month`
      );
      periodData = weekQ.rows.map(r => ({
        label: `Week ${r.week}`,
        kg: r.kg
      }));
    } 
    else if (period === 'year') {
      const monthQ = await pool.query(
        `SELECT EXTRACT(MONTH FROM created_at) AS month_num,
                TO_CHAR(created_at, 'Mon') AS month_name,
                COALESCE(SUM(kilograms),0)::float AS kg
         FROM waste_entries
         ${whereClause}
         GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Mon')
         ORDER BY month_num`
      );
      periodData = monthQ.rows.map(r => ({
        label: r.month_name,
        kg: r.kg
      }));
    }

    const kpiSumQ = await pool.query(
      `SELECT
         COALESCE(SUM(complaints),0)::int AS complaints_total,
         COALESCE(SUM(solved),0)::int AS solved_total
       FROM kpi_daily
       ${kpiWhereClause}`
    );
    const kpiTotals = kpiSumQ.rows[0] || { complaints_total: 0, solved_total: 0 };

    // Filter users by barangay if specified
    const usersQuery = barangay 
      ? `SELECT COUNT(id)::int AS count FROM users WHERE location = $1`
      : `SELECT COUNT(id)::int AS count FROM users`;
    const usersParams = barangay ? [barangay] : [];
    const usersQ = await pool.query(usersQuery, usersParams);
    const users_count = usersQ.rows[0]?.count || 0;

    res.json({
      total,
      byCategory: byCatQ.rows,
      byBarangay: byBrgyQ.rows,
      byPeriod: periodData,
      kpis: {
        complaints_total: kpiTotals.complaints_total,
        solved_total: kpiTotals.solved_total,
        users_count
      },
      period,
      periodDetails: { year, month, week }
    });
  } catch (e) {
    console.error('Analytics summary error:', e);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// Update stats endpoints to support barangay filtering
// FOR BARANGAY ADMINS (counts their "to-do" list)
app.get('/api/stats/pending-count', verifyToken, async (req, res) => { // ADDED verifyToken
  try {
    const { barangay } = req.query;
    const query = barangay
      ? 'SELECT COUNT(*) as count FROM pendings WHERE location = $1'
      : 'SELECT COUNT(*) as count FROM pendings';
    const params = barangay ? [barangay] : [];
    const result = await pool.query(query, params);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Error fetching pendings count:', err);
    res.status(500).json({ error: 'Failed to fetch pendings count' });
  }
});

// FOR CENRO ADMIN (counts their "to-do" list)
app.get('/api/stats/approved-count', verifyToken, async (req, res) => { // ADDED verifyToken
  try {
    const { barangay } = req.query;
    const query = barangay
      ? 'SELECT COUNT(*) as count FROM approved_posts WHERE location = $1'
      : 'SELECT COUNT(*) as count FROM approved_posts';
    const params = barangay ? [barangay] : [];
    const result = await pool.query(query, params);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('❌ Error fetching approved_posts count:', err);
    res.status(500).json({ error: 'Failed to fetch approved_posts count' });
  }
});

app.get('/api/stats/total-complaints', async (req, res) => {
  try {
    const { barangay } = req.query;
    const query = barangay
      ? 'SELECT COUNT(*) as total FROM total_approved_posts WHERE location = $1'
      : 'SELECT COUNT(*) as total FROM total_approved_posts';
    const params = barangay ? [barangay] : [];
    const result = await pool.query(query, params);
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (err) {
    console.error('❌ Error fetching total complaints:', err);
    res.status(500).json({ error: 'Failed to fetch total complaints' });
  }
});

app.get('/api/stats/complaints', async (req, res) => {
  try {
    const { barangay } = req.query;
    const query = barangay
      ? 'SELECT COUNT(*) as complaints FROM pendings WHERE location = $1'
      : 'SELECT COUNT(*) as complaints FROM pendings';
    const params = barangay ? [barangay] : [];
    const result = await pool.query(query, params);
    res.json({ complaints: parseInt(result.rows[0].complaints) });
  } catch (err) {
    console.error('❌ Error fetching complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

app.get('/api/stats/solved', async (req, res) => {
  try {
    const { barangay } = req.query;
    const query = barangay
      ? 'SELECT COUNT(*) as solved FROM solved_posts WHERE location = $1'
      : 'SELECT COUNT(*) as solved FROM solved_posts';
    const params = barangay ? [barangay] : [];
    const result = await pool.query(query, params);
    res.json({ solved: parseInt(result.rows[0].solved) });
  } catch (err) {
    console.error('❌ Error fetching solved:', err);
    res.status(500).json({ error: 'Failed to fetch solved' });
  }
});

// Additional endpoint to get available time periods
app.get('/api/analytics/periods', async (req, res) => {
  try {
    // Get available years
    const yearsQ = await pool.query(
      `SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS year
       FROM waste_entries
       ORDER BY year DESC`
    );
    
    // Get available months for current year
    const currentYear = new Date().getFullYear();
    const monthsQ = await pool.query(
      `SELECT DISTINCT EXTRACT(MONTH FROM created_at)::int AS month
       FROM waste_entries
       WHERE EXTRACT(YEAR FROM created_at) = $1
       ORDER BY month DESC`,
      [currentYear]
    );
    
    res.json({
      years: yearsQ.rows.map(r => r.year),
      months: monthsQ.rows.map(r => r.month),
      currentYear,
      currentMonth: new Date().getMonth() + 1,
      currentWeek: Math.ceil(((new Date() - new Date(currentYear, 0, 1)) / 86400000 + new Date(currentYear, 0, 1).getDay() + 1) / 7)
    });
  } catch (e) {
    console.error('Analytics periods error:', e);
    res.status(500).json({ error: 'Failed to load periods' });
  }
});

// -------- PENDINGS (Barangay-scoped variants) --------

// List pendings for my barangay
app.get('/api/brgy/pendings', requireBarangay, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM pendings WHERE barangay=$1 ORDER BY id DESC`,
      [req.barangay]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('fetch brgy pendings err:', e);
    res.status(500).json({ error: 'Failed to fetch pendings' });
  }
});

// ==================== FORWARD TO CENRO  (Barangay Admin) ====================
app.post('/api/approve/:id', async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🔵 Starting approval process for ID:', id);

    // 1️⃣ Fetch post from pendings
    const selectResult = await client.query('SELECT * FROM pendings WHERE id = $1', [id]);
    const post = selectResult.rows[0];

    if (!post) {
      await client.query('ROLLBACK');
      console.log('❌ Post not found in pendings');
      return res.status(404).json({ error: 'Post not found in pendings' });
    }

    console.log('📝 Post found:', post);

    // 2️⃣ Set the status dynamically using location
    const updatedStatus = post.location
      ? `Forwarded to Cenro by ${post.location}`
      : 'Forwarded to Cenro by';

    // 3️⃣ Update status for traceability
    await client.query('UPDATE pendings SET status = $1 WHERE id = $2', [updatedStatus, id]);

    
    await client.query(`
      INSERT INTO approved_posts 
      (id, user_id, name, title, image, details, location, post_date, approved_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [
      post.id,
      post.user_id,  
      post.name,
      post.title,
      post.image,
      post.details,
      post.location,
      post.post_date,
      updatedStatus
    ]);
    
    // 4️⃣ Insert into total_approved_posts (history)
    await client.query(`
      INSERT INTO total_approved_posts (id, name, title, image, details, location, post_date, approved_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      post.id,
      post.name,
      post.title,
      post.image,
      post.details,
      post.location,
      post.post_date
    ]);


    // 6️⃣ Delete from pendings
    await client.query('DELETE FROM pendings WHERE id = $1', [id]);

    // 7️⃣ Fetch user's Expo push token using user_id (FIXED)
    const tokenResult = await client.query(
      'SELECT expo_push_token FROM user_devices WHERE user_id = $1 AND expo_push_token IS NOT NULL',
      [post.user_id] // 🔹 Changed from post.name to post.user_id
    );

    const tokens = tokenResult.rows
      .map(r => r.expo_push_token)
      .filter(token => token); // Remove null/undefined tokens

    console.log(`📱 Found ${tokens.length} tokens for user_id ${post.user_id}`);

    // 8️⃣ Send push notification
    if (tokens.length > 0) {
      await sendExpoNotification(
        tokens,
        'Your Complaint has been forwarded to CENRO!',
        `Your complaint "${post.title}" has been approved and forwarded to CENRO.`,
        {
          type: 'post_approved',
          postId: post.id,
          title: post.title,
          location: post.location
        }
      );
      console.log('📲 Notification sent to user:', tokens);
    } else {
      console.log('⚠️ No Expo tokens found for user_id:', post.user_id);
    }

    // 9️⃣ Commit transaction
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');
    res.json({ message: 'Post approved successfully & notification sent' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ FULL Error approving post:', err);
    res.status(500).json({ error: 'Failed to approve post', details: err.message });
  } finally {
    client.release();
  }
});

// Moves post from pendings → solved_posts WITH remarks, keeps total_approved_posts
app.post('/api/solve-pending-with-remarks/:id', async (req, res) => {
  const id = req.params.id;
  const { remarks } = req.body; // only need remarks now
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🟢 Solving pending post with remarks for ID:', id);

    // 1️⃣ Get post from pendings
    const selectResult = await client.query('SELECT * FROM pendings WHERE id = $1', [id]);
    const post = selectResult.rows[0];

    if (!post) {
      await client.query('ROLLBACK');
      console.log('❌ Post not found in pendings');
      return res.status(404).json({ error: 'Post not found in pendings' });
    }

    // Use the location column as the barangay for status
    const updatedStatus = post.location ? `Solved by ${post.location}` : 'Solved by unknown';

    // 2️⃣ Update status in pendings
    await client.query('UPDATE pendings SET status = $1 WHERE id = $2', [updatedStatus, id]);

    // 3️⃣ Ensure the post exists in total_approved_posts
    await client.query(`
      INSERT INTO total_approved_posts (id, name, title, image, details, location, post_date, approved_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      post.id,
      post.name,
      post.title,
      post.image,
      post.details,
      post.location,
      post.post_date
    ]);

    // 4️⃣ Insert into solved_posts with remarks, solved_at timestamp, and status
    await client.query(`
      INSERT INTO solved_posts (
        id, name, title, image, details, location, post_date, approved_at, solved_at, remarks, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10)
      ON CONFLICT (id) DO NOTHING
    `, [
      post.id,
      post.name,
      post.title,
      post.image,
      post.details,
      post.location,
      post.post_date,
      post.approved_at,
      remarks,
      updatedStatus
    ]);

    // 5️⃣ Delete from pendings
    await client.query('DELETE FROM pendings WHERE id = $1', [id]);

    // 6️⃣ Fetch user's Expo push token
    const tokenResult = await client.query(
      'SELECT expo_push_token FROM user_devices WHERE user_id = $1 AND expo_push_token IS NOT NULL',
      [post.user_id]
    );

    const tokens = tokenResult.rows
      .map(r => r.expo_push_token)
      .filter(token => token); // Remove null/undefined tokens

    console.log(`📱 Found ${tokens.length} tokens for user_id ${post.user_id}`);

    // 7️⃣ Send push notification
    if (tokens.length > 0) {
      await sendExpoNotification(
        tokens,
        'Your complaint has been resolved by the Barangay!',
        `Your complaint "${post.title}" has been marked as solved by ${post.location}.`,
        {
          type: 'post_solved',
          postId: post.id,
          title: post.title,
          location: post.location,
          remarks: remarks,
          status: updatedStatus
        }
      );
      console.log('📲 Resolution notification sent to user:', tokens);
    } else {
      console.log('⚠️ No Expo tokens found for user_id:', post.user_id);
    }

    await client.query('COMMIT');
    console.log('✅ Post moved to solved_posts with remarks, timestamps, and notification sent');
    res.json({ message: 'Pending post marked as solved with remarks successfully & notification sent' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error marking pending post as solved with remarks:', err);
    res.status(500).json({ error: 'Failed to mark pending post as solved with remarks', details: err.message });
  } finally {
    client.release();
  }
});


// ==================== SOLVE (CENRO Admin) ====================
// Moves from approved_posts to solved_posts (with remarks)
app.post('/api/solve/:id', async (req, res) => {
  const id = req.params.id;
  const { remarks } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🟢 Starting CENRO solve process for ID:', id);
    
    // Fetch post from approved_posts
    const selectResult = await client.query('SELECT * FROM approved_posts WHERE id = $1', [id]);
    const post = selectResult.rows[0];
    
    if (!post) {
      await client.query('ROLLBACK');
      console.log('❌ Post not found in approved_posts');
      return res.status(404).json({ error: 'Post not found in approved posts' });
    }

    console.log('📝 Post found:', {
      id: post.id,
      name: post.name,
      title: post.title,
      user_id: post.user_id
    });

    // Check if user_id exists
    if (!post.user_id) {
      console.log('⚠️ WARNING: No user_id in post! Cannot send notification.');
    } else {
      console.log('👤 User ID from post:', post.user_id);
    }

    const updatedStatus = 'Solved by CENRO';
    const finalRemarks = remarks || 'N/A'; 

    // Update status in approved_posts
    await client.query('UPDATE approved_posts SET status = $1 WHERE id = $2', [updatedStatus, id]);
    console.log('✅ Updated status in approved_posts');

    // Insert into solved_posts
    await client.query(`
      INSERT INTO solved_posts (
      id, user_id, name, title, image, details, location, post_date, approved_at, solved_at, remarks, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11)
      RETURNING id
    `, [
      post.id,
      post.user_id,  
      post.name,
      post.title,
      post.image,
      post.details,
      post.location,
      post.post_date,
      post.approved_at,
      finalRemarks,
      updatedStatus
    ]);
    console.log('✅ Inserted into solved_posts');

    // 🔹 Send notification if user_id exists
    if (post.user_id) {
      console.log('🔍 Querying user_devices for user_id:', post.user_id);
      
      const tokenResult = await client.query(
        'SELECT expo_push_token FROM user_devices WHERE user_id = $1',
        [post.user_id]
      );

      console.log('📊 Query result:', {
        rowCount: tokenResult.rowCount,
        rows: tokenResult.rows
      });

      const tokens = tokenResult.rows
        .map(r => r.expo_push_token)
        .filter(token => token && token.trim() !== '');

      console.log(`📱 Valid tokens found: ${tokens.length}`, tokens);

      if (tokens.length > 0) {
        try {
          console.log('📤 Attempting to send notification...');
          
          const notificationResult = await sendExpoNotification(
            tokens,
            'Your complaint has been resolved by CENRO!',
            `Your complaint "${post.title}" has been marked as solved by CENRO.`,
            {
              type: 'post_solved_cenro',
              postId: post.id,
              title: post.title,
              location: post.location,
              remarks: finalRemarks,
              status: updatedStatus
            }
          );
          
          console.log('✅ Notification sent successfully:', notificationResult);
        } catch (notifError) {
          console.error('❌ Failed to send notification:', notifError);
          console.error('Notification error details:', {
            message: notifError.message,
            stack: notifError.stack
          });
          // Continue anyway - don't fail the whole transaction
        }
      } else {
        console.log('⚠️ No valid Expo push tokens found for user_id:', post.user_id);
        
        // Debug: Check if user exists in user_devices at all
        const userCheck = await client.query(
          'SELECT user_id, expo_push_token FROM user_devices WHERE user_id = $1',
          [post.user_id]
        );
        console.log('🔍 User devices check:', userCheck.rows);
      }
    } else {
      console.log('⚠️ Skipping notification - no user_id in post');
    }

    // Delete from approved_posts
    const deleteResult = await client.query('DELETE FROM approved_posts WHERE id = $1 RETURNING id', [id]);
    console.log('✅ Deleted from approved_posts:', deleteResult.rowCount, 'row(s)');
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');
    
    res.json({ 
      message: 'Post marked as solved',
      notificationSent: post.user_id ? true : false,
      deleted: deleteResult.rowCount > 0
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ FULL Error solving post:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({ 
      error: 'Failed to mark post as solved', 
      details: err.message 
    });
  } finally {
    client.release();
  }
});

// Get solved posts, with optional barangay filter
app.get('/api/solved-posts', async (req, res) => {
  try {
    const { barangay } = req.query;
    
    let query = 'SELECT * FROM solved_posts';
    const params = [];

    // Add a WHERE clause if a barangay is specified
    if (barangay) {
      query += ' WHERE location = $1';
      params.push(barangay);
    }
    
    query += ' ORDER BY solved_at DESC'; // Show most recent first
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching solved posts:', err);
    res.status(500).json({ error: 'Failed to fetch solved posts' });
  }
});

// Get approved posts (for CENRO admin to see and solve)
app.get('/api/approved', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM approved_posts ORDER BY approved_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching approved posts:', err);
    res.status(500).json({ error: 'Failed to fetch approved posts' });
  }
});

// Decline a pending owned by my barangay
app.delete('/api/brgy/decline/:id', requireBarangay, async (req, res) => {
  try {
    const r = await pool.query(
      `DELETE FROM pendings WHERE id=$1 AND barangay=$2`,
      [req.params.id, req.barangay]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Post declined and deleted' });
  } catch (e) {
    console.error('decline err:', e);
    res.status(500).json({ error: 'Failed to decline post' });
  }
});

// -------- SCHEDULES (Barangay-scoped variants) --------

// List schedules for my barangay
app.get('/api/brgy/schedules', requireBarangay, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM schedules WHERE barangay=$1 ORDER BY schedule_date ASC`,
      [req.barangay]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('brgy schedules err:', e);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Create schedule for my barangay
app.post('/api/brgy/schedules', requireBarangay, async (req, res) => {
  const { zone_number, schedule_date } = req.body || {};
  if (!zone_number || !schedule_date) {
    return res.status(400).json({ error: 'zone_number and schedule_date required' });
  }
  try {
    await pool.query(
      `INSERT INTO schedules (barangay, zone_number, schedule_date) VALUES ($1,$2,$3)`,
      [req.barangay, zone_number, schedule_date]
    );
    res.json({ message: 'Schedule added' });
  } catch (e) {
    console.error('add brgy schedule err:', e);
    res.status(500).json({ error: 'Failed to add schedule' });
  }
});

// Delete schedule (only my barangay)
app.delete('/api/brgy/schedules/:id', requireBarangay, async (req, res) => {
  try {
    const r = await pool.query(
      `DELETE FROM schedules WHERE id=$1 AND barangay=$2`,
      [req.params.id, req.barangay]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (e) {
    console.error('del brgy schedule err:', e);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});


// -------- INPUT: Waste & Complaints (Barangay-scoped) --------

// Add a waste entry (purok optional)
app.post('/api/brgy/waste-entries', requireBarangay, async (req, res) => {
  const { category, kilograms, purok, week_of_month } = req.body || {};
  if (!category || !kilograms || !week_of_month) {
    return res.status(400).json({ error: 'category, kilograms, week_of_month required' });
  }
  try {
    await pool.query(
      `INSERT INTO waste_entries (barangay, category, kilograms, purok, week_of_month)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.barangay, category, kilograms, purok ?? null, week_of_month]
    );
    res.json({ message: 'Waste entry saved' });
  } catch (e) {
    console.error('add waste err:', e);
    res.status(500).json({ error: 'Failed to save waste entry' });
  }
});

// Add complaint counts by category (you can call this once per category)
app.post('/api/brgy/complaints', requireBarangay, async (req, res) => {
  const { category, count, week_of_month } = req.body || {};
  if (!category || !week_of_month) {
    return res.status(400).json({ error: 'category and week_of_month required' });
  }
  try {
    await pool.query(
      `INSERT INTO complaint_entries (barangay, category, count, week_of_month)
       VALUES ($1,$2,$3,$4)`,
      [req.barangay, category, Number(count) || 1, week_of_month]
    );
    res.json({ message: 'Complaint saved' });
  } catch (e) {
    console.error('add complaint err:', e);
    res.status(500).json({ error: 'Failed to save complaint' });
  }
});


// Analytics summary for *this* barangay (optional month & week filters)
app.get('/api/brgy/analytics/summary', requireBarangay, async (req, res) => {
  try {
    const barangay = req.barangay;

    // --- parse inputs ---
    const monthStr = String(req.query.month || '').trim(); // 'YYYY-MM'
    const weekNum  = Number(req.query.week);
    const hasWeek  = Number.isInteger(weekNum) && weekNum >= 1 && weekNum <= 5;
    const hasMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr);

    // --- WHERE + params for both waste_entries and complaint_entries ---
    // always filter by barangay
    const where = [`barangay = $1`];
    const params = [barangay];

    // month filter (default: current month)
    if (hasMonth) {
      // Convert YYYY-MM to proper date range
      const year = parseInt(monthStr.substring(0, 4));
      const month = parseInt(monthStr.substring(5, 7));
      
      params.push(year, month);
      where.push(`EXTRACT(YEAR FROM created_at) = $${params.length - 1} AND EXTRACT(MONTH FROM created_at) = $${params.length}`);
    } else {
      where.push(`date_trunc('month', created_at) = date_trunc('month', now())`);
    }

    // optional week filter
    if (hasWeek) {
      params.push(weekNum);
      where.push(`week_of_month = $${params.length}`);
    }

    const WHERE = `WHERE ${where.join(' AND ')}`;

    // --- queries ---
    // total kilograms (month [+ week])
    const totalQ = await pool.query(
      `SELECT COALESCE(SUM(kilograms),0)::float AS total
       FROM waste_entries
       ${WHERE}`,
      params
    );
    const total = totalQ.rows[0]?.total ?? 0;

    // by category
    const byCatQ = await pool.query(
      `SELECT category, COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${WHERE}
       GROUP BY category
       ORDER BY category`,
      params
    );

    // by purok (stringify + coalesce)
    const byPurokQ = await pool.query(
      `SELECT COALESCE(purok::text,'N/A') AS purok,
              COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${WHERE}
       GROUP BY COALESCE(purok::text,'N/A')
       ORDER BY COALESCE(purok::text,'N/A')`,
      params
    );

    // by week (for the selected month scope)
    let byWeekQ;
    if (hasMonth) {
      const year = parseInt(monthStr.substring(0, 4));
      const month = parseInt(monthStr.substring(5, 7));
      
      byWeekQ = await pool.query(
        `SELECT week_of_month AS week, COALESCE(SUM(kilograms),0)::float AS kg
         FROM waste_entries
         WHERE barangay = $1
           AND EXTRACT(YEAR FROM created_at) = $2 
           AND EXTRACT(MONTH FROM created_at) = $3
         GROUP BY week_of_month
         ORDER BY week_of_month`,
        [barangay, year, month]
      );
    } else {
      byWeekQ = await pool.query(
        `SELECT week_of_month AS week, COALESCE(SUM(kilograms),0)::float AS kg
         FROM waste_entries
         WHERE barangay = $1
           AND date_trunc('month', created_at) = date_trunc('month', now())
         GROUP BY week_of_month
         ORDER BY week_of_month`,
        [barangay]
      );
    }

    // complaints by category (note: "count" is quoted)
    const complaintsQ = await pool.query(
      `SELECT category, COALESCE(SUM("count"),0)::int AS total
       FROM complaint_entries
       ${WHERE}
       GROUP BY category
       ORDER BY category`,
      params
    );

    // KPIs (all-time, barangay)
    const kpiComplaintsQ = await pool.query(
      `SELECT COALESCE(SUM("count"),0)::int AS complaints_total
       FROM complaint_entries
       WHERE barangay = $1`,
      [barangay]
    );
    const usersQ = await pool.query(
      `SELECT COUNT(*)::int AS users_count
       FROM barangay_admins
       WHERE barangay = $1`,
      [barangay]
    );

    res.json({
      total,
      byCategory: byCatQ.rows,               // [{ category, kg }]
      byPurok: byPurokQ.rows,                // [{ purok, kg }]
      byWeek: byWeekQ.rows,                  // [{ week, kg }]
      complaintsByCategory: complaintsQ.rows,// [{ category, total }]
      kpis: {
        complaints_total: kpiComplaintsQ.rows[0]?.complaints_total ?? 0,
        solved_total: 0,                     // not tracked per-complaint yet
        users_count: usersQ.rows[0]?.users_count ?? 0
      },
      scope: {
        barangay,
        month: hasMonth ? monthStr : null,
        week: hasWeek ? weekNum : null
      }
    });
  } catch (e) {
    console.error('BRGY analytics error:', e);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// Get monthly waste data for the barangay (for the monthly chart)
app.get('/api/brgy/analytics/monthly', requireBarangay, async (req, res) => {
  try {
    const barangay = req.barangay;
    
    // Get waste data grouped by month for the current year
    const monthlyQ = await pool.query(
      `SELECT 
         EXTRACT(MONTH FROM created_at) AS month,
         COALESCE(SUM(kilograms), 0)::float AS kg
       FROM waste_entries
       WHERE barangay = $1 
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
       GROUP BY EXTRACT(MONTH FROM created_at)
       ORDER BY month`,
      [barangay]
    );

    // Create array with all 12 months (fill missing months with 0)
    const monthlyData = new Array(12).fill(0);
    monthlyQ.rows.forEach(row => {
      const monthIndex = parseInt(row.month) - 1; // Convert to 0-based index
      monthlyData[monthIndex] = row.kg;
    });

    res.json({
      monthlyData,
      year: new Date().getFullYear()
    });
  } catch (e) {
    console.error('Monthly analytics error:', e);
    res.status(500).json({ error: 'Failed to load monthly analytics' });
  }
});

// Get barangay-specific complaint stats and user count
app.get('/api/brgy/stats/complaints', requireBarangay, async (req, res) => {
  try {
    const barangay = req.barangay;
    console.log('🔵 Fetching stats for barangay:', barangay);
    
    // Count pendings for this barangay (current complaints)
    const pendingResult = await pool.query(
      'SELECT COUNT(*) as count FROM pendings WHERE location = $1',
      [barangay]
    );
    console.log('Pending count:', pendingResult.rows[0]);
    
    // Count solved posts for this barangay
    const solvedResult = await pool.query(
      'SELECT COUNT(*) as count FROM solved_posts WHERE location = $1',
      [barangay]
    );
    console.log('Solved count:', solvedResult.rows[0]);
    
    // Count users from this barangay - FIXED: using location instead of barangay
    const usersResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE location = $1',
      [barangay]
    );
    console.log('Users count:', usersResult.rows[0]);
    
    const response = {
      total_complaints: parseInt(pendingResult.rows[0].count) || 0,
      solved: parseInt(solvedResult.rows[0].count) || 0,
      users_count: parseInt(usersResult.rows[0].count) || 0
    };
    
    console.log('✅ Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('❌ Error fetching barangay complaints:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// ---------- BULK INSERTS (Barangay-scoped) ----------

// Waste rows: [{category, kilograms, purok?, week_of_month}]
app.post('/api/brgy/waste-entries/bulk', requireBarangay, async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return res.json({ inserted: 0 });

  // Basic validation
  const cleaned = rows
    .map(r => ({
      category: String(r.category || '').trim(),
      kilograms: Number(r.kilograms),
      purok: r.purok == null || r.purok === '' ? null : String(r.purok).trim(),
      week_of_month: Number(r.week_of_month)
    }))
    .filter(r => r.category && Number.isFinite(r.kilograms) && r.kilograms > 0 &&
                 Number.isInteger(r.week_of_month) && r.week_of_month >= 1 && r.week_of_month <= 5);

  if (!cleaned.length) return res.status(400).json({ error: 'No valid rows' });

  // Build VALUES placeholders
  // INSERT INTO waste_entries (barangay, category, kilograms, purok, week_of_month)
  const values = [];
  const params = [];
  cleaned.forEach((r, i) => {
    const base = i * 5;
    params.push(req.barangay, r.category, r.kilograms, r.purok, r.week_of_month);
    values.push(`($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5})`);
  });

  const sql = `
    INSERT INTO waste_entries (barangay, category, kilograms, purok, week_of_month)
    VALUES ${values.join(',')}
  `;

  try {
    const out = await pool.query(sql, params);
    res.json({ inserted: cleaned.length });
  } catch (e) {
    console.error('bulk waste insert err:', e);
    res.status(500).json({ error: 'Failed to save waste rows' });
  }
});

// Complaint rows: [{category, count, purok?, week_of_month}]
app.post('/api/brgy/complaints/bulk', requireBarangay, async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return res.json({ inserted: 0 });

  const cleaned = rows
    .map(r => ({
      category: String(r.category || '').trim(),
      count: Number(r.count),
      purok: r.purok == null || r.purok === '' ? null : String(r.purok).trim(),
      week_of_month: Number(r.week_of_month)
    }))
    .filter(r => r.category && Number.isInteger(r.count) && r.count >= 0 &&
                 Number.isInteger(r.week_of_month) && r.week_of_month >= 1 && r.week_of_month <= 5);

  if (!cleaned.length) return res.status(400).json({ error: 'No valid rows' });

  const values = [];
  const params = [];
  cleaned.forEach((r, i) => {
    const base = i * 5;
    params.push(req.barangay, r.category, r.count, r.purok, r.week_of_month);
    values.push(`($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5})`);
  });

  const sql = `
    INSERT INTO complaint_entries (barangay, category, count, purok, week_of_month)
    VALUES ${values.join(',')}
  `;

  try {
    const out = await pool.query(sql, params);
    res.json({ inserted: cleaned.length });
  } catch (e) {
    console.error('bulk complaints insert err:', e);
    res.status(500).json({ error: 'Failed to save complaint rows' });
  }
});

// Export waste entries endpoint
app.get('/api/waste-entries/export', async (req, res) => {
  try {
    const { barangay } = req.query;
    
    let query = `
      SELECT id, category, kilograms, barangay, week_of_month, created_at, purok
      FROM waste_entries
    `;
    
    const params = [];
    
    if (barangay) {
      query += ' WHERE barangay = $1';
      params.push(barangay);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 1000'; // Limit to last 1000 entries
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching waste entries for export:', error);
    res.status(500).json({ error: 'Failed to fetch waste entries' });
  }
});

// Mark schedule as completed and send notification
app.patch('/api/schedules/:id/complete', async (req, res) => {
  const id = req.params.id;

  try {
    // ✅ Mark the schedule as completed
    const result = await pool.query(
      'UPDATE schedules SET completed = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedule = result.rows[0];
    console.log('✅ Schedule marked as completed:', id);

    // ✅ Get all users in the same barangay
    const usersResult = await pool.query(
      'SELECT expo_push_token FROM user_devices WHERE barangay = $1 AND expo_push_token IS NOT NULL',
      [schedule.barangay]
    );

    const tokens = usersResult.rows
      .map(r => r.expo_push_token)
      .filter(token => token && token.trim() !== '');

    console.log(`📱 Found ${tokens.length} tokens for barangay ${schedule.barangay}`);

    if (tokens.length > 0) {
      // Format the schedule date nicely
      const scheduleDate = new Date(schedule.schedule_date);
      const formattedDate = scheduleDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // ✅ Send push notification
      await sendExpoNotification(
        tokens,
        'Waste Collection Completed',
        `Waste collection in ${schedule.barangay}, Purok ${schedule.zone_number} scheduled for ${formattedDate} has been completed.`,
        {
          type: 'schedule_completed',
          barangay: schedule.barangay,
          zone_number: schedule.zone_number,
          schedule_date: schedule.schedule_date,
          scheduleId: schedule.id
        }
      );

      console.log('📢 Completion notifications sent to', tokens.length, 'users');
    }

    res.json({
      message: 'Schedule marked as completed and notifications sent',
      schedule: schedule,
      notified: tokens.length
    });

  } catch (err) {
    console.error('❌ Error marking schedule as completed or sending notifications:', err);
    res.status(500).json({ error: 'Failed to complete schedule or send notification' });
  }
});

// Send reminder notification to citizens
app.post('/api/schedules/:id/remind', async (req, res) => {
  const id = req.params.id;
  
  try {
    // Get schedule details
    const scheduleResult = await pool.query(
      'SELECT * FROM schedules WHERE id = $1',
      [id]
    );
    
    if (scheduleResult.rowCount === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    const schedule = scheduleResult.rows[0];
    
    // Get all users from this barangay
    const usersResult = await pool.query(
      'SELECT expo_push_token FROM user_devices WHERE barangay = $1 AND expo_push_token IS NOT NULL',
      [schedule.barangay]
    );
    
    const tokens = usersResult.rows
      .map(r => r.expo_push_token)
      .filter(token => token && token.trim() !== '');
    
    console.log(`📱 Found ${tokens.length} tokens for barangay ${schedule.barangay}`);
    
    if (tokens.length === 0) {
      return res.json({ 
        message: 'No users to notify', 
        notified: 0 
      });
    }
    
    // Format the date nicely
    const scheduleDate = new Date(schedule.schedule_date);
    const formattedDate = scheduleDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Send push notifications
    await sendExpoNotification(
      tokens,
      'Waste Collection Reminder',
      `Don't forget! Waste collection in ${schedule.barangay}, Purok ${schedule.zone_number} is scheduled for ${formattedDate}.`,
      {
        type: 'schedule_reminder',
        barangay: schedule.barangay,
        zone_number: schedule.zone_number,
        schedule_date: schedule.schedule_date,
        scheduleId: schedule.id
      }
    );
    
    console.log('✅ Reminder notifications sent to', tokens.length, 'users');
    
    res.json({ 
      message: 'Reminder sent successfully', 
      notified: tokens.length,
      barangay: schedule.barangay,
      zone_number: schedule.zone_number
    });
    
  } catch (err) {
    console.error('❌ Error sending reminder:', err);
    res.status(500).json({ error: 'Failed to send reminder notification' });
  }
});

// 📅 Add a schedule + notify
app.post("/api/schedules", async (req, res) => {
  const { barangay, zone_number, schedule_date } = req.body;

  if (!barangay || !zone_number || !schedule_date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await pool.query(
      "INSERT INTO schedules (barangay, zone_number, schedule_date) VALUES ($1, $2, $3)",
      [barangay, zone_number, schedule_date]
    );

    const result = await pool.query(
      "SELECT expo_push_token FROM user_devices WHERE barangay = $1",
      [barangay]
    );

    const tokens = result.rows.map((r) => r.expo_push_token);

    await sendExpoNotification(
      tokens,
      "New Collection Schedule",
      `New schedule added for ${barangay}, Zone ${zone_number} on ${schedule_date}`,
      { type: "new_schedule", barangay, zone_number, schedule_date }
    );

    res.json({ message: "Schedule added & notifications sent" });
  } catch (err) {
    // handleError(res, "Failed to add schedule", err); // handleError not defined, using standard res
    console.error("Failed to add schedule", err);
    res.status(500).json({ error: "Failed to add schedule" });
  }
});

// 📱 Register a device
app.post("/api/register-device", async (req, res) => {
  const { user_id, barangay, expo_push_token } = req.body;
  console.log("📥 Register request:", req.body);

  if (!barangay || !expo_push_token) {
    return res
      .status(400)
      .json({ error: "barangay and expo_push_token are required" });
  }

  try {
    await pool.query(
      `INSERT INTO user_devices (user_id, barangay, expo_push_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, expo_push_token) DO UPDATE 
         SET barangay = EXCLUDED.barangay`,
      [user_id || null, barangay, expo_push_token]
    );

    res.json({ message: "✅ Device registered successfully" });
  } catch (err) {
    // handleError(res, "Failed to register device", err);
    console.error("Failed to register device", err);
    res.status(500).json({ error: "Failed to register device" });
  }
});

// 🗑 Delete a schedule + notify
app.delete("/api/schedules/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const scheduleResult = await pool.query(
      "SELECT * FROM schedules WHERE id = $1",
      [id]
    );
    const schedule = scheduleResult.rows[0];

    await pool.query("DELETE FROM schedules WHERE id = $1", [id]);

    if (schedule) {
      const usersResult = await pool.query(
        "SELECT expo_push_token FROM user_devices WHERE barangay = $1",
        [schedule.barangay]
      );

      const tokens = usersResult.rows.map((u) => u.expo_push_token);

      await sendExpoNotification(
        tokens,
        "Waste Collection Schedule Cancelled",
        `Schedule cancelled for ${schedule.barangay}, Zone ${schedule.zone_number} on ${schedule.schedule_date}`,
        { type: "deleted_schedule", ...schedule }
      );
    }

    res.json({ message: "Schedule deleted" });
  } catch (err) {
    // handleError(res, "Failed to delete schedule", err);
    console.error("Failed to delete schedule", err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});


app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});