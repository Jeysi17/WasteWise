const pool = require('../config/database.js');

// CENRO-specific analytics (across all barangays)
exports.getCenroAnalytics = async (req, res) => {
  try {
    const { period = 'month', year, month, week } = req.query;
    
    // Build dynamic WHERE clause based on period
    let whereClause = '';
    let kpiWhereClause = '';
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (period === 'week') {
      const startOfYear = new Date(currentYear, 0, 1);
      const weekNum = Math.ceil(((currentDate - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      const targetWeek = week || weekNum;
      const targetYear = year || currentYear;
      
      whereClause = `WHERE EXTRACT(YEAR FROM created_at) = ${targetYear} 
                     AND EXTRACT(WEEK FROM created_at) = ${targetWeek}`;
      kpiWhereClause = `WHERE EXTRACT(YEAR FROM kpi_date) = ${targetYear} 
                        AND EXTRACT(WEEK FROM kpi_date) = ${targetWeek}`;
    } 
    else if (period === 'month') {
      const targetMonth = month || currentMonth;
      const targetYear = year || currentYear;
      
      whereClause = `WHERE EXTRACT(YEAR FROM created_at) = ${targetYear} 
                     AND EXTRACT(MONTH FROM created_at) = ${targetMonth}`;
      kpiWhereClause = `WHERE EXTRACT(YEAR FROM kpi_date) = ${targetYear} 
                        AND EXTRACT(MONTH FROM kpi_date) = ${targetMonth}`;
    } 
    else if (period === 'year') {
      const targetYear = year || currentYear;
      
      whereClause = `WHERE EXTRACT(YEAR FROM created_at) = ${targetYear}`;
      kpiWhereClause = `WHERE EXTRACT(YEAR FROM kpi_date) = ${targetYear}`;
    }

    // Total waste across all barangays
    const totalQ = await pool.query(
      `SELECT COALESCE(SUM(kilograms),0)::float AS total
       FROM waste_entries
       ${whereClause}`
    );
    const total = totalQ.rows[0].total;

    // Waste by category across all barangays
    const byCatQ = await pool.query(
      `SELECT category, COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${whereClause}
       GROUP BY category
       ORDER BY category`
    );

    // Waste by barangay
    const byBrgyQ = await pool.query(
      `SELECT barangay, COALESCE(SUM(kilograms),0)::float AS kg
       FROM waste_entries
       ${whereClause}
       GROUP BY barangay
       ORDER BY barangay`
    );

    // Period data (week/month/year breakdown)
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

    // KPIs across all barangays
    const kpiSumQ = await pool.query(
      `SELECT
         COALESCE(SUM(complaints),0)::int AS complaints_total,
         COALESCE(SUM(solved),0)::int AS solved_total
       FROM kpi_daily
       ${kpiWhereClause}`
    );
    const kpiTotals = kpiSumQ.rows[0] || { complaints_total: 0, solved_total: 0 };

    // Total users across all barangays
    const usersQ = await pool.query('SELECT COUNT(id)::int AS count FROM users');
    const users_count = usersQ.rows[0]?.count || 0;

    // Barangay performance ranking
    const barangayPerformanceQ = await pool.query(
      `SELECT 
         barangay,
         COALESCE(SUM(kilograms),0)::float AS total_waste,
         (SELECT COUNT(*) FROM pendings WHERE location = barangay) AS pending_complaints,
         (SELECT COUNT(*) FROM solved_posts WHERE location = barangay) AS solved_complaints
       FROM waste_entries
       ${whereClause}
       GROUP BY barangay
       ORDER BY total_waste DESC`
    );

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
      barangayPerformance: barangayPerformanceQ.rows,
      period,
      periodDetails: { year, month, week }
    });
  } catch (e) {
    console.error('CENRO analytics error:', e);
    res.status(500).json({ error: 'Failed to load CENRO analytics' });
  }
};

// CENRO dashboard stats
exports.getCenroDashboardStats = async (req, res) => {
  try {
    // Total pending complaints across all barangays
    const pendingResult = await pool.query('SELECT COUNT(*) as total FROM pendings');
    
    // Total approved posts (forwarded to CENRO)
    const approvedResult = await pool.query('SELECT COUNT(*) as total FROM approved_posts');
    
    // Total solved posts across all barangays
    const solvedResult = await pool.query('SELECT COUNT(*) as total FROM solved_posts');
    
    // Total users across all barangays
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    
    // Recent activity (last 7 days)
    const recentActivityQ = await pool.query(`
      SELECT 'pending' as type, COUNT(*) as count FROM pendings WHERE created_at >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 'approved' as type, COUNT(*) as count FROM approved_posts WHERE approved_at >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 'solved' as type, COUNT(*) as count FROM solved_posts WHERE solved_at >= NOW() - INTERVAL '7 days'
    `);

    const recentActivity = {};
    recentActivityQ.rows.forEach(row => {
      recentActivity[row.type] = parseInt(row.count);
    });

    // Barangay-wise complaint summary
    const barangaySummaryQ = await pool.query(`
      SELECT 
        location as barangay,
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status LIKE '%Solved%' THEN 1 ELSE 0 END) as solved_complaints
      FROM solved_posts 
      GROUP BY location 
      ORDER BY total_complaints DESC
      LIMIT 10
    `);

    res.json({
      overview: {
        pending_complaints: parseInt(pendingResult.rows[0].total) || 0,
        approved_posts: parseInt(approvedResult.rows[0].total) || 0,
        solved_complaints: parseInt(solvedResult.rows[0].total) || 0,
        total_users: parseInt(usersResult.rows[0].total) || 0
      },
      recent_activity: recentActivity,
      top_barangays: barangaySummaryQ.rows
    });
  } catch (err) {
    console.error('❌ Error fetching CENRO dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch CENRO dashboard stats' });
  }
};

