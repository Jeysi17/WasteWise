import express from "express";
import { createPending, getUserSummary,getPostsByStatus } from "../controllers/postController.js";
const router = express.Router();

router.post("/pending", createPending);
router.get("/summary/:name", getUserSummary);
router.get("/:email/:status", getPostsByStatus);

export default router;
