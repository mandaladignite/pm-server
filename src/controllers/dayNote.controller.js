import { DayNote } from "../models/dayNote.model.js";

// Get day note for a specific date
export const getDayNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const noteDate = new Date(date);
    const startOfDay = new Date(noteDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(noteDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayNote = await DayNote.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!dayNote) {
      return res.status(200).json({
        success: true,
        dayNote: null,
      });
    }

    res.status(200).json({
      success: true,
      dayNote: {
        _id: dayNote._id.toString(),
        userId: dayNote.userId.toString(),
        date: dayNote.date.toISOString(),
        note: dayNote.note || "",
        reflection: dayNote.reflection || "",
        createdAt: dayNote.createdAt.toISOString(),
        updatedAt: dayNote.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create or update day note
export const upsertDayNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date, note, reflection } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const noteDate = new Date(date);
    const startOfDay = new Date(noteDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(noteDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing note for this date
    const existingNote = await DayNote.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    let dayNote;

    if (existingNote) {
      // Update existing note
      if (note !== undefined) existingNote.note = note || "";
      if (reflection !== undefined) existingNote.reflection = reflection || "";
      await existingNote.save();
      dayNote = existingNote;
    } else {
      // Create new note
      dayNote = await DayNote.create({
        userId,
        date: startOfDay,
        note: note || "",
        reflection: reflection || "",
      });
    }

    res.status(200).json({
      success: true,
      message: existingNote ? "Day note updated successfully" : "Day note created successfully",
      dayNote: {
        _id: dayNote._id.toString(),
        userId: dayNote.userId.toString(),
        date: dayNote.date.toISOString(),
        note: dayNote.note || "",
        reflection: dayNote.reflection || "",
        createdAt: dayNote.createdAt.toISOString(),
        updatedAt: dayNote.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete day note
export const deleteDayNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const noteDate = new Date(date);
    const startOfDay = new Date(noteDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(noteDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayNote = await DayNote.findOneAndDelete({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!dayNote) {
      return res.status(404).json({
        success: false,
        message: "Day note not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Day note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
