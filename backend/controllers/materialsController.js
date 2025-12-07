import pool from "../config/db.js";

export const getAllMaterials = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM materials ORDER BY created_at DESC;`
    );
    
    const materialsWithButtonText = result.rows.map(material => {
      let buttonText = 'Open';
      
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