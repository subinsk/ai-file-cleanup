# E2E Testing Documentation

## Overview

This document describes the End-to-End (E2E) testing setup for the AI File Cleanup project using Playwright.

## Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- All services running (web, API, ML, database)

### Installation

```bash
# Install Playwright in web app
cd apps/web
pnpm add -D @playwright/test
pnpm exec playwright install

# Install browsers
pnpm exec playwright install chromium firefox webkit
```

### Configuration

Playwright configuration is in `apps/web/playwright.config.ts`:

- **Test Directory:** `apps/web/e2e/`
- **Base URL:** `http://localhost:3000`
- **Browsers:** Chromium, Firefox, WebKit
- **Mobile:** Pixel 5, iPhone 12
- **Reporters:** HTML report

## Running Tests

### All Tests

```bash
cd apps/web
pnpm exec playwright test
```

### Specific Test File

```bash
pnpm exec playwright test e2e/auth.spec.ts
```

### With UI Mode

```bash
pnpm exec playwright test --ui
```

### Debug Mode

```bash
pnpm exec playwright test --debug
```

### Headed Mode (See Browser)

```bash
pnpm exec playwright test --headed
```

### Specific Browser

```bash
# Chromium only
pnpm exec playwright test --project=chromium

# Firefox only
pnpm exec playwright test --project=firefox

# WebKit only
pnpm exec playwright test --project=webkit
```

## Test Structure

### Test Files

| File                  | Purpose                     | Tests    |
| --------------------- | --------------------------- | -------- |
| `auth.spec.ts`        | Authentication flows        | 10 tests |
| `file-upload.spec.ts` | File upload & deduplication | 10 tests |
| `quota.spec.ts`       | User quota management       | 5 tests  |

### Test Coverage

#### Authentication (auth.spec.ts)

1. ✅ Display login page
2. ✅ Display registration page
3. ✅ Show validation errors for empty form
4. ✅ Register new user successfully
5. ✅ Login with existing user
6. ✅ Show error for invalid credentials
7. ✅ Validate password requirements
8. ✅ Logout successfully
9. ✅ Protect authenticated routes

#### File Upload (file-upload.spec.ts)

1. ✅ Display upload page
2. ✅ Upload files via file input
3. ✅ Show upload progress
4. ✅ Detect duplicate files
5. ✅ Allow selecting files to keep
6. ✅ Download cleaned files as ZIP
7. ⏳ Validate file types (requires implementation)
8. ⏳ Respect file size limits (requires large test file)
9. ✅ Show quota information

#### Quota Management (quota.spec.ts)

1. ✅ Display quota information
2. ✅ Show quota as percentage
3. ✅ Show remaining quota
4. ⏳ Warn when quota is low (requires setup)
5. ⏳ Prevent upload when quota exceeded (requires setup)

## Test Data

### Required Test Files

Tests expect these files in the repository:

```
test_files/
├── document_original.txt

demo_dataset/
├── scenario_1_exact_duplicates/
│   ├── document_original.txt
│   ├── document_copy.txt
│   └── data_original.csv
```

### Generating Test Users

Tests automatically generate unique test users using timestamps:

```typescript
const timestamp = Date.now();
const testEmail = `test${timestamp}@example.com`;
```

This prevents conflicts between test runs.

## Best Practices

### 1. Test Isolation

Each test should be independent:

- Create new user per test (or test suite)
- Don't rely on data from other tests
- Clean up after tests if needed

### 2. Selectors

Use resilient selectors:

```typescript
// ✅ Good - Role-based
await page.getByRole('button', { name: /submit/i });

// ✅ Good - Label-based
await page.getByLabel(/email/i);

// ❌ Avoid - CSS selectors
await page.locator('.submit-button');
```

### 3. Waiting

Use Playwright's auto-waiting:

