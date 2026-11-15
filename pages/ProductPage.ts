import { Locator, Page, test } from '@playwright/test';

/** One product's page. */
export class ProductPage {
  readonly productName: Locator;
  readonly addToCartButton: Locator;
  /** The message after Add to cart; it has no role. */
  private readonly addedMessage: Locator;

  constructor(page: Page) {
    this.productName = page.getByRole('heading', { level: 1 });
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.addedMessage = page.getByText('Product added to shopping cart.');
  }

  async addToCart(): Promise<void> {
    await test.step('Add to cart', () => this.addToCartButton.click());
  }

  /**
   * Waits until the "Product added to shopping cart." message has gone, as a person would before going on; returns
   * at once if it has already gone. Used on purpose before placing an order (4.1, 4.2): in automated runs, an order
   * placed while the message still showed could leave the cart badge at 1 (observed note 16).
   */
  async waitUntilAddedMessageGone(): Promise<void> {
    await test.step('Wait until the add-to-cart message has gone', () =>
      this.addedMessage.waitFor({ state: 'hidden', timeout: 15_000 }),
    );
  }
}
