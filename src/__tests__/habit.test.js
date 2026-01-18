import request from "supertest";
import { app } from "../app.js";
import { User } from "../models/user.model.js";
import { Habit } from "../models/habit.model.js";

describe("Habit API", () => {
  let authToken;
  let userId;
  let habitId;

  beforeEach(async () => {
    // Create and login user for each test
    const userData = {
      name: "Habit Test User",
      email: `habittest${Date.now()}@example.com`,
      password: "password123",
    };
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(userData);
    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe("POST /api/habits", () => {
    it("should create a new habit successfully", async () => {
      const habitData = {
        name: "Morning Meditation",
        description: "10 minutes daily",
        frequency: "daily",
        timeOfDay: "morning",
        goalType: "monthly",
        goalTarget: 30,
        goalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post("/api/habits")
        .set("Authorization", `Bearer ${authToken}`)
        .send(habitData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.habit.name).toBe(habitData.name);
      expect(response.body.habit.frequency).toBe(habitData.frequency);
      expect(response.body.habit.goalType).toBe(habitData.goalType);
      expect(response.body.habit.goalTarget).toBe(habitData.goalTarget);

      habitId = response.body.habit._id;
    });

    it("should create habit with default values", async () => {
      const habitData = {
        name: "Simple Habit",
      };

      const response = await request(app)
        .post("/api/habits")
        .set("Authorization", `Bearer ${authToken}`)
        .send(habitData)
        .expect(201);

      expect(response.body.habit.name).toBe(habitData.name);
      expect(response.body.habit.frequency).toBe("daily"); // default
      expect(response.body.habit.timeOfDay).toBe("anytime"); // default
      expect(response.body.habit.goalType).toBe("none"); // default
      expect(response.body.habit.currentStreak).toBe(0); // default
    });

    it("should return 400 if name is missing", async () => {
      const habitData = {
        description: "Habit without name",
      };

      const response = await request(app)
        .post("/api/habits")
        .set("Authorization", `Bearer ${authToken}`)
        .send(habitData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should not set goalTarget if goalType is none", async () => {
      const habitData = {
        name: "Habit Without Goal",
        goalType: "none",
        goalTarget: 30, // Should be ignored
      };

      const response = await request(app)
        .post("/api/habits")
        .set("Authorization", `Bearer ${authToken}`)
        .send(habitData)
        .expect(201);

      expect(response.body.habit.goalType).toBe("none");
      expect(response.body.habit.goalTarget).toBeNull();
    });
  });

  describe("GET /api/habits", () => {
    beforeEach(async () => {
      // Create multiple habits
      const habits = [
        {
          name: "Habit 1",
          userId,
        },
        {
          name: "Habit 2",
          userId,
        },
      ];

      for (const habit of habits) {
        await Habit.create(habit);
      }
    });

    it("should get all habits for authenticated user", async () => {
      const response = await request(app)
        .get("/api/habits")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.habits).toHaveLength(2);
    });

    it("should return empty array if no habits found", async () => {
      // Create another user
      const newUserData = {
        name: "New User",
        email: `newuser${Date.now()}@example.com`,
        password: "password123",
      };
      const newUserResponse = await request(app)
        .post("/api/auth/register")
        .send(newUserData);

      const response = await request(app)
        .get("/api/habits")
        .set("Authorization", `Bearer ${newUserResponse.body.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
    });
  });

  describe("PATCH /api/habits/:id/toggle-completion", () => {
    beforeEach(async () => {
      const habit = await Habit.create({
        name: "Toggle Habit",
        userId,
        currentStreak: 0,
        completions: 0,
        completionHistory: [],
      });
      habitId = habit._id.toString();
    });

      it("should toggle habit completion and increment streak", async () => {
        const response = await request(app)
          .patch(`/api/habits/${habitId}/toggle-completion`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.habit.completions).toBe(1);
        expect(response.body.habit.currentStreak).toBe(1);
        expect(response.body.habit.completionHistory).toHaveLength(1);
      });

      it("should toggle habit completion off and reset streak", async () => {
        // First toggle on
        await request(app)
          .patch(`/api/habits/${habitId}/toggle-completion`)
          .set("Authorization", `Bearer ${authToken}`);

        // Then toggle off
        const response = await request(app)
          .patch(`/api/habits/${habitId}/toggle-completion`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.habit.completions).toBe(0);
        expect(response.body.habit.currentStreak).toBe(0);
      });

      it("should calculate streak correctly for consecutive days", async () => {
        const habit = await Habit.findById(habitId);
        
        // Add completion history for yesterday and today
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        habit.completionHistory = [
          { date: yesterday, completed: true },
        ];
        habit.currentStreak = 1;
        await habit.save();

        // Toggle today
        const response = await request(app)
          .patch(`/api/habits/${habitId}/toggle-completion`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.habit.currentStreak).toBe(2);
      });

      it("should update longestStreak when currentStreak exceeds it", async () => {
        const habit = await Habit.findById(habitId);
        habit.longestStreak = 5;
        habit.currentStreak = 5;
        await habit.save();

        // Add another completion
        const response = await request(app)
          .patch(`/api/habits/${habitId}/toggle-completion`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.habit.longestStreak).toBe(6);
        expect(response.body.habit.currentStreak).toBe(6);
      });

      it("should return 404 if habit not found", async () => {
        const fakeId = "507f1f77bcf86cd799439011";
        const response = await request(app)
          .patch(`/api/habits/${fakeId}/toggle-completion`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe("PUT /api/habits/:id", () => {
    beforeEach(async () => {
      const habit = await Habit.create({
        name: "Habit to Update",
        userId,
      });
      habitId = habit._id.toString();
    });

    it("should update habit successfully", async () => {
      const updateData = {
        name: "Updated Habit Name",
        frequency: "weekdays",
        goalType: "yearly",
        goalTarget: 250,
      };

      const response = await request(app)
        .put(`/api/habits/${habitId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.habit.name).toBe(updateData.name);
      expect(response.body.habit.frequency).toBe(updateData.frequency);
      expect(response.body.habit.goalType).toBe(updateData.goalType);
    });

    it("should clear goalTarget when goalType is set to none", async () => {
      // First set a goal
      await Habit.findByIdAndUpdate(habitId, {
        goalType: "monthly",
        goalTarget: 30,
      });

      // Then remove goal
      const response = await request(app)
        .put(`/api/habits/${habitId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ goalType: "none" })
        .expect(200);

      expect(response.body.habit.goalType).toBe("none");
      expect(response.body.habit.goalTarget).toBeNull();
    });
  });

  describe("DELETE /api/habits/:id", () => {
    beforeEach(async () => {
      const habit = await Habit.create({
        name: "Habit to Delete",
        userId,
      });
      habitId = habit._id.toString();
    });

    it("should delete habit successfully", async () => {
      const response = await request(app)
        .delete(`/api/habits/${habitId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify habit is deleted
      const habit = await Habit.findById(habitId);
      expect(habit).toBeNull();
    });
  });
});
