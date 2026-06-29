import { Page, Locator } from '@playwright/test';

export class registerpage {

    readonly page: Page;

    readonly username: Locator;
    readonly password: Locator;
    readonly role: Locator;
    readonly linkedin: Locator;
    readonly registerButton: Locator;
    readonly errorMessage: Locator;
    readonly loginLink: Locator;

    constructor(page: Page) {

        this.page = page;

        this.username = page.locator('input[name="username"]');

        this.password = page.locator('input[name="password"]');

        this.role = page.locator('select[name="role"]');

        this.linkedin = page.locator('input[name="linkedin_profile"]');

        this.registerButton = page.locator('button[type="submit"]');

        this.errorMessage = page.locator('.error');

        this.loginLink = page.locator('a[routerLink="/login"]');
    }

    async goto() {
        await this.page.goto('/register');
    }

    async register(
        username: string,
        password: string,
        role: string,
        linkedin?: string
    ) {

        await this.username.fill(username);

        await this.password.fill(password);

        await this.role.selectOption(role);

        if (linkedin) {
            await this.linkedin.fill(linkedin);
        }

        await this.registerButton.click();
    }

}