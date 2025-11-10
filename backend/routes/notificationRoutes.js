import express from "express";
import { registerDevice } from "../controllers/notificationController.js";
const router = express.Router();

router.post("/register-device", registerDevice);
export default router;
