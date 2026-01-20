import { Task } from "../models/task.model.js";
import { DayNote } from "../models/dayNote.model.js";

// Helper function to check if a date matches a recurring pattern
const matchesRecurringPattern = (date, parentDate, pattern) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const parent = new Date(parentDate);
  parent.setHours(0, 0, 0, 0);

  if (targetDate <= parent) return false; // Don't create instances before parent date

  const daysDiff = Math.floor((targetDate - parent) / (1000 * 60 * 60 * 24));
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday

  if (pattern.frequency === "daily") {
    return daysDiff > 0 && daysDiff % pattern.interval === 0;
  } else if (pattern.frequency === "weekdays") {
    // Monday to Friday (1-5)
    if (dayOfWeek < 1 || dayOfWeek > 5) return false;
    // Count weekdays from parent to target
    let weekdayCount = 0;
    const checkDate = new Date(parent);
    checkDate.setDate(checkDate.getDate() + 1); // Start from next day
    while (checkDate <= targetDate) {
      const checkDay = checkDate.getDay();
      if (checkDay >= 1 && checkDay <= 5) {
        weekdayCount++;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    // Check if it's a multiple of interval weeks (5 weekdays per week)
    return weekdayCount > 0 && weekdayCount % (pattern.interval * 5) === 0;
  } else if (pattern.frequency === "weekly") {
    if (!pattern.daysOfWeek || !pattern.daysOfWeek.includes(dayOfWeek)) return false;
    const weeksDiff = Math.floor(daysDiff / 7);
    return weeksDiff > 0 && weeksDiff % pattern.interval === 0;
  } else if (pattern.frequency === "monthly") {
    if (targetDate.getDate() !== parent.getDate()) return false;
    const monthsDiff = (targetDate.getFullYear() - parent.getFullYear()) * 12 + 
                       (targetDate.getMonth() - parent.getMonth());
    return monthsDiff > 0 && monthsDiff % pattern.interval === 0;
  }

  return false;
};

// Helper function to generate recurring task instances for a specific date
const generateRecurringInstancesForDate = async (userId, targetDate) => {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find all recurring parent tasks
  const recurringTasks = await Task.find({
    userId,
    isRecurring: true,
    date: { $lte: endOfDay }, // Parent task date should be before or equal to target date
  });

  const generatedInstances = [];

  for (const parentTask of recurringTasks) {
    if (!parentTask.repeatPattern) continue;

    const pattern = parentTask.repeatPattern;
    const parentDate = new Date(parentTask.date);
    parentDate.setHours(0, 0, 0, 0);

    // Check if endDate has passed
    if (pattern.endDate && new Date(pattern.endDate) < startOfDay) {
      continue;
    }

    // Check if this date matches the pattern
    if (matchesRecurringPattern(startOfDay, parentDate, pattern)) {
      // Check if instance already exists
      const existingTask = await Task.findOne({
        userId,
        parentTaskId: parentTask._id,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (!existingTask) {
        const instanceData = {
          userId: parentTask.userId,
          title: parentTask.title,
          description: parentTask.description,
          date: new Date(startOfDay),
          type: parentTask.type,
          quantity: parentTask.quantity,
          value: parentTask.value,
          completed: false,
          isRecurring: false,
          parentTaskId: parentTask._id,
          priority: parentTask.priority,
          tags: parentTask.tags,
          reminder: parentTask.reminder,
          duration: parentTask.duration,
        };

        const instance = await Task.create(instanceData);
        generatedInstances.push(instance);
      }
    }
  }

  return generatedInstances;
};

// Get daily planner with tasks
export const getDailyPlanner = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const taskDate = new Date(date);
    const startOfDay = new Date(taskDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(taskDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Generate recurring task instances for this date if needed
    await generateRecurringInstancesForDate(userId, taskDate);

    // Get all tasks for this date
    const tasks = await Task.find({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ createdAt: -1 });

    // Get day note for this date
    const dayNote = await DayNote.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    res.status(200).json({
      success: true,
      date: startOfDay.toISOString(),
      tasks: tasks.map((task) => ({
        _id: task._id.toString(),
        title: task.title,
        description: task.description || "",
        date: task.date ? new Date(task.date).toISOString() : null,
        type: task.type,
        quantity: task.quantity !== null && task.quantity !== undefined ? task.quantity : null,
        value: task.value !== null && task.value !== undefined ? task.value : null,
        completed: task.completed || false,
        completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
        createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
        updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
        isRecurring: task.isRecurring || false,
        repeatPattern: task.repeatPattern || null,
        parentTaskId: task.parentTaskId ? task.parentTaskId.toString() : null,
        priority: task.priority || "medium",
        tags: task.tags || [],
        reminder: task.reminder || { enabled: false, reminderTime: null },
        duration: task.duration || null,
      })),
      dayNote: dayNote
        ? {
            _id: dayNote._id.toString(),
            date: dayNote.date.toISOString(),
            note: dayNote.note || "",
            reflection: dayNote.reflection || "",
            createdAt: dayNote.createdAt.toISOString(),
            updatedAt: dayNote.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};
