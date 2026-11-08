import { Locator, Page, test } from '@playwright/test';

/** One product's page. */
export class ProductPage {
  readonly productName: Locator;
  private readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.productName = page.getByRole('heading', { level: 1 });
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
  }

  async addToCart(): Promise<void> {
    await test.step('Add to cart', () => this.addToCartButton.click());
  }
}
