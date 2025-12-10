import pool from "../config/db.js";

export const createPending = async (req, res) => {
  const { name, title, location, details, date, imageUrl, user_id } = req.body;
  if (!name || !title || !location || !details || !imageUrl)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const result = await pool.query(
      `INSERT INTO pendings (user_id, name, title, image, location, details, post_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
       RETURNING id`,
      [user_id, name, title, imageUrl, location, details, date]
    );
    res.json({ message: "Complaint submitted successfully", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit complaint" });
  }
};

export const getPostsByStatus = async (req, res) => {
  const { email, status } = req.params;
  let table;
  if (status === "pending") table = "pendings";
  else if (status === "approved") table = "approved_posts";
  else if (status === "solved") table = "solved_posts";
  else return res.status(400).json({ error: "Invalid status" });

  try {
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE name = $1 ORDER BY post_date DESC;`,
      [email]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const getUserSummary = async (req, res) => {
    const { name } = req.params; // This receives the email from frontend
  
    try {
      // Change 'name' to 'email' in the WHERE clause if that's your column name
      const pendingQuery = `SELECT COUNT(*) FROM pendings WHERE name = $1;`;
      const approvedQuery = `SELECT COUNT(*) FROM approved_posts WHERE name = $1;`;
      const solvedQuery = `SELECT COUNT(*) FROM solved_posts WHERE name = $1;`;
  
      const [pendingResult, approvedResult, solvedResult] = await Promise.all([
        pool.query(pendingQuery, [name]),
        pool.query(approvedQuery, [name]),
        pool.query(solvedQuery, [name]),
      ]);
  
      const pendingCount = parseInt(pendingResult.rows[0].count) || 0;
      const approvedCount = parseInt(approvedResult.rows[0].count) || 0;
      const solvedCount = parseInt(solvedResult.rows[0].count) || 0;
      
      // Calculate total pending (pending + approved)
      const totalPending = pendingCount + approvedCount;
  
      res.json({
        pending: totalPending, // This now includes both pending and approved
        solved: solvedCount,
        // You can still include the breakdown if needed
        breakdown: {
          pending_only: pendingCount,
          approved: approvedCount,
          solved: solvedCount
        }
      });
    } catch (err) {
      console.error("Error fetching summary:", err);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  };