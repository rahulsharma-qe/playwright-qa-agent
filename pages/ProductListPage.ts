import { Locator, Page, test } from '@playwright/test';

/** The home page: product cards and the search box. */
export class ProductListPage {
  readonly searchedFor: Locator;
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByRole('textbox', { name: 'Search' });
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    // The "Searched for: <term>" caption has no role or label.
    this.searchedFor = page.getByTestId('search-term');
  }

  async open(): Promise<void> {
    await test.step('Open the home page', () => this.page.goto('/'));
  }

  async search(term: string): Promise<void> {
    await test.step(`Search for "${term}"`, async () => {
      await this.searchInput.fill(term);
      await this.searchButton.click();
    });
  }

  /**
   * The card of one product, found by its exact name. Card names repeat on the page, so the locator is
   * always scoped to one card; product ids are never used because they change when the site resets.
   */
  productCard(name: string): Locator {
    return this.page
      .getByRole('link')
      .filter({ has: this.page.getByTestId('product-name').getByText(name, { exact: true }) });
  }

  async openProduct(name: string): Promise<void> {
    await test.step(`Open the product "${name}"`, () => this.productCard(name).click());
  }
}