```typescript
// ✅ Good - Playwright waits automatically
await expect(page.getByText('Success')).toBeVisible();

// ❌ Avoid - Manual timeouts
await page.waitForTimeout(5000);
```

### 4. Assertions

Use descriptive assertions:

```typescript
// ✅ Good
await expect(page).toHaveURL('/dashboard');
await expect(page.getByText('Welcome')).toBeVisible();

// ❌ Less descriptive
expect(page.url()).toBe('http://localhost:3000/dashboard');
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Start services
        run: |
          docker compose up -d
          pnpm dev &
          sleep 30

      - name: Run tests
        run: pnpm exec playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Failed Tests

### 1. View HTML Report

```bash
pnpm exec playwright show-report
```

### 2. View Traces

Traces are automatically captured on test failure:

```bash
pnpm exec playwright show-trace test-results/*/trace.zip
```

### 3. Screenshots

Screenshots are captured on failure in `test-results/` directory.

### 4. Debug Mode

Run specific test in debug mode:

```bash
pnpm exec playwright test auth.spec.ts:15 --debug
```

## API Testing

### Setup API Tests

```bash
# Install API testing dependencies
cd services/api
pip install pytest pytest-asyncio httpx
```

### Run API Tests

```bash
cd services/api
pytest tests/
```

### API Test Structure

```python
# tests/test_api_integration.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_user_registration():
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "TestPassword123",
        "name": "Test User"
    })
    assert response.status_code == 201
    assert "id" in response.json()

# More API tests...
```

## Desktop App Testing

### Spectron/Playwright for Electron

```bash
# Install Electron testing
cd apps/desktop
pnpm add -D @playwright/test electron-playwright-helpers
```

### Desktop Test Example

```typescript
// apps/desktop/e2e/license.spec.ts
import { test, expect } from '@playwright/test';
import { ElectronApplication, _electron as electron } from 'playwright';

test.describe('Desktop App - License Activation', () => {
  let app: ElectronApplication;

  test.beforeEach(async () => {
    app = await electron.launch({ args: ['./'] });
  });

  test.afterEach(async () => {
    await app.close();
  });

  test('should activate with valid license key', async () => {
    const window = await app.firstWindow();

    await window.fill('[placeholder="Enter license key"]', 'valid-license-key');
    await window.click('button:has-text("Activate")');

    await expect(window.locator('text=Activated')).toBeVisible();
  });
});
```

## Performance Testing

### Load Testing with k6

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3001/health');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
```

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

**Problem:** Tests timeout waiting for services  
**Solution:** Ensure all services are running before tests:

```bash
# Start all services
pnpm dev

# Wait for services to be ready
curl http://localhost:3000
curl http://localhost:3001/health

# Then run tests
pnpm exec playwright test
```

#### 2. Element Not Found

**Problem:** Selector doesn't match any elements  
**Solution:** Use Playwright Inspector to find correct selector:

```bash
pnpm exec playwright test --debug
```

#### 3. Flaky Tests

**Problem:** Tests pass/fail intermittently  
**Solution:**

- Use `toBeVisible()` instead of `toBeTruthy()`
- Avoid `waitForTimeout()`, use proper waits
- Check for race conditions

#### 4. Database State

**Problem:** Tests fail due to existing data  
**Solution:** Use unique test data or clean database between tests

## Future Enhancements

### Planned Improvements

1. **Visual Regression Testing**
   - Percy or Playwright screenshots
   - Compare UI across versions

2. **Accessibility Testing**
   - Automated a11y checks
   - WCAG compliance validation

3. **Mobile App Testing**
   - React Native testing
   - Detox or Appium setup

4. **Contract Testing**
   - Pact for API contracts
   - Ensure backend/frontend compatibility

5. **Chaos Testing**
   - Test system resilience
   - Simulate failures

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Pytest Documentation](https://docs.pytest.org/)
- [k6 Documentation](https://k6.io/docs/)

---

**Last Updated:** January 2025  
**Maintained by:** QA Team
