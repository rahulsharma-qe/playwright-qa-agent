import { Locator, Page } from '@playwright/test';

/** The top bar on every page: sign-in state, cart link and cart count. */
export class Header {
  readonly signInLink: Locator;
  readonly accountMenu: Locator;
  private readonly cartQuantity: Locator;

  constructor(page: Page) {
    this.signInLink = page.getByRole('link', { name: 'Sign in' });
    // Shows the customer's name, which changes per account, so data-test is the fallback.
    this.accountMenu = page.getByTestId('nav-menu');
    this.cartQuantity = page.getByTestId('cart-quantity');
  }

  /** Number of items in the cart. Toolshop hides the badge when the cart is empty. */
  async cartCount(): Promise<number> {
    if ((await this.cartQuantity.count()) === 0) return 0;
    return Number((await this.cartQuantity.innerText()).trim());
  }
}
