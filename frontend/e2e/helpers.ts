import { Page } from '@playwright/test';

export const uniqueUser = () => {
  const ts = Date.now();
  return { username: `testuser_${ts}`, password: `testpass_${ts}!` };
};

export async function registerUser(page: Page, username: string, password: string) {
  await page.goto('/register');
  // Wait for the Username input to be visible and enabled — this proves the page
  // has loaded and React has hydrated. The data-hydrated attribute approach is
  // unreliable because networkidle can resolve before useEffect has run.
  await page.getByLabel('Username').waitFor({ state: 'visible', timeout: 30000 });
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL('**/notes', { timeout: 30000 });
}

export async function loginUser(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Username').waitFor({ state: 'visible', timeout: 30000 });
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/notes', { timeout: 30000 });
}