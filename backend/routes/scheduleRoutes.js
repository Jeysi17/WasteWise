import express from "express";
import { getSchedules, getLatestSchedule } from "../controllers/scheduleController.js";
const router = express.Router();

router.get("/", getSchedules);
router.get("/latest", getLatestSchedule);
export default router;
