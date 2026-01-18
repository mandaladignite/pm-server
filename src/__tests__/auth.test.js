import request from "supertest";
import { app } from "../app.js";
import { User } from "../models/user.model.js";

describe("Authentication API", () => {
  let authToken;
  let userId;

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body).toHaveProperty("token");
      expect(response.headers["set-cookie"]).toBeDefined();

      userId = response.body.user.id;
      authToken = response.body.token;
    });

    it("should return 400 if email already exists", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      // First registration
      await request(app).post("/api/auth/register").send(userData);

      // Second registration with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          // email missing
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should hash password and not return it in response", async () => {
      const userData = {
        name: "Test User",
        email: "test2@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.user).not.toHaveProperty("password");

      // Verify password is hashed in database
      const user = await User.findOne({ email: userData.email }).select("+password");
      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a user for login tests
      const userData = {
        name: "Login Test User",
        email: "login@example.com",
        password: "password123",
      };
      await request(app).post("/api/auth/register").send(userData);
    });

    it("should login user with correct credentials", async () => {
      const loginData = {
        email: "login@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body).toHaveProperty("token");
      expect(response.headers["set-cookie"]).toBeDefined();

      authToken = response.body.token;
    });

    it("should return 401 with incorrect password", async () => {
      const loginData = {
        email: "login@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid");
    });

    it("should return 401 with non-existent email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid");
    });

    it("should return 400 if email or password is missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          // password missing
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    beforeEach(async () => {
      // Create and login user
      const userData = {
        name: "Logout Test User",
        email: "logout@example.com",
        password: "password123",
      };
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(userData);
      authToken = registerResponse.body.token;
    });

    it("should logout authenticated user", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", `token=${authToken}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Logged out");
    });

    it("should return 401 without authentication token", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Authentication required");
    });
  });

  describe("GET /api/auth/me", () => {
    beforeEach(async () => {
      // Create and login user
      const userData = {
        name: "Current User Test",
        email: "current@example.com",
        password: "password123",
      };
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(userData);
      authToken = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    it("should return current user with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe("current@example.com");
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 401 without authentication token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Authentication required");
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should work with cookie token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", `token=${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty("id");
    });
  });
});
