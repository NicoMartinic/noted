import { test, expect } from '@playwright/test';
import { uniqueUser, registerUser, loginUser } from './helpers';

test.describe('Authentication', () => {
  test('user can register and is redirected to notes', async ({ page }) => {
    const { username, password } = uniqueUser();
    await registerUser(page, username, password);
    await expect(page).toHaveURL(/\/notes/);
  });

  test('duplicate username shows error', async ({ page }) => {
    const { username, password } = uniqueUser();
    await registerUser(page, username, password);
    await page.goto('/register');
    const btn = page.getByRole('button', { name: /create account/i });
    await btn.waitFor({ state: 'visible' });
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password').fill(password);
    await btn.click();
    // Backend returns "Username already in use."
    await expect(page.getByText(/already in use|already exists|already taken/i)).toBeVisible();
  });

  test('wrong password shows error', async ({ page }) => {
    const { username, password } = uniqueUser();
    await registerUser(page, username, password);
    await page.goto('/login');
    const btn = page.getByRole('button', { name: /sign in/i });
    await btn.waitFor({ state: 'visible' });
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill('wrongpassword');
    await btn.click();
    // Backend returns "Invalid username or password."
    await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();
  });

  test('user can log out', async ({ page }) => {
    const { username, password } = uniqueUser();
    await registerUser(page, username, password);
    await page.getByTitle('Logout').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user redirected from /notes to /login', async ({ page }) => {
    await page.goto('/notes');
    await expect(page).toHaveURL(/\/login/);
  });
});
