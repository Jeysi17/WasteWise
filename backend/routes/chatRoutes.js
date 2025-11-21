import express from "express";
import { chatWithBot, testChipExtraction } from "../controllers/chatController.js";

const router = express.Router();

// Main chat endpoint
router.post("/", chatWithBot);

// Test endpoint for debugging chip extraction
router.post("/test", testChipExtraction);

router.get("/debug-env", (req, res) => {
  res.json({
    hasGoogleProjectId: !!process.env.GOOGLE_PROJECT_ID,
    hasGoogleClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
    hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    googleProjectId: process.env.GOOGLE_PROJECT_ID,
    googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length,
    privateKeyStart: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 20) + '...',
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    render: !!process.env.RENDER // Check if running on Render
  });
});

export default router;