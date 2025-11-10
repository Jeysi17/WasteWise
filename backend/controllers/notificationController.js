import pool from "../config/db.js";
import { sendExpoNotification } from "../utils/sendExpoNotification.js";

export const registerDevice = async (req, res) => {
  const { user_id, barangay, expo_push_token } = req.body;

  if (!barangay || !expo_push_token)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const query = `
      INSERT INTO user_devices (user_id, barangay, expo_push_token)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, expo_push_token)
      DO UPDATE SET barangay = EXCLUDED.barangay
      RETURNING *;
    `;

    const values = [user_id || null, barangay, expo_push_token];
    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: "Device registered successfully",
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to register device" });
  }
};
