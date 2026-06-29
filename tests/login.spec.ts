import { test, expect } from '@playwright/test';
import { LoginPage } from '../page/loginpage';

test('Login Success', async ({ page }) => {

  const login = new LoginPage(page);

  await login.goto();

  await login.login(
    'auth_test_founder',
    'StrongPass123'
  );

  await expect(page)
    .toHaveURL(/products/);

});
