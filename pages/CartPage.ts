import { Locator, Page, test } from '@playwright/test';
import { appUrl } from '../support/app-url';

/** The cart: first step of checkout. Table cells have no clear role or label, so most locators use data-test. */
export class CartPage {
  /** One entry per product line in the cart. */
  readonly productTitles: Locator;
  readonly unitPrices: Locator;
  readonly linePrices: Locator;
  readonly total: Locator;
  readonly emptyMessage: Locator;

  constructor(private readonly page: Page) {
    this.productTitles = page.getByTestId('product-title');
    this.unitPrices = page.getByTestId('product-price');
    this.linePrices = page.getByTestId('line-price');
    this.total = page.getByTestId('cart-total');
    this.emptyMessage = page.getByText('The cart is empty. Nothing to display.');
  }

  async open(): Promise<void> {
    await test.step('Open the cart', () => this.page.goto(appUrl('/checkout')));
  }

  /** The Quantity field on one product's row. */
  quantityInput(productName: string): Locator {
    return this.row(productName).getByTestId('product-quantity');
  }

  /** Types a quantity and leaves the field, which is when the site takes the new value. */
  async enterQuantity(productName: string, value: string): Promise<void> {
    await test.step('Enter a quantity', async () => {
      await this.quantityInput(productName).fill(value);
      await this.quantityInput(productName).press('Tab');
    });
  }

  /**
   * The remove control is an <a class="btn btn-danger"> with only an icon: no href, role, name or data-test
   * (observed note 14). With no role, label or data-test to use, a class is the only locator left.
   */
  async removeProduct(productName: string): Promise<void> {
    await test.step('Remove a product from the cart', () => this.row(productName).locator('a.btn-danger').click());
  }

  async proceedToCheckout(): Promise<void> {
    await test.step('Proceed to checkout from the cart', () => this.page.getByTestId('proceed-1').click());
  }

  private row(productName: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByTestId('product-title').filter({ hasText: productName }) });
  }
}
