require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const dialogflow = require('@google-cloud/dialogflow');

// ✅ Universal fetch import (works in Node 16 & 18+)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve static HTML/CSS/JS
app.use(express.urlencoded({ extended: true }));

// ✅ PostgreSQL connection (from .env)
const pool = new Pool({
  user: "01971842-d24f-7abd-ace2-a2ff5c9d83cf",
  password: "b4a6c17e-b03a-46a1-b720-23ae0dfc8ce5",
  host: "us-west-2.db.thenile.dev",
  port: 5432,
  database: "wastewise_app",
  ssl: { rejectUnauthorized: false },
});

// ✅ Dialogflow Configuration
const DIALOGFLOW_PROJECT_ID = 'wastewise-gach';
const LANGUAGE_CODE = 'en';

// ✅ Initialize Dialogflow client with service account
let sessionClient;
try {
  // The Google Cloud client will automatically use GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    sessionClient = new dialogflow.SessionsClient();
    console.log('✅ Dialogflow client initialized with service account');
  } else {
    console.log('⚠️ GOOGLE_APPLICATION_CREDENTIALS not set, Dialogflow will use fallback');
  }
} catch (error) {
  console.log('⚠️ Dialogflow client initialization failed:', error.message);
}

// ✅ Send message to Dialogflow using Google Cloud client
async function sendToDialogflow(text, sessionId) {
  if (!sessionClient) {
    console.log('⚠️ Dialogflow client not available, using fallback responses');
    return getFallbackResponse(text);
  }

  try {
    const sessionPath = sessionClient.projectAgentSessionPath(
      DIALOGFLOW_PROJECT_ID,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: LANGUAGE_CODE,
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    
    console.log('🤖 Dialogflow response:', result.fulfillmentText);
    return result.fulfillmentText || 'Sorry, I couldn\'t understand that.';
  } catch (error) {
    console.error('Dialogflow error:', error.message);
    return getFallbackResponse(text);
  }
}

// ✅ Fallback responses when Dialogflow is not available
function getFallbackResponse(text) {
  const lowerMessage = text.toLowerCase();
  
  if (lowerMessage.includes("schedule") || lowerMessage.includes("collection")) {
    return "🗓️ You can check your waste collection schedule in the Schedule tab. Schedules are updated regularly and you'll receive notifications for any changes.";
  } else if (lowerMessage.includes("recycle") || lowerMessage.includes("recycling")) {
    return "♻️ Great question! You can recycle paper, plastic bottles, glass, and metal cans. Make sure to clean them before putting in recycling bins. Check your local guidelines for specific items.";
  } else if (lowerMessage.includes("hazardous") || lowerMessage.includes("battery") || lowerMessage.includes("chemical")) {
    return "⚠️ Hazardous waste like batteries, chemicals, and electronics should be taken to designated collection centers. Never put them in regular trash bins.";
  } else if (lowerMessage.includes("compost") || lowerMessage.includes("organic")) {
    return "🌱 Organic waste like food scraps and yard trimmings can be composted. This reduces waste and creates nutrient-rich soil for plants.";
  } else if (lowerMessage.includes("plastic") || lowerMessage.includes("bag")) {
    return "🛍️ Plastic bags should be recycled at designated drop-off locations, not in regular recycling bins. Consider using reusable bags to reduce plastic waste.";
  } else if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
    return "🤖 I can help you with waste management questions! Ask me about:\n• Collection schedules\n• Recycling guidelines\n• Hazardous waste disposal\n• Composting tips\n• Plastic bag recycling\n\nWhat would you like to know?";
  } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "👋 Hello! I'm your WasteWise assistant. I'm here to help you with waste management questions and tips. How can I assist you today?";
  } else if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
    return "😊 You're welcome! Feel free to ask me anything else about waste management. I'm here to help!";
  } else {
    return "🤔 I'm not sure about that specific question. I can help you with waste collection schedules, recycling guidelines, hazardous waste disposal, and composting tips. Try asking about one of these topics!";
  }
}

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

// ✅ Helper: centralized error handler
function handleError(res, message, error, code = 500) {
  console.error(`❌ ${message}:`, error);
  res.status(code).json({ error: message });
}

// ✅ Configure multer for file uploads
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `complaint_${timestamp}.jpg`);
  }
});

const upload = multer({ storage: storage });

// ----------------- ROUTES -----------------

// 📅 Get schedules
app.get("/api/schedules", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM schedules ORDER BY schedule_date ASC"
    );
    res.json(result.rows);
  } catch (err) {
    handleError(res, "Failed to fetch schedules", err);
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
      "🗑 New Collection Schedule",
      `New schedule added for ${barangay}, Zone ${zone_number} on ${schedule_date}`,
      { type: "new_schedule", barangay, zone_number, schedule_date }
    );

    res.json({ message: "Schedule added & notifications sent" });
  } catch (err) {
    handleError(res, "Failed to add schedule", err);
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
    handleError(res, "Failed to register device", err);
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
        "❌ Schedule Cancelled",
        `Schedule cancelled for ${schedule.barangay}, Zone ${schedule.zone_number} on ${schedule.schedule_date}`,
        { type: "deleted_schedule", ...schedule }
      );
    }

    res.json({ message: "Schedule deleted" });
  } catch (err) {
    handleError(res, "Failed to delete schedule", err);
  }
});

