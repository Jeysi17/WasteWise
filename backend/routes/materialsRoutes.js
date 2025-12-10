// routes/materialsRoutes.js
import express from 'express';
import { getAllMaterials, getRandomMaterial } from '../controllers/materialsController.js';

const router = express.Router();

// Debug middleware to log requests
router.use((req, res, next) => {
  console.log(`📚 Materials route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// GET /api/materials - Get all materials
router.get('/', getAllMaterials);

// GET /api/materials/random - Get a random material
router.get('/random', getRandomMaterial);

export default router;