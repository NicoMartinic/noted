import { test, expect } from '@playwright/test';
import { uniqueUser, registerUser } from './helpers';

test.describe('Notes', () => {
  test.beforeEach(async ({ page }) => {
    const { username, password } = uniqueUser();
    await registerUser(page, username, password);
  });

  test('can create a note and it appears in the list', async ({ page }) => {
    await page.getByRole('link', { name: /new note/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Title').fill('My first note');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/notes/create') && resp.status() === 201),
      page.getByRole('button', { name: /create note|save/i }).click(),
    ]);
    await page.goto('/notes');
    await expect(page.getByText('My first note')).toBeVisible();
  });

  test('can search notes', async ({ page }) => {
    for (const title of ['Alpha note', 'Beta note']) {
      await page.getByRole('link', { name: /new note/i }).first().click();
      await page.waitForLoadState('networkidle');
      await page.getByLabel('Title').fill(title);
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/notes/create') && resp.status() === 201),
        page.getByRole('button', { name: /create note|save/i }).click(),
      ]);
      await page.goto('/notes');
    }
    await page.getByPlaceholder(/search notes/i).fill('Alpha');
    await expect(page.getByText('Alpha note')).toBeVisible();
    await expect(page.getByText('Beta note')).not.toBeVisible();
  });

  test('can archive and view in archived section', async ({ page }) => {
    await page.getByRole('link', { name: /new note/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Title').fill('Archive me');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/notes/create') && resp.status() === 201),
      page.getByRole('button', { name: /create note|save/i }).click(),
    ]);
    await page.goto('/notes');
    await expect(page.getByText('Archive me')).toBeVisible();
    await page.getByText('Archive me').click();
    // Use exact: true to avoid matching "Archived" sidebar button
    await page.getByRole('button', { name: 'Archive', exact: true }).click();
    await page.goto('/notes');
    await page.getByRole('button', { name: /archived/i }).click();
    await expect(page.getByText('Archive me')).toBeVisible();
  });

  test('can delete a note', async ({ page }) => {
    await page.getByRole('link', { name: /new note/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Title').fill('Delete me');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/notes/create') && resp.status() === 201),
      page.getByRole('button', { name: /create note|save/i }).click(),
    ]);
    await page.goto('/notes');
    await expect(page.getByText('Delete me')).toBeVisible();

    // Delete from the note card on the list page — NoteCard dispatches deleteNoteRequest
    // directly (no confirmation dialog). Hover first to reveal the action buttons.
    const card = page.locator('.group').filter({ hasText: 'Delete me' });
    await card.hover();
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/delete') && resp.status() === 200),
      card.getByTitle('Delete').click(),
    ]);
    await expect(page.getByText('Delete me')).not.toBeVisible();
  });
});