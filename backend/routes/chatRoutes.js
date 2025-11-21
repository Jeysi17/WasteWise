import express from "express";
import { chatWithBot, testChipExtraction } from "../controllers/chatController.js";

const router = express.Router();

// Main chat endpoint
router.post("/", chatWithBot);

// Test endpoint for debugging chip extraction
router.post("/test", testChipExtraction);

export default router;