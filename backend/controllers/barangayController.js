const pool = require('../config/database.js');

// Barangay-specific pendings
exports.getBarangayPendings = async (req, res) => {
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
};

// Barangay-specific schedules
exports.getBarangaySchedules = async (req, res) => {
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
};

// Create barangay schedule
exports.createBarangaySchedule = async (req, res) => {
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
};

// Delete barangay schedule
exports.deleteBarangaySchedule = async (req, res) => {
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
};

// Barangay waste entries
exports.addBarangayWasteEntry = async (req, res) => {
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
};

// Barangay complaints
exports.addBarangayComplaint = async (req, res) => {
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
};

// Barangay analytics summary
exports.getBarangayAnalyticsSummary = async (req, res) => {
  try {
    const barangay = req.barangay;

    const monthStr = String(req.query.month || '').trim();
    const weekNum  = Number(req.query.week);
    const hasWeek  = Number.isInteger(weekNum) && weekNum >= 1 && weekNum <= 5;
    const hasMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr);

    const where = [`barangay = $1`];
    const params = [barangay];

    if (hasMonth) {
      const year = parseInt(monthStr.substring(0, 4));
      const month = parseInt(monthStr.substring(5, 7));
      
      params.push(year, month);
      where.push(`EXTRACT(YEAR FROM created_at) = $${params.length - 1} AND EXTRACT(MONTH FROM created_at) = $${params.length}`);
    } else {
      where.push(`date_trunc('month', created_at) = date_trunc('month', now())`);
    }

    if (hasWeek) {
      params.push(weekNum);
      where.push(`week_of_month = $${params.length}`);
    }

    const WHERE = `WHERE ${where.join(' AND ')}`;

    const totalQ = await pool.query(
      `SELECT COALESCE(SUM(kilograms),0)::float AS total
       FROM waste_entries
       ${WHERE}`,
      params
    );
    const total = totalQ.rows[0]?.total ?? 0;

    const byCatQ = await pool.query(
      `SELECT category, COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${WHERE}
       GROUP BY category
       ORDER BY category`,
      params
    );

    const byPurokQ = await pool.query(
      `SELECT COALESCE(purok::text,'N/A') AS purok,
              COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${WHERE}
       GROUP BY COALESCE(purok::text,'N/A')
       ORDER BY COALESCE(purok::text,'N/A')`,
      params
    );

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

    const complaintsQ = await pool.query(
      `SELECT category, COALESCE(SUM("count"),0)::int AS total
       FROM complaint_entries
       ${WHERE}
       GROUP BY category
       ORDER BY category`,
      params
    );

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
      byCategory: byCatQ.rows,
      byPurok: byPurokQ.rows,
      byWeek: byWeekQ.rows,
      complaintsByCategory: complaintsQ.rows,
      kpis: {
        complaints_total: kpiComplaintsQ.rows[0]?.complaints_total ?? 0,
        solved_total: 0,
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
};

// Barangay monthly analytics
exports.getBarangayMonthlyAnalytics = async (req, res) => {
  try {
    const barangay = req.barangay;
    
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

    const monthlyData = new Array(12).fill(0);
    monthlyQ.rows.forEach(row => {
      const monthIndex = parseInt(row.month) - 1;
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
};

// Barangay complaint stats
exports.getBarangayComplaintStats = async (req, res) => {
  try {
    const barangay = req.barangay;
    console.log('🔵 Fetching stats for barangay:', barangay);
    
    const pendingResult = await pool.query(
      'SELECT COUNT(*) as count FROM pendings WHERE location = $1',
      [barangay]
    );
    
    const solvedResult = await pool.query(
      'SELECT COUNT(*) as count FROM solved_posts WHERE location = $1',
      [barangay]
    );
    
    const usersResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE location = $1',
      [barangay]
    );
    
    const response = {
      total_complaints: parseInt(pendingResult.rows[0].count) || 0,
      solved: parseInt(solvedResult.rows[0].count) || 0,
      users_count: parseInt(usersResult.rows[0].count) || 0
    };
    
    console.log('✅ Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('❌ Error fetching barangay complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// Barangay solved posts
exports.getBarangaySolvedPosts = async (req, res) => {
  try {
    const barangay = req.barangay;

    const query = 'SELECT * FROM solved_posts WHERE location = $1 ORDER BY solved_at DESC';
    const params = [barangay];
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching barangay solved posts:', err);
    res.status(500).json({ error: 'Failed to fetch solved posts' });
  }
};

// Decline barangay pending
exports.declineBarangayPending = async (req, res) => {
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
};

// Bulk waste entries
exports.bulkWasteEntries = async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return res.json({ inserted: 0 });

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
};

// Bulk complaints
exports.bulkComplaints = async (req, res) => {
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
};