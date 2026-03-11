import { test, expect } from '@playwright/test';
import { uniqueUser, registerUser } from './helpers';

test.describe('Profile', () => {
  test('shows success message after password change', async ({ page }) => {
    const { username, password } = uniqueUser();
    await registerUser(page, username, password);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Current Password').fill(password);
    await page.getByLabel('New Password').fill('newpassword99!');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test('shows error for wrong current password', async ({ page }) => {
    const { username, password } = uniqueUser();
    await registerUser(page, username, password);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Current Password').fill('wrongpassword');
    // The schema requires at least one of new_username/new_password to be non-empty,
    // otherwise Formik blocks submission before it ever reaches the backend.
    // We supply a new_password so the form is valid and the PUT is sent —
    // the backend then rejects it because current_password is wrong.
    await page.getByLabel('New Password').fill('newpassword99!');
    await page.getByRole('button', { name: /save changes/i }).click();
    // Backend returns {"current_password": "Current password is incorrect."}
    await expect(page.getByText(/incorrect|invalid|wrong/i)).toBeVisible();
  });
});