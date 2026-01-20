import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Task date is required"],
      index: true,
    },
    type: {
      type: String,
      enum: ["binary", "count", "value"],
      required: [true, "Task type is required"],
    },
    // For count-based tasks
    quantity: {
      type: Number,
      default: null,
      validate: {
        validator: function (value) {
          // Only validate if type is valid and is "count"
          if (this.type === "count") {
            return value !== null && value !== undefined && value > 0;
          }
          // For other types, quantity must be null
          return value === null || value === undefined;
        },
        message: "Quantity is required and must be greater than 0 for count-based tasks",
      },
    },
    // For value-based tasks
    value: {
      type: Number,
      default: null,
      validate: {
        validator: function (value) {
          // Only validate if type is valid and is "value"
          if (this.type === "value") {
            return value !== null && value !== undefined;
          }
          // For other types, value must be null
          return value === null || value === undefined;
        },
        message: "Value is required for value-based tasks",
      },
    },
    // Completion status
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Recurring task configuration
    isRecurring: {
      type: Boolean,
      default: false,
      index: true,
    },
    repeatPattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekdays", "weekly", "monthly"],
        default: null,
      },
      interval: {
        type: Number,
        default: 1, // Every N days/weeks/months
        min: 1,
      },
      endDate: {
        type: Date,
        default: null,
      },
      daysOfWeek: {
        type: [Number], // For weekly: [0-6] (Sunday-Saturday)
        default: null,
        validate: {
          validator: function (value) {
            if (!value || value.length === 0) return true;
            return value.every((day) => day >= 0 && day <= 6);
          },
          message: "Days of week must be between 0 (Sunday) and 6 (Saturday)",
        },
      },
    },
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    // Other options
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: false,
      },
      reminderTime: {
        type: Date,
        default: null,
      },
    },
    duration: {
      type: Number, // Duration in minutes
      default: null,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
taskSchema.index({ userId: 1, date: 1 });
taskSchema.index({ userId: 1, date: -1, completed: 1 });
taskSchema.index({ userId: 1, isRecurring: 1, parentTaskId: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ parentTaskId: 1 });

// Method to get contribution amount for goal progress
taskSchema.methods.getContribution = function () {
  if (!this.completed) {
    return 0;
  }
  
  if (this.type === "binary") {
    return 1;
  } else if (this.type === "count") {
    return this.quantity || 0;
  } else if (this.type === "value") {
    return this.value || 0;
  }
  
  return 0;
};

export const Task = mongoose.model("Task", taskSchema);
