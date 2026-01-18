import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Habit name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekdays", "weekly"],
      default: "daily",
    },
    timeOfDay: {
      type: String,
      enum: ["morning", "afternoon", "evening", "anytime"],
      default: "anytime",
    },
    goalType: {
      type: String,
      enum: ["none", "monthly", "yearly", "custom"],
      default: "none",
    },
    goalTarget: {
      type: Number,
      default: null,
    },
    goalDate: {
      type: Date,
      default: null,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    completions: {
      type: Number,
      default: 0,
    },
    completionHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        completed: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
habitSchema.index({ userId: 1, createdAt: -1 });
habitSchema.index({ userId: 1, "completionHistory.date": 1 });

export const Habit = mongoose.model("Habit", habitSchema);
