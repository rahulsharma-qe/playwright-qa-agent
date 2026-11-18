import { Locator, Page, test } from '@playwright/test';
import { appUrl } from '../support/app-url';

/** The home page: product cards and the search box. The page buttons under the list are in Pagination. */
export class ProductListPage {
  readonly searchedFor: Locator;
  /** The product cards on the page shown. */
  readonly cards: Locator;
  readonly productNames: Locator;
  readonly prices: Locator;
  readonly co2Scales: Locator;
  /** "There are no products found." */
  readonly noResults: Locator;
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly clearSearchButton: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByRole('textbox', { name: 'Search' });
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    // The "Searched for: <term>" caption has no role or label.
    this.searchedFor = page.getByTestId('search-term');
    this.clearSearchButton = page.getByRole('button', { name: 'X', exact: true });
    // The product name and price have no role or label of their own.
    this.productNames = page.getByTestId('product-name');
    this.prices = page.getByTestId('product-price');
    this.cards = page.getByRole('link').filter({ has: this.productNames });
    // The CO2 rating has no role or label; its test id is steadier than the "CO₂" text.
    this.co2Scales = page.getByTestId('co2-rating-badge');
    this.noResults = page.getByTestId('no-results');
  }

  async open(): Promise<void> {
    await test.step('Open the home page', () => this.page.goto(appUrl('/')));
  }

  async search(term: string): Promise<void> {
    // The step name never holds the typed text (AGENTS.md).
    await test.step('Search for a product', async () => {
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

  async clearSearch(): Promise<void> {
    await test.step('Clear the search', () => this.clearSearchButton.click());
  }

  /** The product names on the page shown, sorted, for checks of which products show and not their order. */
  async namesSorted(): Promise<string[]> {
    return (await this.productNames.allTextContents()).map((name) => name.trim()).sort();
  }
}
