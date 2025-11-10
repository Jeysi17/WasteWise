import pool from "../config/db.js";

export const createUser = async (req, res) => {
  const { name, email, location, appwrite_id } = req.body;
  try {
    await pool.query(
      "INSERT INTO users (name, email, location, appwrite_id) VALUES ($1, $2, $3, $4)",
      [name, email, location, appwrite_id]
    );
    res.json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const getUserById = async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, location FROM users WHERE appwrite_id = $1",
      [user_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const getUserLocation = async (req, res) => {
  const { userEmail } = req.query;
  if (!userEmail) {
    return res.status(400).json({ error: "userEmail is required" });
  }
  try {
    const result = await pool.query(
      "SELECT location FROM users WHERE email = $1",
      [userEmail]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ location: result.rows[0].location });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch location" });
  }
};