# Backend Test Suite

Comprehensive test suite for the Productivity Tracker backend API.

## Test Coverage

### Authentication Tests (`auth.test.js`)
- ✅ User registration (success, duplicate email, missing fields)
- ✅ User login (success, wrong password, non-existent email)
- ✅ User logout (with/without authentication)
- ✅ Get current user (with/without token, invalid token, cookie token)
- ✅ Password hashing verification

### Task Tests (`task.test.js`)
- ✅ Create task (success, defaults, missing fields, unauthorized)
- ✅ Get all tasks (filter by status, priority, search, empty results)
- ✅ Get single task (success, not found, different user)
- ✅ Update task (all fields, status changes, completedAt logic)
- ✅ Delete task (success, not found)

### Habit Tests (`habit.test.js`)
- ✅ Create habit (success, defaults, missing fields, goal handling)
- ✅ Get all habits (success, empty results)
- ✅ Toggle habit completion (on/off, streak calculation, longest streak)
- ✅ Update habit (all fields, goal removal)
- ✅ Delete habit (success, not found)

### Daily Planner Tests (`dailyPlanner.test.js`)
- ✅ Get daily planner (today, specific date, create if missing)
- ✅ Update notes (create/update, specific date)
- ✅ Add task to planner (success, unauthorized task, duplicate prevention)
- ✅ Toggle task completion (on/off, not found)
- ✅ Update mood (success, invalid mood, create planner)

## Running Tests

### Install Test Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Test Setup

Tests use:
- **Jest** - Testing framework
- **Supertest** - HTTP assertions for API testing
- **MongoDB Memory Server** - In-memory MongoDB for isolated testing

### Test Environment

- Tests run in isolated in-memory MongoDB instances
- Database is cleared between tests
- No need for a running MongoDB server
- Uses separate test configuration (`.env.test`)

## Test Scenarios Covered

### Success Scenarios
- All CRUD operations work correctly
- Authentication flows complete successfully
- Data validation passes
- Relationships are maintained correctly

### Error Scenarios
- Missing required fields
- Invalid data types
- Unauthorized access attempts
- Resource not found errors
- Duplicate entries prevented

### Edge Cases
- Empty result sets
- Boundary values
- Consecutive operations
- State transitions (e.g., task status changes)
- Streak calculations for habits

### Security Scenarios
- Authentication required for protected routes
- User data isolation (users can't access other users' data)
- Token validation
- Password hashing verification

## Test Structure

Each test file follows this structure:

```javascript
describe("Feature API", () => {
  beforeEach(() => {
    // Setup: Create user, get auth token
  });

  describe("POST /api/endpoint", () => {
    it("should create successfully", () => {});
    it("should return error for missing fields", () => {});
    it("should require authentication", () => {});
  });
});
```

## Writing New Tests

1. Create test file in `src/__tests__/`
2. Import required modules (app, models)
3. Set up authentication in `beforeEach`
4. Group tests by endpoint with `describe` blocks
5. Use descriptive test names with `it()` blocks
6. Clean up after tests (handled automatically by setup)

## Notes

- All tests are isolated and don't affect each other
- Tests use unique emails (with timestamps) to avoid conflicts
- MongoDB Memory Server automatically starts/stops with tests
- Test database is dropped after all tests complete
