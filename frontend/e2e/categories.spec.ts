import { test, expect } from '@playwright/test';
import { uniqueUser, registerUser } from './helpers';

test.describe('Categories', () => {
  test.beforeEach(async ({ page }) => {
    const { username, password } = uniqueUser();
    await registerUser(page, username, password);
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
  });

  test('can create a category', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click();
    await page.getByLabel('Title').fill('Work');
    await page.getByRole('button', { name: /create category/i }).click();
    // Use heading role to avoid strict mode violation (title also appears in sidebar)
    await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible();
  });

  test('duplicate category name shows error', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click();
    await page.getByLabel('Title').fill('Dupe');
    await page.getByRole('button', { name: /create category/i }).click();
    await expect(page.getByRole('heading', { name: 'Dupe' })).toBeVisible();
    await page.getByRole('button', { name: /new category/i }).click();
    await page.getByLabel('Title').fill('Dupe');
    await page.getByRole('button', { name: /create category/i }).click();
    await expect(page.getByText(/already exists|duplicate|already in use/i)).toBeVisible();
  });

  test('modal closes after create', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Title').fill('Closeable');
    await page.getByRole('button', { name: /create category/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('can delete a category', async ({ page }) => {
    await page.getByRole('button', { name: /new category/i }).click();
    await page.getByLabel('Title').fill('ToDelete');
    await page.getByRole('button', { name: /create category/i }).click();
    await expect(page.getByRole('heading', { name: 'ToDelete' })).toBeVisible();
    await page.getByRole('heading', { name: 'ToDelete' }).hover();
    await page.locator('[data-testid="delete-cat"]').first().click();
    await page.getByRole('button', { name: /^delete$/i }).click();
    await expect(page.getByRole('heading', { name: 'ToDelete' })).not.toBeVisible();
  });
});
