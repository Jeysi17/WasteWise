import express from "express";
import { registerDevice, getNotificationHistory, getNotificationsByBarangay, getNotificationsByUser } from "../controllers/notificationController.js";

const router = express.Router();

router.post("/register-device", registerDevice);
router.get("/history/:userId", getNotificationHistory);
router.get("/by-barangay", getNotificationsByBarangay); // New endpoint
router.get("/personal", getNotificationsByUser);

export default router;