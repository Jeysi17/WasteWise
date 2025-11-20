const pool = require('../config/database.js');

// Add waste entry
exports.addWasteEntry = async (req, res) => {
  const { category, kilograms, barangay, week_of_month } = req.body || {};
  if (!category || !kilograms || !barangay || !week_of_month) {
    return res.status(400).json({ error: 'category, kilograms, barangay, week_of_month are required' });
  }
  try {
    await pool.query(
      `INSERT INTO waste_entries (category, kilograms, barangay, week_of_month)
       VALUES ($1,$2,$3,$4)`,
      [category, kilograms, barangay, week_of_month]
    );
    res.json({ message: 'Waste entry saved' });
  } catch (e) {
    console.error('Add waste entry error:', e);
    res.status(500).json({ error: 'Failed to save waste entry' });
  }
};

// Upsert KPIs
exports.upsertKPIs = async (req, res) => {
  const { kpi_date, complaints, solved, users_count } = req.body || {};
  if (!kpi_date) return res.status(400).json({ error: 'kpi_date is required' });
  try {
    await pool.query(
      `INSERT INTO kpi_daily (kpi_date, complaints, solved, users_count)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (kpi_date) DO UPDATE
       SET complaints = EXCLUDED.complaints,
           solved = EXCLUDED.solved,
           users_count = EXCLUDED.users_count`,
      [kpi_date, complaints ?? 0, solved ?? 0, users_count ?? 0]
    );
    res.json({ message: 'KPIs saved' });
  } catch (e) {
    console.error('Save KPIs error:', e);
    res.status(500).json({ error: 'Failed to save KPIs' });
  }
};

