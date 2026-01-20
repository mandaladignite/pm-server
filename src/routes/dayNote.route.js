import express from "express";
import {
  getDayNote,
  upsertDayNote,
  deleteDayNote,
} from "../controllers/dayNote.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getDayNote);
router.post("/", upsertDayNote);
router.put("/", upsertDayNote);
router.delete("/", deleteDayNote);

export default router;
