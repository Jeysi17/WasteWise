import express from "express";
import { createUser, getUserById, getUserLocation } from "../controllers/userController.js";
const router = express.Router();

router.post("/", createUser);
router.get("/location", getUserLocation);
router.get("/:user_id", getUserById);
export default router;
