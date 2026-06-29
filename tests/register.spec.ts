import { test, expect } from '@playwright/test';
import { registerpage } from '../page/registerpage';

test.describe('Register Page', () => {

    test('User should register successfully as Buyer', async ({ page }) => {

        const register = new registerpage(page);

        await register.goto();

        const username = `buyer_${Date.now()}`;

        await register.register(
            username,
            'StrongPass123',
            'buyer',
            'https://linkedin.com/in/testbuyer'
        );

        await expect(page).toHaveURL(/login/);

    });

    test('User should register successfully as Founder', async ({ page }) => {

        const register = new registerpage(page);

        await register.goto();

        const username = `founder_${Date.now()}`;

        await register.register(
            username,
            'StrongPass123',
            'founder',
            'https://linkedin.com/in/testfounder'
        );

        await expect(page).toHaveURL(/login/);

    });

});