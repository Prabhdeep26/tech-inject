import { test, expect } from '@playwright/test';

test.describe('Admin Authentication & Route Guards', () => {
  test('1. Unauthenticated users visiting protected routes are redirected to /login', async ({ page }) => {
    // Mock /admin/me to return 401 Unauthorized
    await page.route('**/admin/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'fail', message: 'Unauthorized' }),
      });
    });

    // Attempt visiting dashboard
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('Admin Console Login');

    // Attempt visiting components list
    await page.goto('/components');
    await expect(page).toHaveURL(/.*\/login/);

    // Attempt visiting component creation
    await page.goto('/components/new');
    await expect(page).toHaveURL(/.*\/login/);

    // Attempt visiting customers
    await page.goto('/customers');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('2. Admin login fails with error message on invalid credentials', async ({ page }) => {
    await page.route('**/admin/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'fail', message: 'Unauthorized' }),
      });
    });

    await page.route('**/admin/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'fail',
          message: 'Invalid administrative credentials.',
        }),
      });
    });

    await page.goto('/login');
    await page.fill('#admin-email', 'wrong@admin.com');
    await page.fill('#admin-password', 'badpassword');
    await page.click('button:has-text("Sign In as Administrator")');

    // Verify error banner is visible
    const errorBanner = page.locator('text=Invalid administrative credentials.');
    await expect(errorBanner).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('3. Admin login succeeds, sets session, and unlocks protected routes', async ({ page }) => {
    let isAuthenticated = false;

    await page.route('**/admin/me', async (route) => {
      if (isAuthenticated) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              admin: {
                id: 'admin-root',
                email: 'admin@tech-inject.internal',
                role: 'admin',
                isAdmin: true,
              },
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'fail', message: 'Unauthorized' }),
        });
      }
    });

    await page.route('**/admin/login', async (route) => {
      const requestData = JSON.parse(route.request().postData() || '{}');
      if (requestData.email === 'admin@tech-inject.internal' && requestData.password === 'secret-admin-pass') {
        isAuthenticated = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            // In real app, Set-Cookie header is sent with httpOnly flag
            'Set-Cookie': 'ti_admin_session=mock_jwt_token; Path=/; HttpOnly; SameSite=Lax',
          },
          body: JSON.stringify({
            status: 'success',
            message: 'Admin authenticated successfully.',
            data: {
              token: 'mock_jwt_token',
              admin: {
                id: 'admin-root',
                email: 'admin@tech-inject.internal',
                role: 'admin',
                isAdmin: true,
              },
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'fail', message: 'Invalid credentials' }),
        });
      }
    });

    await page.route('**/admin/components', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          components: [
            {
              id: 'comp-1',
              slug: 'action-button',
              name: 'Action Button',
              category: 'Buttons',
              version: '1.0.0',
              accessLevel: 'free',
              status: 'published',
            },
          ],
        }),
      });
    });

    await page.route('**/admin/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          customers: [
            {
              id: 'cust-1',
              email: 'enterprise@acme.com',
              isPremium: true,
              isAdmin: false,
            },
          ],
        }),
      });
    });

    await page.route('**/admin/logout', async (route) => {
      isAuthenticated = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', message: 'Logged out' }),
      });
    });

    // 1. Visit /login
    await page.goto('/login');
    await page.fill('#admin-email', 'admin@tech-inject.internal');
    await page.fill('#admin-password', 'secret-admin-pass');
    await page.click('button:has-text("Sign In as Administrator")');

    // 2. Expect redirect to dashboard
    await expect(page).toHaveURL(/.*\//);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=admin@tech-inject.internal')).toBeVisible();

    // 3. Navigate to Components
    await page.click('a:has-text("Components")');
    await expect(page).toHaveURL(/.*\/components/);
    await expect(page.locator('h1')).toContainText('Components Directory');
    await expect(page.locator('text=Action Button')).toBeVisible();

    // 4. Navigate to Customers
    await page.click('a:has-text("Customers")');
    await expect(page).toHaveURL(/.*\/customers/);
    await expect(page.locator('h1')).toContainText('Customer Entitlements');
    await expect(page.locator('text=enterprise@acme.com')).toBeVisible();

    // 5. Sign Out
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/.*\/login/);

    // 6. Confirm trying to revisit dashboard redirects back to login
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('4. Admin login shows inline field validation errors for empty fields and invalid email format', async ({ page }) => {
    let loginRequestCount = 0;
    await page.route('**/admin/login', async (route) => {
      loginRequestCount++;
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'fail', message: 'Should not be called' }),
      });
    });

    await page.goto('/login');

    // 1. Attempt submit with empty fields
    await page.click('button:has-text("Sign In as Administrator")');

    // Verify inline field validation errors are visible
    await expect(page.locator('text=Admin email is required')).toBeVisible();
    await expect(page.locator('text=Admin password is required')).toBeVisible();

    // Verify inputs have aria-invalid set
    await expect(page.locator('#admin-email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#admin-password')).toHaveAttribute('aria-invalid', 'true');

    // Ensure no network request was dispatched to /admin/login
    expect(loginRequestCount).toBe(0);

    // 2. Type invalid email format
    await page.fill('#admin-email', 'not-an-email');
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    expect(loginRequestCount).toBe(0);

    // 3. Fix email to valid format
    await page.fill('#admin-email', 'admin@tech-inject.internal');
    await expect(page.locator('text=Please enter a valid email address')).not.toBeVisible();
    await expect(page.locator('text=Admin email is required')).not.toBeVisible();
    await expect(page.locator('#admin-email')).not.toHaveAttribute('aria-invalid', 'true');

    // Password error remains until resolved
    await expect(page.locator('text=Admin password is required')).toBeVisible();
    await page.fill('#admin-password', 'any-pass');
    await expect(page.locator('text=Admin password is required')).not.toBeVisible();
    await expect(page.locator('#admin-password')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('5. Admin login page is responsive on mobile viewport without horizontal scroll and is vertically centered', async ({ page }) => {
    // Set mobile viewport (375 x 667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Admin Console Login');

    // 1. Verify no horizontal overflow on mobile
    const overflowCheck = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      return {
        docScrollWidth: docEl.scrollWidth,
        docClientWidth: docEl.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        hasHorizontalScroll: docEl.scrollWidth > docEl.clientWidth,
      };
    });

    expect(overflowCheck.hasHorizontalScroll).toBe(false);
    expect(overflowCheck.docScrollWidth).toBeLessThanOrEqual(overflowCheck.docClientWidth);

    // 2. Verify input sizing on mobile
    const emailInputBox = await page.locator('#admin-email').boundingBox();
    expect(emailInputBox).not.toBeNull();
    if (emailInputBox) {
      expect(emailInputBox.width).toBeGreaterThan(280); // Fills mobile card nicely
      expect(emailInputBox.height).toBeGreaterThanOrEqual(38); // Minimum 38px/40px touch target
    }

    // 3. Verify vertical centering without large top blank space
    const cardElement = page.locator('h1').locator('xpath=ancestor::*[contains(@style, "border-radius")]').first();
    const cardBox = await cardElement.boundingBox();
    expect(cardBox).not.toBeNull();
    if (cardBox) {
      // Centered: top space and bottom space should be reasonably balanced
      // Top should not have an empty giant gap (e.g. > 200px on a 667px screen)
      expect(cardBox.y).toBeGreaterThan(20);
      expect(cardBox.y).toBeLessThan(200);
    }
  });
});
