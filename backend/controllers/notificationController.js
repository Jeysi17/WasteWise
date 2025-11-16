import pool from "../config/db.js";

export const registerDevice = async (req, res) => {
  const { user_id, barangay, expo_push_token } = req.body;

  console.log("📥 Register device request:", { user_id, barangay, expo_push_token });

  if (!barangay || !expo_push_token) {
    return res.status(400).json({ error: "Missing required fields: barangay and expo_push_token" });
  }

  try {
    const query = `
      INSERT INTO user_devices (user_id, barangay, expo_push_token)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, expo_push_token)
      DO UPDATE SET barangay = EXCLUDED.barangay
      RETURNING *;
    `;

    const values = [user_id || null, barangay, expo_push_token];
    console.log("🔍 Executing query with values:", values);
    
    const result = await pool.query(query, values);

    console.log("✅ Device registered successfully:", result.rows[0]);
    
    res.json({
      success: true,
      message: "Device registered successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Database error in registerDevice:", err);
    res.status(500).json({ 
      error: "Failed to register device",
      details: err.message 
    });
  }
};

// Get notification history for a user
export const getNotificationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log("📥 Fetching notifications for user:", userId);

    // Get user's barangay from users table first
    const userResult = await pool.query(
      'SELECT location FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userBarangay = userResult.rows[0].location;

    // Get notifications for user's barangay
    const notifications = await pool.query(
      `SELECT * FROM notifications 
       WHERE barangay = $1 
       ORDER BY sent_at DESC 
       LIMIT 50`,
      [userBarangay]
    );

    console.log(`✅ Found ${notifications.rows.length} notifications for user ${userId}`);
    res.json(notifications.rows);
    
  } catch (err) {
    console.error("❌ Error fetching notification history:", err);
    res.status(500).json({ error: "Failed to fetch notification history" });
  }
};

// NEW: Get notifications by barangay (for mobile app)
export const getNotificationsByBarangay = async (req, res) => {
  try {
    const { barangay } = req.query;
    
    console.log("📥 Fetching notifications for barangay:", barangay);

    if (!barangay) {
      return res.status(400).json({ error: "Barangay is required" });
    }

    // Get notifications for the specified barangay
    const notifications = await pool.query(
      `SELECT * FROM notifications 
       WHERE barangay = $1 
       ORDER BY sent_at DESC 
       LIMIT 50`,
      [barangay]
    );

    console.log(`✅ Found ${notifications.rows.length} notifications for barangay ${barangay}`);
    res.json(notifications.rows);
    
  } catch (err) {
    console.error("❌ Error fetching notifications by barangay:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const getNotificationsByUser = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    console.log("📥 Fetching PERSONAL notifications for user_id:", user_id);

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // FIXED: Fetch notifications specifically for this user (personal notifications)
    const notifications = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY sent_at DESC 
       LIMIT 50`,
      [user_id]
    );

    console.log(`✅ Found ${notifications.rows.length} PERSONAL notifications for user ${user_id}`);
    res.json(notifications.rows);
    
  } catch (err) {
    console.error("❌ Error fetching personal notifications:", err);
    console.error("❌ Full error details:", err.message);
    res.status(500).json({ 
      error: "Failed to fetch personal notifications",
      details: err.message 
    });
  }
};