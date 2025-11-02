import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Pool } from "pg";
import dialogflow from "@google-cloud/dialogflow";
import { GoogleAuth } from "google-auth-library";
import { fileURLToPath } from "url";
import { SessionsClient } from '@google-cloud/dialogflow';
// ✅ Recreate __dirname and __filename in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const auth = new GoogleAuth({
  keyFile: "./wastewise-gach-cc6d87ed1dd4.json",
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

async function getAccessToken() {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

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
import axios from "axios";

// 🔧 FIX: Proper Dialogflow client initialization
const sendToDialogflow = async (message, sessionId) => {
  try {
    // Method 1: Using service account key file (RECOMMENDED)
    const sessionClient = new SessionsClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to your JSON key file
    });

    // OR Method 2: Using credentials object directly
    // const sessionClient = new SessionsClient({
    //   credentials: JSON.parse(process.env.DIALOGFLOW_CREDENTIALS), // JSON key as string
    // });

    const projectId = process.env.DIALOGFLOW_PROJECT_ID;
    const sessionPath = sessionClient.projectAgentSessionPath(
      projectId,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: 'en-US',
        },
      },
    };

    console.log('🤖 Sending to Dialogflow:', { projectId, sessionId, message });

    const [response] = await sessionClient.detectIntent(request);
    console.log('✅ Dialogflow response received');

    return response.queryResult;
  } catch (error) {
    console.error('❌ Dialogflow Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    throw error;
  }
};

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

  // 🧩 Validate inputs
  if (!barangay || !expo_push_token) {
    return res.status(400).json({
      error: "Missing required fields: barangay and expo_push_token",
    });
  }

  try {
    // 🧠 Confirm DB connection
    if (!pool) {
      console.error("❌ Database pool is not initialized!");
      return res.status(500).json({ error: "Database not initialized" });
    }

    // 🧾 Insert or update device
    const query = `
      INSERT INTO user_devices (user_id, barangay, expo_push_token)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, expo_push_token)
      DO UPDATE SET barangay = EXCLUDED.barangay
      RETURNING *;
    `;

    const values = [user_id || null, barangay, expo_push_token];

    const result = await pool.query(query, values);

    console.log("✅ Device registered or updated:", result.rows[0]);

    res.json({
      success: true,
      message: "✅ Device registered successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Failed to register device:", err.message);
    console.error("🔍 Full error object:", err);
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
    return res
      .status(400)
      .json({ error: "Message and sessionId are required" });
  }

  try {
    const result = await sendToDialogflow(message, sessionId);

    // ✅ Get fulfillment messages
    const fulfillmentMessages = result?.fulfillmentMessages || [];
    const fulfillmentText =
      result?.fulfillmentText ||
      fulfillmentMessages.find((msg) => msg?.text?.text?.length > 0)?.text
        ?.text?.[0] ||
      "⚠️ Sorry, I didn't understand that.";

    // ✅ Extract suggestion chips from richContent
    let suggestionChips = [];

    fulfillmentMessages.forEach((msg) => {
      if (msg?.payload?.fields?.richContent) {
        try {
          const richContent = msg.payload.fields.richContent;
          
          // Navigate through the nested structure to find chips
          const extractChipsFromStruct = (obj) => {
            const chips = [];
            
            // Check if this level has listValue
            if (obj.listValue?.values) {
              obj.listValue.values.forEach(section => {
                // Each section can have another listValue with items
                if (section.listValue?.values) {
                  section.listValue.values.forEach(item => {
                    // Look for structValue with fields containing type and options
                    if (item.structValue?.fields) {
                      const fields = item.structValue.fields;
                      
                      // Check if this is a chips type
                      if (fields.type?.stringValue === 'chips' && fields.options?.listValue?.values) {
                        // Extract text from each option
                        fields.options.listValue.values.forEach(option => {
                          if (option.structValue?.fields?.text?.stringValue) {
                            chips.push(option.structValue.fields.text.stringValue);
                          }
                        });
                      }
                    }
                  });
                }
              });
            }
            
            return chips;
          };
          
          suggestionChips = extractChipsFromStruct(richContent);
          console.log('✅ Successfully extracted chips:', suggestionChips);
          
        } catch (e) {
          console.error('❌ Error parsing richContent:', e);
        }
      }
    });

    // Build payload with extracted chips
    const payload = suggestionChips.length > 0 ? { buttons: suggestionChips } : {};

    console.log('📤 Final response:', { 
      reply: fulfillmentText, 
      buttons: suggestionChips 
    });

    res.status(200).json({
      reply: fulfillmentText,
      payload: payload,
    });
  } catch (err) {
    console.error("❌ Error in /api/chat:", err);

    res.status(500).json({
      error: "Failed to process chat message",
      details: err.message || err,
    });
  }
})

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