// Analytics summary
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const { period = 'month', year, month, week, barangay } = req.query;
    
    let whereClause = '';
    let kpiWhereClause = '';
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const barangayCondition = barangay ? `AND barangay = '${barangay}'` : '';
    
    if (period === 'week') {
      const startOfYear = new Date(currentYear, 0, 1);
      const weekNum = Math.ceil(((currentDate - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      const targetWeek = week || weekNum;
      const targetYear = year || currentYear;
      
      whereClause = `WHERE EXTRACT(YEAR FROM created_at) = ${targetYear} 
                     AND EXTRACT(WEEK FROM created_at) = ${targetWeek} ${barangayCondition}`;
      kpiWhereClause = `WHERE EXTRACT(YEAR FROM kpi_date) = ${targetYear} 
                        AND EXTRACT(WEEK FROM kpi_date) = ${targetWeek}`;
    } 
    else if (period === 'month') {
      const targetMonth = month || currentMonth;
      const targetYear = year || currentYear;
      
      whereClause = `WHERE EXTRACT(YEAR FROM created_at) = ${targetYear} 
                     AND EXTRACT(MONTH FROM created_at) = ${targetMonth} ${barangayCondition}`;
      kpiWhereClause = `WHERE EXTRACT(YEAR FROM kpi_date) = ${targetYear} 
                        AND EXTRACT(MONTH FROM kpi_date) = ${targetMonth}`;
    } 
    else if (period === 'year') {
      const targetYear = year || currentYear;
      
      whereClause = `WHERE EXTRACT(YEAR FROM created_at) = ${targetYear} ${barangayCondition}`;
      kpiWhereClause = `WHERE EXTRACT(YEAR FROM kpi_date) = ${targetYear}`;
    }

    const totalQ = await pool.query(
      `SELECT COALESCE(SUM(kilograms),0)::float AS total
       FROM waste_entries
       ${whereClause}`
    );
    const total = totalQ.rows[0].total;

    const byCatQ = await pool.query(
      `SELECT category, COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${whereClause}
       GROUP BY category
       ORDER BY category`
    );

    const byBrgyQ = await pool.query(
      `SELECT barangay, COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${whereClause}
       GROUP BY barangay
       ORDER BY barangay`
    );

    let periodData = [];
    if (period === 'week') {
      const dayQ = await pool.query(
        `SELECT EXTRACT(DOW FROM created_at) AS day_num,
                TO_CHAR(created_at, 'Day') AS day_name,
                COALESCE(SUM(kilograms),0)::float AS kg
         FROM waste_entries
         ${whereClause}
         GROUP BY EXTRACT(DOW FROM created_at), TO_CHAR(created_at, 'Day')
         ORDER BY day_num`
      );
      periodData = dayQ.rows.map(r => ({
        label: r.day_name.trim(),
        kg: r.kg
      }));
    } 
    else if (period === 'month') {
      const weekQ = await pool.query(
        `SELECT week_of_month AS week, COALESCE(SUM(kilograms),0)::float AS kg
         FROM waste_entries
         ${whereClause}
         GROUP BY week_of_month
         ORDER BY week_of_month`
      );
      periodData = weekQ.rows.map(r => ({
        label: `Week ${r.week}`,
        kg: r.kg
      }));
    } 
    else if (period === 'year') {
      const monthQ = await pool.query(
        `SELECT EXTRACT(MONTH FROM created_at) AS month_num,
                TO_CHAR(created_at, 'Mon') AS month_name,
                COALESCE(SUM(kilograms),0)::float AS kg
         FROM waste_entries
         ${whereClause}
         GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Mon')
         ORDER BY month_num`
      );
      periodData = monthQ.rows.map(r => ({
        label: r.month_name,
        kg: r.kg
      }));
    }

    const kpiSumQ = await pool.query(
      `SELECT
         COALESCE(SUM(complaints),0)::int AS complaints_total,
         COALESCE(SUM(solved),0)::int AS solved_total
       FROM kpi_daily
       ${kpiWhereClause}`
    );
    const kpiTotals = kpiSumQ.rows[0] || { complaints_total: 0, solved_total: 0 };

    const usersQuery = barangay 
      ? `SELECT COUNT(id)::int AS count FROM users WHERE location = $1`
      : `SELECT COUNT(id)::int AS count FROM users`;
    const usersParams = barangay ? [barangay] : [];
    const usersQ = await pool.query(usersQuery, usersParams);
    const users_count = usersQ.rows[0]?.count || 0;

    res.json({
      total,
      byCategory: byCatQ.rows,
      byBarangay: byBrgyQ.rows,
      byPeriod: periodData,
      kpis: {
        complaints_total: kpiTotals.complaints_total,
        solved_total: kpiTotals.solved_total,
        users_count
      },
      period,
      periodDetails: { year, month, week }
    });
  } catch (e) {
    console.error('Analytics summary error:', e);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
};

// Get available periods
exports.getPeriods = async (req, res) => {
  try {
    const yearsQ = await pool.query(
      `SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS year
       FROM waste_entries
       ORDER BY year DESC`
    );
    
    const currentYear = new Date().getFullYear();
    const monthsQ = await pool.query(
      `SELECT DISTINCT EXTRACT(MONTH FROM created_at)::int AS month
       FROM waste_entries
       WHERE EXTRACT(YEAR FROM created_at) = $1
       ORDER BY month DESC`,
      [currentYear]
    );
    
    res.json({
      years: yearsQ.rows.map(r => r.year),
      months: monthsQ.rows.map(r => r.month),
      currentYear,
      currentMonth: new Date().getMonth() + 1,
      currentWeek: Math.ceil(((new Date() - new Date(currentYear, 0, 1)) / 86400000 + new Date(currentYear, 0, 1).getDay() + 1) / 7)
    });
  } catch (e) {
    console.error('Analytics periods error:', e);
    res.status(500).json({ error: 'Failed to load periods' });
  }
};

// Stats endpoints
exports.getTotalComplaints = async (req, res) => {
  try {
    const { barangay } = req.query;
    const query = barangay
      ? 'SELECT COUNT(*) as total FROM total_approved_posts WHERE location = $1'
      : 'SELECT COUNT(*) as total FROM total_approved_posts';
    const params = barangay ? [barangay] : [];
    const result = await pool.query(query, params);
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (err) {
    console.error('❌ Error fetching total complaints:', err);
    res.status(500).json({ error: 'Failed to fetch total complaints' });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const { barangay } = req.query;
    const query = barangay
      ? 'SELECT COUNT(*) as complaints FROM pendings WHERE location = $1'
      : 'SELECT COUNT(*) as complaints FROM approved_posts';
    const params = barangay ? [barangay] : [];
    const result = await pool.query(query, params);
    res.json({ complaints: parseInt(result.rows[0].complaints) });
  } catch (err) {
    console.error('❌ Error fetching complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

exports.getSolved = async (req, res) => {
  try {
    const { barangay } = req.query;
    const query = barangay
      ? 'SELECT COUNT(*) as solved FROM solved_posts WHERE location = $1'
      : 'SELECT COUNT(*) as solved FROM solved_posts';
    const params = barangay ? [barangay] : [];
    const result = await pool.query(query, params);
    res.json({ solved: parseInt(result.rows[0].solved) });
  } catch (err) {
    console.error('❌ Error fetching solved:', err);
    res.status(500).json({ error: 'Failed to fetch solved' });
  }
};

// Export waste entries
exports.exportWasteEntries = async (req, res) => {
  try {
    const { barangay } = req.query;
    
    let query = `
      SELECT id, category, kilograms, barangay, week_of_month, created_at, purok
      FROM waste_entries
    `;
    
    const params = [];
    
    if (barangay) {
      query += ' WHERE barangay = $1';
      params.push(barangay);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 1000';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching waste entries for export:', error);
    res.status(500).json({ error: 'Failed to fetch waste entries' });
  }
};