import pool from "../config/db.js";

export const getAllMaterials = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM materials ORDER BY created_at DESC;`
    );
    
    const materialsWithButtonText = result.rows.map(material => {
      let buttonText = 'Read More';
      
      if (material.link_url) {
        const link = material.link_url.toLowerCase();
        
        if (link.includes('youtube.com') || link.includes('youtu.be')) {
          buttonText = 'Watch Now';
        } else if (
          link.includes('.pdf') || 
          link.includes('article') || 
          link.includes('blog') ||
          link.includes('read')
        ) {
          buttonText = 'Read More';
        } else if (
          link.includes('.jpg') || 
          link.includes('.jpeg') || 
          link.includes('.png') ||
          link.includes('.gif')
        ) {
          buttonText = 'View Image';
        }
      }
      
      if (material.thumbnail_path && !material.link_url) {
        buttonText = 'View Slogan';
      }
      
      return {
        ...material,
        button_text: buttonText
      };
    });
    
    res.json(materialsWithButtonText);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch materials" });
  }
};

// 🆕 Get a random article from materials table
export const getRandomMaterial = async (req, res) => {
  try {
    // Method 1: Using PostgreSQL's RANDOM() function (more efficient for large datasets)
    const result = await pool.query(
      `SELECT id, title, link_url, thumbnail_path, created_at 
       FROM materials 
       ORDER BY RANDOM() 
       LIMIT 1`
    );
    
    // Alternative Method 2: For better performance with very large tables
    // const countResult = await pool.query('SELECT COUNT(*) FROM materials');
    // const totalCount = parseInt(countResult.rows[0].count);
    
    // if (totalCount === 0) {
    //   return res.status(404).json({ message: 'No materials found' });
    // }
    
    // const randomOffset = Math.floor(Math.random() * totalCount);
    // const result = await pool.query(
    //   'SELECT id, title, link_url, thumbnail_path, created_at FROM materials ORDER BY id LIMIT 1 OFFSET $1',
    //   [randomOffset]
    // );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No materials found' });
    }
    
    const material = result.rows[0];
    
    // Add button_text similar to getAllMaterials
    let buttonText = 'Read More';
    if (material.link_url) {
      const link = material.link_url.toLowerCase();
      
      if (link.includes('youtube.com') || link.includes('youtu.be')) {
        buttonText = 'Watch Now';
      } else if (
        link.includes('.pdf') || 
        link.includes('article') || 
        link.includes('blog') ||
        link.includes('read')
      ) {
        buttonText = 'Read More';
      } else if (
        link.includes('.jpg') || 
        link.includes('.jpeg') || 
        link.includes('.png') ||
        link.includes('.gif')
      ) {
        buttonText = 'View Image';
      }
    }
    
    if (material.thumbnail_path && !material.link_url) {
      buttonText = 'View Slogan';
    }
    
    res.json({
      ...material,
      button_text: buttonText
    });
    
  } catch (err) {
    console.error('Error fetching random material:', err);
    res.status(500).json({ 
      error: "Failed to fetch random material",
      details: err.message 
    });
  }
};