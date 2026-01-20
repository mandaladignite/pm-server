import express from "express";
import {
  getTasks,
  getTasksByDate,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
} from "../controllers/task.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getTasks);
router.get("/date/:date", getTasksByDate);
router.get("/:id", getTask);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/toggle", toggleTaskCompletion);

export default router;