// 👤 Get user info
app.get("/api/users/:user_id", async (req, res) => {
  const userId = req.params.user_id;

  try {
    const result = await pool.query(
      "SELECT id, location FROM users WHERE appwrite_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, "Failed to fetch user", err);
  }
});

// 🤖 Chatbot endpoint with Dialogflow integration
app.post("/api/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: "Message and sessionId are required" });
  }

  try {
    // Try Dialogflow first, fallback to keyword-based responses
    const reply = await sendToDialogflow(message, sessionId);
    res.json({ reply });
  } catch (err) {
    handleError(res, "Failed to process chat message", err);
  }
});

app.get('/api/location', async (req, res) => {
  try {
    console.log('📍 Location API endpoint called');
    
    const userEmail = req.query.userEmail;
    console.log('📧 User email:', userEmail);
    
    if (!userEmail) {
      console.log('❌ No userEmail provided');
      return res.status(400).json({ error: 'userEmail is required' });
    }

    console.log('🔌 Querying database...');
    
    // Use the existing pool connection instead of creating a new client
    const query = `SELECT location FROM users WHERE email = $1;`;
    
    console.log('🔍 Executing query for email:', userEmail);
    const result = await pool.query(query, [userEmail]);
    console.log('📊 Query result:', result.rows);

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const location = result.rows[0].location;
    console.log('📍 Found location:', location);

    res.json({ location });
  } catch (err) {
    console.error('❌ Error fetching location:', err);
    res.status(500).json({ error: 'Failed to fetch location', details: err.message });
  }
});

// 🚨 NEW: Complaint submission endpoint
app.post('/api/pending', upload.single('image'), async (req, res) => {
  try {
    console.log('📝 Complaint submission received');
    const { name, title, category, location, details, date } = req.body;
    const file = req.file;

    console.log('📋 Complaint data:', { name, title, category, location, details, date });
    console.log('📷 File uploaded:', file ? file.filename : 'No file');

    if (!file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const imagePath = `/uploads/${file.filename}`;

    try {
      // Use the existing pool connection
      const result = await pool.query(
        `INSERT INTO pendings (name, title, category, image, location, details, post_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [name, title, category, imagePath, location, details, date]
      );

      console.log('✅ Complaint saved to database with ID:', result.rows[0].id);
      res.status(200).json({ 
        message: "✅ Complaint submitted successfully", 
        image: imagePath,
        id: result.rows[0].id
      });
    } catch (dbErr) {
      console.error("❌ Database error:", dbErr);
      res.status(500).json({ error: "Failed to save complaint to database" });
    }
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Failed to process complaint submission" });
  }
});

// 📋 Get pending posts for admin
app.get('/api/pendings', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM pendings ORDER BY post_date DESC"
    );
    res.json(result.rows);
  } catch (err) {
    handleError(res, "Failed to fetch pending posts", err);
  }
});

// ✅ Approve a pending post
app.post('/api/approve/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    // Get the pending post data
    const pendingResult = await pool.query(
      "SELECT * FROM pendings WHERE id = $1",
      [id]
    );
    
    if (pendingResult.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    const post = pendingResult.rows[0];
    
    // Move to approved posts table (assuming you have an 'approved_posts' table)
    await pool.query(
      `INSERT INTO approved_posts (name, title, category, image, location, details, post_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [post.name, post.title, post.category, post.image, post.location, post.details, post.post_date]
    );
    
    // Remove from pending table
    await pool.query("DELETE FROM pendings WHERE id = $1", [id]);
    
    res.json({ message: "Post approved successfully" });
  } catch (err) {
    handleError(res, "Failed to approve post", err);
  }
});

// ❌ Decline/Delete a pending post
app.delete('/api/decline/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const result = await pool.query("DELETE FROM pendings WHERE id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    res.json({ message: "Post declined successfully" });
  } catch (err) {
    handleError(res, "Failed to decline post", err);
  }
});

// 👤 Create user route (add this near other user routes)
app.post("/api/user", async (req, res) => {
  const { name, email, location, appwrite_id } = req.body;

  try {
    await pool.query(
      "INSERT INTO users (name, email, location, appwrite_id) VALUES ($1, $2, $3, $4)",
      [name, email, location, appwrite_id]
    );
    res.json({ message: "✅ User created successfully" });
  } catch (err) {
    handleError(res, "Failed to create user", err);
  }
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'WasteWise API Server is running' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    EXPO_PUBLIC_HOST_URL: process.env.EXPO_PUBLIC_HOST_URL 
  });
});

// ----------------- SERVER -----------------
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API Base URL: http://localhost:${port}/api`);
  console.log(`📝 Complaint endpoint: http://localhost:${port}/api/pending`);
});