// CENRO waste management overview
exports.getWasteManagementOverview = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    
    let dateFilter = '';
    switch (timeframe) {
      case 'week':
        dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND created_at >= NOW() - INTERVAL '1 year'";
        break;
    }

    // Total waste collected
    const totalWasteQ = await pool.query(`
      SELECT COALESCE(SUM(kilograms),0)::float AS total_kg
      FROM waste_entries
      WHERE 1=1 ${dateFilter}
    `);

    // Waste by category
    const wasteByCategoryQ = await pool.query(`
      SELECT category, COALESCE(SUM(kilograms),0)::float AS kg
      FROM waste_entries
      WHERE 1=1 ${dateFilter}
      GROUP BY category
      ORDER BY kg DESC
    `);

    // Top performing barangays (most waste collected)
    const topBarangaysQ = await pool.query(`
      SELECT barangay, COALESCE(SUM(kilograms),0)::float AS total_kg
      FROM waste_entries
      WHERE 1=1 ${dateFilter}
      GROUP BY barangay
      ORDER BY total_kg DESC
      LIMIT 5
    `);

    // Waste collection trends (last 6 months)
    const trendsQ = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COALESCE(SUM(kilograms),0)::float AS total_kg
      FROM waste_entries
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `);

    res.json({
      total_waste: totalWasteQ.rows[0]?.total_kg || 0,
      waste_by_category: wasteByCategoryQ.rows,
      top_barangays: topBarangaysQ.rows,
      trends: trendsQ.rows.reverse(), // Reverse to show chronological order
      timeframe
    });
  } catch (err) {
    console.error('❌ Error fetching waste management overview:', err);
    res.status(500).json({ error: 'Failed to fetch waste management overview' });
  }
};

// CENRO complaint management overview
exports.getComplaintManagementOverview = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    
    let dateFilter = '';
    switch (timeframe) {
      case 'week':
        dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND created_at >= NOW() - INTERVAL '1 year'";
        break;
    }

    // Complaint statistics
    const complaintStatsQ = await pool.query(`
      SELECT 
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status LIKE '%Solved%' THEN 1 ELSE 0 END) as solved_complaints,
        SUM(CASE WHEN status LIKE '%Forwarded%' THEN 1 ELSE 0 END) as forwarded_complaints
      FROM (
        SELECT id, status, created_at FROM pendings WHERE 1=1 ${dateFilter}
        UNION ALL
        SELECT id, status, approved_at as created_at FROM approved_posts WHERE 1=1 ${dateFilter}
        UNION ALL
        SELECT id, status, solved_at as created_at FROM solved_posts WHERE 1=1 ${dateFilter}
      ) AS all_complaints
    `);

    // Complaints by barangay
    const complaintsByBarangayQ = await pool.query(`
      SELECT 
        location as barangay,
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status LIKE '%Solved%' THEN 1 ELSE 0 END) as solved_complaints
      FROM solved_posts
      WHERE 1=1 ${dateFilter}
      GROUP BY location
      ORDER BY total_complaints DESC
    `);

    // Resolution time analysis
    const resolutionTimeQ = await pool.query(`
      SELECT 
        location as barangay,
        AVG(EXTRACT(EPOCH FROM (solved_at - created_at))/86400)::numeric(10,2) as avg_resolution_days
      FROM solved_posts
      WHERE solved_at IS NOT NULL AND created_at IS NOT NULL ${dateFilter}
      GROUP BY location
      ORDER BY avg_resolution_days DESC
    `);

    // Monthly complaint trends
    const monthlyTrendsQ = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as complaint_count
      FROM (
        SELECT created_at FROM pendings WHERE 1=1 ${dateFilter}
        UNION ALL
        SELECT approved_at as created_at FROM approved_posts WHERE 1=1 ${dateFilter}
        UNION ALL
        SELECT solved_at as created_at FROM solved_posts WHERE 1=1 ${dateFilter}
      ) AS all_complaints
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `);

    const stats = complaintStatsQ.rows[0] || {
      total_complaints: 0,
      solved_complaints: 0,
      forwarded_complaints: 0
    };

    res.json({
      statistics: {
        total_complaints: parseInt(stats.total_complaints) || 0,
        solved_complaints: parseInt(stats.solved_complaints) || 0,
        forwarded_complaints: parseInt(stats.forwarded_complaints) || 0,
        resolution_rate: stats.total_complaints > 0 ? 
          ((parseInt(stats.solved_complaints) / parseInt(stats.total_complaints)) * 100).toFixed(2) : 0
      },
      by_barangay: complaintsByBarangayQ.rows,
      resolution_times: resolutionTimeQ.rows,
      monthly_trends: monthlyTrendsQ.rows.reverse(),
      timeframe
    });
  } catch (err) {
    console.error('❌ Error fetching complaint management overview:', err);
    res.status(500).json({ error: 'Failed to fetch complaint management overview' });
  }
};

