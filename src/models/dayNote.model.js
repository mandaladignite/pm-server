import mongoose from "mongoose";

const dayNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    reflection: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one note per user per day
dayNoteSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DayNote = mongoose.model("DayNote", dayNoteSchema);
