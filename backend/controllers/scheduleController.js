import pool from "../config/db.js";

export const getSchedules = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM schedules ORDER BY schedule_date ASC");
    const fixed = result.rows.map((item) => {
      if (item.schedule_date) {
        const date = new Date(item.schedule_date);
        date.setHours(date.getHours() + 8);
        item.schedule_date = date.toISOString().split("T")[0];
      }
      return item;
    });
    res.json(fixed);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
};

export const getLatestSchedule = async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ error: "Barangay is required" });

  try {
    const result = await pool.query(
      `SELECT * FROM schedules
       WHERE LOWER(location) = LOWER($1)
       ORDER BY schedule_date DESC LIMIT 1`,
      [location]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
};
