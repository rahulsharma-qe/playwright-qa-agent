import { Page, test } from '@playwright/test';

/** My account (/account). */
export class AccountPage {
  constructor(private readonly page: Page) {}

  /** The Invoices tile shows an icon with no text, so data-test is the fallback. */
  async openInvoices(): Promise<void> {
    await test.step('Open Invoices', () => this.page.getByTestId('nav-invoices').click());
  }
}
