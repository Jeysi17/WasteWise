import express from 'express';
import { getAllMaterials }from '../controllers/materialsController.js';

const router = express.Router();

router.get('/', getAllMaterials);
export default router;