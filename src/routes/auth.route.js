import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getCurrentUser);

export default router;
