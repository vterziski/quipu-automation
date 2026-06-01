// src/web/tests/login.web.spec.ts
import { test, expect } from '../fixtures/web.fixtures';
import { loadRegion } from '../../../config/region';

test.describe('Login', () => {
  test('given valid credentials when submitting login form then dashboard is shown', async ({
    loginPage,
    dashboardPage,
  }) => {
    const { defaultUser, webBaseUrl } = loadRegion();

    await loginPage.goto();
    await loginPage.login(defaultUser.email, defaultUser.password);

    await expect(dashboardPage.navBar).toBeVisible();
    expect(dashboardPage.url()).not.toContain('/login');
    expect(dashboardPage.url()).toContain(new URL(webBaseUrl).hostname);
  });

  test('given wrong password when submitting login form then error is shown and stays on login page', async ({
    loginPage,
    page,
  }) => {
    const { defaultUser } = loadRegion();

    await loginPage.goto();
    await loginPage.login(defaultUser.email, 'definitely-wrong-password-xyz');

    await expect(loginPage.errorAlert).toBeVisible();
    expect(page.url()).toContain('/login');

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.toLowerCase().includes('session') || c.name.toLowerCase().includes('laravel'),
    );
    expect(sessionCookie).toBeUndefined();
  });
});
