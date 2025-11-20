const pool = require('../config/database.js');
const { sendExpoNotification } = require('../utils/notifications.js');
const { saveNotificationToDB } = require('./notificationsController.js');

// Get all pending posts
exports.getPendings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pendings');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Query error:', error);
    res.status(500).json({ error: 'Failed to fetch data from pendings' });
  }
};

// Create new pending post with image upload
exports.createPending = async (req, res) => {
  try {
    const { name, title, details, location, category } = req.body;
    const imageFile = req.file;

    console.log('📤 Received upload request:', { name, title, location, hasImage: !!imageFile });

    let imagePath = null;
    if (imageFile) {
      imagePath = `/uploads/${imageFile.filename}`;
      console.log('✅ Image saved:', imagePath, 'at:', imageFile.path);
    } else if (req.body.image) {
      imagePath = req.body.image;
      console.log('📝 Using provided image path:', imagePath);
    }

    const id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const postDate = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO pendings (id, name, title, image, details, location, post_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [id, name, title, imagePath, details, location, postDate]
    );

    console.log('✅ Post created with ID:', result.rows[0].id);
    res.json({ 
      message: 'Post created successfully', 
      id: result.rows[0].id,
      image: imagePath 
    });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
};

// Approve post (Barangay Admin)
exports.approvePost = async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🔵 Starting approval process for ID:', id);

    const selectResult = await client.query('SELECT * FROM pendings WHERE id = $1', [id]);
    const post = selectResult.rows[0];

    if (!post) {
      await client.query('ROLLBACK');
      console.log('❌ Post not found in pendings');
      return res.status(404).json({ error: 'Post not found in pendings' });
    }

    const updatedStatus = post.location
      ? `Forwarded to Cenro by ${post.location}`
      : 'Forwarded to Cenro by';

    await client.query('UPDATE pendings SET status = $1 WHERE id = $2', [updatedStatus, id]);

    await client.query(`
      INSERT INTO approved_posts 
      (id, user_id, name, title, image, details, location, post_date, approved_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      ON CONFLICT (id) DO NOTHING
    `, [
      post.id, post.user_id, post.name, post.title, post.image, 
      post.details, post.location, post.post_date, updatedStatus
    ]);

    await client.query(`
      INSERT INTO total_approved_posts (id, name, title, image, details, location, post_date, approved_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      post.id, post.name, post.title, post.image, 
      post.details, post.location, post.post_date
    ]);

    await client.query('DELETE FROM pendings WHERE id = $1', [id]);

    // Send notification
    const tokenResult = await client.query(
      'SELECT expo_push_token FROM user_devices WHERE user_id = $1 AND expo_push_token IS NOT NULL',
      [post.user_id]
    );

    const tokens = tokenResult.rows.map(r => r.expo_push_token).filter(token => token);

    console.log(`📱 Found ${tokens.length} tokens for user_id ${post.user_id}`);

    if (tokens.length > 0) {
      const title = 'Your Complaint has been forwarded to CENRO!';
      const message = `Your complaint "${post.title}" has been approved and forwarded to CENRO.`;
      const data = {
        type: 'post_approved',
        postId: post.id,
        title: post.title,
        location: post.location
      };

      await sendExpoNotification(tokens, title, message, data);
      await saveNotificationToDB(post.user_id, null, title, message, data);
    }

    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');
    res.json({ message: 'Post approved successfully & notification sent' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ FULL Error approving post:', err);
    res.status(500).json({ error: 'Failed to approve post', details: err.message });
  } finally {
    client.release();
  }
};

// Solve pending post with remarks (Barangay)
exports.solvePendingWithRemarks = async (req, res) => {
  const id = req.params.id;
  const { remarks } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🟢 Solving pending post with remarks for ID:', id);

    const selectResult = await client.query('SELECT * FROM pendings WHERE id = $1', [id]);
    const post = selectResult.rows[0];

    if (!post) {
      await client.query('ROLLBACK');
      console.log('❌ Post not found in pendings');
      return res.status(404).json({ error: 'Post not found in pendings' });
    }

    const updatedStatus = post.location ? `Solved by ${post.location}` : 'Solved by unknown';

    await client.query('UPDATE pendings SET status = $1 WHERE id = $2', [updatedStatus, id]);

    await client.query(`
      INSERT INTO total_approved_posts (id, name, title, image, details, location, post_date, approved_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      post.id, post.name, post.title, post.image, 
      post.details, post.location, post.post_date
    ]);

    await client.query(`
      INSERT INTO solved_posts (
        id, name, title, image, details, location, post_date, approved_at, solved_at, remarks, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10)
      ON CONFLICT (id) DO NOTHING
    `, [
      post.id, post.name, post.title, post.image, post.details,
      post.location, post.post_date, post.approved_at, remarks, updatedStatus
    ]);

    await client.query('DELETE FROM pendings WHERE id = $1', [id]);

    const tokenResult = await client.query(
      'SELECT expo_push_token FROM user_devices WHERE user_id = $1 AND expo_push_token IS NOT NULL',
      [post.user_id]
    );

    const tokens = tokenResult.rows.map(r => r.expo_push_token).filter(token => token);

    if (tokens.length > 0) {
      const titleMsg = 'Your complaint has been resolved by the Barangay!';
      const bodyMsg = `Your complaint "${post.title}" has been marked as solved by ${post.location}.`;
      const data = {
        type: 'post_solved',
        postId: post.id,
        title: post.title,
        location: post.location,
        remarks: remarks,
        status: updatedStatus
      };

      await sendExpoNotification(tokens, titleMsg, bodyMsg, data);
      await saveNotificationToDB(post.user_id, null, titleMsg, bodyMsg, data);
    }

    await client.query('COMMIT');
    console.log('✅ Post moved to solved_posts with remarks and notification sent');
    res.json({ message: 'Pending post marked as solved with remarks successfully & notification sent' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error marking pending post as solved with remarks:', err);
    res.status(500).json({ error: 'Failed to mark pending post as solved with remarks', details: err.message });
  } finally {
    client.release();
  }
};

// Solve post (CENRO Admin)
exports.solvePost = async (req, res) => {
  const id = req.params.id;
  const { remarks } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🟢 Starting CENRO solve process for ID:', id);
    
    const selectResult = await client.query('SELECT * FROM approved_posts WHERE id = $1', [id]);
    const post = selectResult.rows[0];
    
    if (!post) {
      await client.query('ROLLBACK');
      console.log('❌ Post not found in approved_posts');
      return res.status(404).json({ error: 'Post not found in approved posts' });
    }

    const updatedStatus = 'Solved by CENRO';
    const finalRemarks = remarks || 'N/A';

    await client.query('UPDATE approved_posts SET status = $1 WHERE id = $2', [updatedStatus, id]);

    await client.query(`
      INSERT INTO solved_posts (
        id, user_id, name, title, image, details, location, post_date, approved_at, solved_at, remarks, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11)
      RETURNING id
    `, [
      post.id, post.user_id, post.name, post.title, post.image,
      post.details, post.location, post.post_date, post.approved_at,
      finalRemarks, updatedStatus
    ]);

    // Send notification if user_id exists
    if (post.user_id) {
      const tokenResult = await client.query(
        'SELECT expo_push_token FROM user_devices WHERE user_id = $1',
        [post.user_id]
      );

      const tokens = tokenResult.rows
        .map(r => r.expo_push_token)
        .filter(token => token && token.trim() !== '');

      if (tokens.length > 0) {
        const titleMsg = 'Your complaint has been resolved by CENRO!';
        const bodyMsg = `Your complaint "${post.title}" has been marked as solved by CENRO.`;
        const data = {
          type: 'post_solved_cenro',
          postId: post.id,
          title: post.title,
          location: post.location,
          remarks: finalRemarks,
          status: updatedStatus
        };

        try {
          await sendExpoNotification(tokens, titleMsg, bodyMsg, data);
          await saveNotificationToDB(post.user_id, null, titleMsg, bodyMsg, data);
        } catch (notifError) {
          console.error('❌ Failed to send notification:', notifError);
        }
      }
    }

    const deleteResult = await client.query('DELETE FROM approved_posts WHERE id = $1 RETURNING id', [id]);
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Post marked as solved',
      notificationSent: post.user_id ? true : false,
      deleted: deleteResult.rowCount > 0
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ FULL Error solving post:', err);
    res.status(500).json({ 
      error: 'Failed to mark post as solved', 
      details: err.message 
    });
  } finally {
    client.release();
  }
};

// Get solved posts
exports.getSolvedPosts = async (req, res) => {
  try {
    const { barangay } = req.query;
    
    let query = 'SELECT * FROM solved_posts';
    const params = [];

    if (barangay) {
      query += ' WHERE location = $1';
      params.push(barangay);
    }
    
    query += ' ORDER BY solved_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching solved posts:', err);
    res.status(500).json({ error: 'Failed to fetch solved posts' });
  }
};

// Get approved posts
exports.getApprovedPosts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM approved_posts ORDER BY approved_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching approved posts:', err);
    res.status(500).json({ error: 'Failed to fetch approved posts' });
  }
};

// Decline post
exports.declinePost = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM pendings WHERE id = $1', [id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('❌ Error declining post:', err);
    res.status(500).json({ error: 'Failed to decline post' });
  }
};