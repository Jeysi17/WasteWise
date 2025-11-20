const pool = require('../config/database.js');
const { sendExpoNotification } = require('../utils/notifications.js');

/**
 * Save notification to database
 * @param {string} user_id - User ID to send notification to
 * @param {string} barangay - Barangay name
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data as JSON
 */
async function saveNotificationToDB(user_id, barangay, title, message, data = {}) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, barangay, title, message, data, sent_at, is_read)
       VALUES ($1, $2, $3, $4, $5, NOW(), false)`,
      [user_id, barangay, title, message, JSON.stringify(data)]
    );
    console.log(`💾 Notification saved to DB for user: ${user_id}`);
  } catch (err) {
    console.error("❌ Error saving notification to DB:", err.message);
  }
}

/**
 * Send push notification through Expo and save to database
 * @param {Array<string>} pushTokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body/message
 * @param {Object} data - Additional data to send with notification
 * @param {string} user_id - User ID (optional, for saving to DB)
 * @param {string} barangay - Barangay (optional, for saving to DB)
 */
/**
 * Register a device for push notifications
 */
const registerDevice = async (req, res) => {
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
    console.error("❌ Failed to register device:", err);
    res.status(500).json({ error: "Failed to register device" });
  }
};

/**
 * Send reminder notification for a schedule
 */
const sendScheduleReminder = async (req, res) => {
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

    await saveNotificationToDB(
      null,
      schedule.barangay,
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
};

/**
 * Send notification when schedule is completed
 */
const notifyScheduleCompleted = async (req, res) => {
  const id = req.params.id;

  try {
    // Mark the schedule as completed
    const result = await pool.query(
      'UPDATE schedules SET completed = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedule = result.rows[0];
    console.log('✅ Schedule marked as completed:', id);

    // Get all users in the same barangay
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

      // Send push notification
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

      await saveNotificationToDB(
        null,
        schedule.barangay,
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
};

/**
 * Send notification when new schedule is created
 * @param {string} barangay - Barangay name
 * @param {string} zone_number - Zone/Purok number
 * @param {string} schedule_date - Schedule date
 */
const notifyNewSchedule = async (barangay, zone_number, schedule_date) => {
  try {
    const result = await pool.query(
      "SELECT expo_push_token FROM user_devices WHERE barangay = $1",
      [barangay]
    );

    const tokens = result.rows.map((r) => r.expo_push_token).filter(Boolean);

    if (tokens.length > 0) {
      await sendExpoNotification(
        tokens,
        "New Collection Schedule",
        `New schedule added for ${barangay}, Zone ${zone_number} on ${schedule_date}`,
        { type: "new_schedule", barangay, zone_number, schedule_date }
      );

      await saveNotificationToDB(
        null,
        barangay,
        'New Collection Schedule',
        `New schedule added for ${barangay}, Zone ${zone_number} on ${schedule_date}`,
        { type: 'new_schedule', barangay, zone_number, schedule_date }
      );
    }
  } catch (err) {
    console.error("❌ Error sending new schedule notification:", err);
  }
};

/**
 * Send notification when schedule is deleted
 * @param {Object} schedule - Schedule object with barangay, zone_number, schedule_date
 */
const notifyScheduleDeleted = async (schedule) => {
  try {
    const usersResult = await pool.query(
      "SELECT expo_push_token FROM user_devices WHERE barangay = $1",
      [schedule.barangay]
    );

    const tokens = usersResult.rows.map((u) => u.expo_push_token).filter(Boolean);

    if (tokens.length > 0) {
      await sendExpoNotification(
        tokens,
        "Waste Collection Schedule Cancelled",
        `Schedule cancelled for ${schedule.barangay}, Zone ${schedule.zone_number} on ${schedule.schedule_date}`,
        { type: "deleted_schedule", ...schedule }
      );

      await saveNotificationToDB(
        null,
        schedule.barangay,
        'Waste Collection Schedule Cancelled',
        `Schedule cancelled for ${schedule.barangay}, Zone ${schedule.zone_number} on ${schedule.schedule_date}`,
        { type: 'deleted_schedule', ...schedule }
      );
    }
  } catch (err) {
    console.error("❌ Error sending schedule deletion notification:", err);
  }
};

/**
 * Send notification when post is approved
 * @param {Object} post - Post object
 */
const notifyPostApproved = async (post) => {
  try {
    const tokenResult = await pool.query(
      'SELECT expo_push_token FROM user_devices WHERE user_id = $1 AND expo_push_token IS NOT NULL',
      [post.user_id]
    );

    const tokens = tokenResult.rows
      .map(r => r.expo_push_token)
      .filter(token => token);

    console.log(`📱 Found ${tokens.length} tokens for user_id ${post.user_id}`);

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

      await saveNotificationToDB(
        post.user_id,
        post.location,
        'Your Complaint has been forwarded to CENRO!',
        `Your complaint "${post.title}" has been approved and forwarded to CENRO.`,
        {
          type: 'post_approved',
          postId: post.id,
          title: post.title,
          location: post.location
        }
      );
    } else {
      console.log('⚠️ No Expo tokens found for user_id:', post.user_id);
    }
  } catch (err) {
    console.error("❌ Error sending post approval notification:", err);
  }
};

/**
 * Send notification when post is solved by barangay
 * @param {Object} post - Post object
 * @param {string} remarks - Resolution remarks
 * @param {string} status - Status message
 */
const notifyPostSolvedByBarangay = async (post, remarks, status) => {
  try {
    const tokenResult = await pool.query(
      'SELECT expo_push_token FROM user_devices WHERE user_id = $1 AND expo_push_token IS NOT NULL',
      [post.user_id]
    );

    const tokens = tokenResult.rows
      .map(r => r.expo_push_token)
      .filter(token => token);

    console.log(`📱 Found ${tokens.length} tokens for user_id ${post.user_id}`);

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
          status: status
        }
      );
      console.log('📲 Resolution notification sent to user:', tokens);

      await saveNotificationToDB(
        post.user_id,
        post.location,
        'Your complaint has been resolved by the Barangay!',
        `Your complaint "${post.title}" has been marked as solved by ${post.location}.`,
        {
          type: 'post_solved',
          postId: post.id,
          title: post.title,
          location: post.location,
          remarks,
          status
        }
      );
    } else {
      console.log('⚠️ No Expo tokens found for user_id:', post.user_id);
    }
  } catch (err) {
    console.error("❌ Error sending barangay solved notification:", err);
  }
};

/**
 * Send notification when post is solved by CENRO
 * @param {Object} post - Post object
 * @param {string} remarks - Resolution remarks
 * @param {string} status - Status message
 */
const notifyPostSolvedByCENRO = async (post, remarks, status) => {
  try {
    if (!post.user_id) {
      console.log('⚠️ WARNING: No user_id in post! Cannot send notification.');
      return;
    }

    console.log('🔍 Querying user_devices for user_id:', post.user_id);
    
    const tokenResult = await pool.query(
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
      console.log('📤 Attempting to send notification...');
      
      await sendExpoNotification(
        tokens,
        'Your complaint has been resolved by CENRO!',
        `Your complaint "${post.title}" has been marked as solved by CENRO.`,
        {
          type: 'post_solved_cenro',
          postId: post.id,
          title: post.title,
          location: post.location,
          remarks: remarks,
          status: status
        }
      );
      
      console.log('✅ CENRO resolution notification sent successfully');

      await saveNotificationToDB(
        post.user_id,
        post.location,
        'Your complaint has been resolved by CENRO!',
        `Your complaint "${post.title}" has been marked as solved by CENRO.`,
        {
          type: 'post_solved_cenro',
          postId: post.id,
          title: post.title,
          location: post.location,
          remarks,
          status
        }
      );
    } else {
      console.log('⚠️ No valid Expo push tokens found for user_id:', post.user_id);
    }
  } catch (err) {
    console.error("❌ Error sending CENRO solved notification:", err);
    console.error('Notification error details:', {
      message: err.message,
      stack: err.stack
    });
  }
};

module.exports = {
  sendExpoNotification,
  registerDevice,
  sendScheduleReminder,
  notifyScheduleCompleted,
  notifyNewSchedule,
  notifyScheduleDeleted,
  notifyPostApproved,
  notifyPostSolvedByBarangay,
  notifyPostSolvedByCENRO,
  saveNotificationToDB
};