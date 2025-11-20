const pool = require('../config/database.js');
const { sendExpoNotification } = require('../utils/notifications.js');
const { saveNotificationToDB } = require('./notificationsController.js');

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM schedules ORDER BY schedule_date ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching schedules:', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

// Create schedule
exports.createSchedule = async (req, res) => {
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

    const title = '🗑 New Collection Schedule';
    const message = `New schedule added for ${barangay}, Zone ${zone_number} on ${schedule_date}`;
    const data = { type: 'new_schedule', barangay, zone_number, schedule_date };

    await sendExpoNotification(tokens, title, message, data);
    await saveNotificationToDB(null, barangay, title, message, data);

    res.json({ message: "Schedule added & notifications sent" });
  } catch (err) {
    console.error('Failed to add schedule:', err);
    res.status(500).json({ error: "Failed to add schedule" });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
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

      const title = 'Waste Collection Schedule Cancelled';
      const message = `Schedule cancelled for ${schedule.barangay}, Zone ${schedule.zone_number} on ${schedule.schedule_date}`;
      const data = { type: 'deleted_schedule', ...schedule };

      await sendExpoNotification(tokens, title, message, data);
      await saveNotificationToDB(null, schedule.barangay, title, message, data);
    }

    res.json({ message: "Schedule deleted" });
  } catch (err) {
    console.error('Failed to delete schedule:', err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
};

// Mark schedule as completed
exports.completeSchedule = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query(
      'UPDATE schedules SET completed = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedule = result.rows[0];
    console.log('✅ Schedule marked as completed:', id);

    const usersResult = await pool.query(
      'SELECT expo_push_token FROM user_devices WHERE barangay = $1 AND expo_push_token IS NOT NULL',
      [schedule.barangay]
    );

    const tokens = usersResult.rows
      .map(r => r.expo_push_token)
      .filter(token => token && token.trim() !== '');

    console.log(`📱 Found ${tokens.length} tokens for barangay ${schedule.barangay}`);

    if (tokens.length > 0) {
      const scheduleDate = new Date(schedule.schedule_date);
      const formattedDate = scheduleDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const title = 'Waste Collection Completed';
      const message = `Waste collection in ${schedule.barangay}, Purok ${schedule.zone_number} scheduled for ${formattedDate} has been completed.`;
      const data = {
        type: 'schedule_completed',
        barangay: schedule.barangay,
        zone_number: schedule.zone_number,
        schedule_date: schedule.schedule_date,
        scheduleId: schedule.id
      };

      await sendExpoNotification(tokens, title, message, data);
      await saveNotificationToDB(null, schedule.barangay, title, message, data);

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
};

// Send reminder
exports.sendReminder = async (req, res) => {
  const id = req.params.id;
  
  try {
    const scheduleResult = await pool.query(
      'SELECT * FROM schedules WHERE id = $1',
      [id]
    );
    
    if (scheduleResult.rowCount === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    const schedule = scheduleResult.rows[0];
    
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
    
    const scheduleDate = new Date(schedule.schedule_date);
    const formattedDate = scheduleDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const title = 'Waste Collection Reminder';
    const message = `Don't forget! Waste collection in ${schedule.barangay}, Purok ${schedule.zone_number} is scheduled for ${formattedDate}.`;
    const data = {
      type: 'schedule_reminder',
      barangay: schedule.barangay,
      zone_number: schedule.zone_number,
      schedule_date: schedule.schedule_date,
      scheduleId: schedule.id
    };

    await sendExpoNotification(tokens, title, message, data);
    await saveNotificationToDB(null, schedule.barangay, title, message, data);
    
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
};

// Register device for notifications
exports.registerDevice = async (req, res) => {
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
    console.error('Failed to register device:', err);
    res.status(500).json({ error: "Failed to register device" });
  }
};