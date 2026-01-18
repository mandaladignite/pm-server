# Test Setup Guide

## Windows PowerShell Compatibility

The test scripts now use `cross-env` to work on both Windows and Unix systems.

## Installation

### 1. Install Dependencies

```powershell
npm install
```

This will install all dependencies including test packages:
- `jest` - Testing framework
- `supertest` - HTTP assertions
- `mongodb-memory-server` - In-memory MongoDB
- `cross-env` - Cross-platform environment variables

### 2. Run Tests

After installation, run tests using:

```powershell
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Alternative: Manual Test Command (PowerShell)

If `cross-env` doesn't work, you can run tests manually in PowerShell:

```powershell
$env:NODE_ENV="test"
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

Or for watch mode:

```powershell
$env:NODE_ENV="test"
node --experimental-vm-modules node_modules/jest/bin/jest.js --watch
```

## Troubleshooting

### Issue: `NODE_ENV is not recognized`

**Solution**: Install `cross-env` package or use PowerShell environment variable syntax.

### Issue: Network errors during npm install

**Solution**: 
- Check your internet connection
- Try again: `npm install`
- Clear npm cache: `npm cache clean --force`
- Use a different registry if needed: `npm config set registry https://registry.npmjs.org/`

### Issue: MongoDB Memory Server fails

**Solution**: MongoDB Memory Server downloads MongoDB binaries automatically. If it fails:
- Check internet connection
- Ensure sufficient disk space
- Try: `npm cache clean --force` then `npm install`

## Test Files Location

All test files are in `src/__tests__/`:
- `setup.test.js` - Test setup and teardown
- `auth.test.js` - Authentication tests
- `task.test.js` - Task management tests
- `habit.test.js` - Habit tracking tests
- `dailyPlanner.test.js` - Daily planner tests

## Expected Output

When tests run successfully, you should see:

```
PASS  src/__tests__/auth.test.js
PASS  src/__tests__/task.test.js
PASS  src/__tests__/habit.test.js
PASS  src/__tests__/dailyPlanner.test.js

Test Suites: 4 passed, 4 total
Tests:       XX passed, XX total
```
