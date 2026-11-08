import { Locator, Page, test } from '@playwright/test';

/** The cart: first step of checkout. */
export class CartPage {
  /** One entry per product line in the cart; table cells have no clear role or label. */
  readonly productTitles: Locator;

  constructor(private readonly page: Page) {
    this.productTitles = page.getByTestId('product-title');
  }

  async open(): Promise<void> {
    await test.step('Open the cart', () => this.page.goto('/checkout'));
  }
}
