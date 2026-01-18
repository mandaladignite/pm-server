import { Habit } from "../models/habit.model.js";

// Get all habits for a user
export const getHabits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const habits = await Habit.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: habits.length,
      habits,
    });
  } catch (error) {
    next(error);
  }
};

// Get single habit
export const getHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    res.status(200).json({
      success: true,
      habit,
    });
  } catch (error) {
    next(error);
  }
};

// Create habit
export const createHabit = async (req, res, next) => {
  try {
    const {
      name,
      description,
      frequency,
      timeOfDay,
      goalType,
      goalTarget,
      goalDate,
    } = req.body;

    const habit = await Habit.create({
      userId: req.user.id,
      name,
      description: description || "",
      frequency: frequency || "daily",
      timeOfDay: timeOfDay || "anytime",
      goalType: goalType || "none",
      goalTarget: goalType !== "none" ? goalTarget : null,
      goalDate: goalType !== "none" ? goalDate : null,
    });

    res.status(201).json({
      success: true,
      message: "Habit created successfully",
      habit,
    });
  } catch (error) {
    next(error);
  }
};

// Update habit
export const updateHabit = async (req, res, next) => {
  try {
    let habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    // Update fields
    const {
      name,
      description,
      frequency,
      timeOfDay,
      goalType,
      goalTarget,
      goalDate,
    } = req.body;

    if (name) habit.name = name;
    if (description !== undefined) habit.description = description;
    if (frequency) habit.frequency = frequency;
    if (timeOfDay) habit.timeOfDay = timeOfDay;
    if (goalType !== undefined) {
      habit.goalType = goalType;
      habit.goalTarget = goalType !== "none" ? goalTarget : null;
      habit.goalDate = goalType !== "none" ? goalDate : null;
    }

    await habit.save();

    res.status(200).json({
      success: true,
      message: "Habit updated successfully",
      habit,
    });
  } catch (error) {
    next(error);
  }
};

// Delete habit
export const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Habit deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Toggle habit completion for today
export const toggleHabitCompletion = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already completed today
    const todayCompletion = habit.completionHistory.find(
      (entry) =>
        new Date(entry.date).setHours(0, 0, 0, 0) === today.getTime()
    );

    if (todayCompletion) {
      // Remove today's completion
      habit.completionHistory = habit.completionHistory.filter(
        (entry) =>
          new Date(entry.date).setHours(0, 0, 0, 0) !== today.getTime()
      );
      habit.completions = Math.max(0, habit.completions - 1);
      // Recalculate streak
      habit.currentStreak = 0;
    } else {
      // Add today's completion
      habit.completionHistory.push({
        date: today,
        completed: true,
      });
      habit.completions = (habit.completions || 0) + 1;

      // Calculate streak
      const sortedHistory = habit.completionHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .filter((entry) => entry.completed);

      let streak = 0;
      let checkDate = new Date(today);

      for (const entry of sortedHistory) {
        const entryDate = new Date(entry.date).setHours(0, 0, 0, 0);
        const checkDateStart = new Date(checkDate).setHours(0, 0, 0, 0);

        if (entryDate === checkDateStart) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      habit.currentStreak = streak;
      habit.longestStreak = Math.max(habit.longestStreak, streak);
    }

    await habit.save();

    res.status(200).json({
      success: true,
      message: "Habit completion toggled",
      habit,
    });
  } catch (error) {
    next(error);
  }
};