// CENRO user management overview
exports.getUserManagementOverview = async (req, res) => {
  try {
    // Total users by barangay
    const usersByBarangayQ = await pool.query(`
      SELECT location as barangay, COUNT(*) as user_count
      FROM users
      GROUP BY location
      ORDER BY user_count DESC
    `);

    // Barangay admin statistics
    const barangayAdminsQ = await pool.query(`
      SELECT barangay, COUNT(*) as admin_count
      FROM barangay_admins
      GROUP BY barangay
      ORDER BY admin_count DESC
    `);

    // User growth (last 6 months)
    const userGrowthQ = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `);

    // Active barangays (with recent activity)
    const activeBarangaysQ = await pool.query(`
      SELECT 
        location as barangay,
        COUNT(DISTINCT user_id) as active_users,
        MAX(created_at) as last_activity
      FROM (
        SELECT location, user_id, created_at FROM pendings 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT location, user_id, approved_at as created_at FROM approved_posts 
        WHERE approved_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT location, user_id, solved_at as created_at FROM solved_posts 
        WHERE solved_at >= NOW() - INTERVAL '30 days'
      ) AS recent_activity
      GROUP BY location
      ORDER BY active_users DESC
    `);

    res.json({
      users_by_barangay: usersByBarangayQ.rows,
      barangay_admins: barangayAdminsQ.rows,
      user_growth: userGrowthQ.rows.reverse(),
      active_barangays: activeBarangaysQ.rows
    });
  } catch (err) {
    console.error('❌ Error fetching user management overview:', err);
    res.status(500).json({ error: 'Failed to fetch user management overview' });
  }
};

// CENRO export data
exports.exportCenroData = async (req, res) => {
  try {
    const { data_type, barangay, start_date, end_date } = req.query;
    
    let query = '';
    let params = [];
    
    switch (data_type) {
      case 'waste_entries':
        query = `
          SELECT id, category, kilograms, barangay, week_of_month, created_at, purok
          FROM waste_entries
          WHERE 1=1
        `;
        break;
      case 'complaints':
        query = `
          SELECT id, name, title, details, location, post_date, status
          FROM (
            SELECT id, name, title, details, location, post_date, status FROM pendings
            UNION ALL
            SELECT id, name, title, details, location, post_date, status FROM approved_posts
            UNION ALL
            SELECT id, name, title, details, location, post_date, status FROM solved_posts
          ) AS all_complaints
          WHERE 1=1
        `;
        break;
      case 'schedules':
        query = `
          SELECT id, barangay, zone_number, schedule_date, completed, created_at
          FROM schedules
          WHERE 1=1
        `;
        break;
      default:
        return res.status(400).json({ error: 'Invalid data_type' });
    }

    // Add filters
    if (barangay && barangay !== 'all') {
      query += ' AND barangay = $1';
      params.push(barangay);
    }

    if (start_date) {
      const paramIndex = params.length + 1;
      query += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
    }

    if (end_date) {
      const paramIndex = params.length + 1;
      query += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
    }

    query += ' ORDER BY created_at DESC LIMIT 5000';

    const result = await pool.query(query, params);
    
    res.json({
      data: result.rows,
      metadata: {
        data_type,
        barangay: barangay || 'all',
        start_date: start_date || 'all',
        end_date: end_date || 'all',
        record_count: result.rows.length,
        exported_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error exporting CENRO data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};