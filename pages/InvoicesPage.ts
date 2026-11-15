import { Locator, Page } from '@playwright/test';

/** My account > Invoices: one row per invoice. */
export class InvoicesPage {
  constructor(private readonly page: Page) {}

  invoiceRow(invoiceNumber: string): Locator {
    return this.page.getByRole('row').filter({ hasText: invoiceNumber });
  }
}
