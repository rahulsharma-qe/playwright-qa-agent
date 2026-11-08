import { Locator, Page, test } from '@playwright/test';

export class LoginPage {
  readonly errorMessage: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByLabel('Email address');
    // The label points at a wrapper element, not the input itself, so data-test is the fallback.
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    // Shown only after a failed login; it has no role or label.
    this.errorMessage = page.getByTestId('login-error');
  }

  async open(): Promise<void> {
    await test.step('Open the login page', () => this.page.goto('/auth/login'));
  }

  /** The step name never holds the email or password: the report is public. */
  async login(email: string, password: string): Promise<void> {
    await test.step('Log in', async () => {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
    });
  }
}
