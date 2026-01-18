import express from "express";
import {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
} from "../controllers/habit.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getHabits);
router.get("/:id", getHabit);
router.post("/", createHabit);
router.put("/:id", updateHabit);
router.delete("/:id", deleteHabit);
router.patch("/:id/toggle-completion", toggleHabitCompletion);

export default router;
