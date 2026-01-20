import express from "express";
import { getDailyPlanner } from "../controllers/dailyPlanner.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getDailyPlanner);

export default router;
