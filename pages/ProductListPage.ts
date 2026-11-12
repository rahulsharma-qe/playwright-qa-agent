import { Locator, Page, test } from '@playwright/test';
import { appUrl } from '../support/app-url';

/**
 * How long a check that reads every page may keep retrying: each page is a click and a load, so a walk of three
 * pages can take longer than expect.poll's default of 5 seconds when the machine is busy. An upper bound, not a wait.
 */
export const READ_ALL_PAGES_TIMEOUT = 15_000;

/** The home page: product cards, the search box and the page buttons under the list. */
export class ProductListPage {
  readonly searchedFor: Locator;
  /** The product cards on the page shown. */
  readonly cards: Locator;
  readonly productNames: Locator;
  readonly prices: Locator;
  readonly co2Scales: Locator;
  /** "There are no products found." */
  readonly noResults: Locator;
  /** The "Page-1".."Page-N" buttons; none when the results fit on one page. */
  readonly pageButtons: Locator;
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
    this.pageButtons = page.getByRole('button', { name: /^Page-\d+$/ });
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

  /** The list item that holds a page button; the page shown has the class "active". */
  pageItem(n: number): Locator {
    return this.page.getByRole('listitem').filter({ has: this.pageButton(n) });
  }

  /** The product names on the page shown, sorted, for checks of which products show and not their order. */
  async namesSorted(): Promise<string[]> {
    return (await this.productNames.allTextContents()).map((name) => name.trim()).sort();
  }

  /**
   * The cards of every page, page 1 first. A simple walk: for each page, click its button (unless it is the page
   * shown), wait until the first card is a different product, then read the cards. The page button turns active
   * at once, but the products of the new page load after it, so the active button alone is not enough.
   * With no page buttons, it reads the one page shown.
   */
  async readAllPages(): Promise<{ name: string; price: number }[][]> {
    return test.step('Read the products on every page', async () => {
      const pages = await this.pageButtons.count();
      if (pages === 0) return [await this.cardsShown()];
      const result: { name: string; price: number }[][] = [];
      for (let n = 1; n <= pages; n++) {
        const isShown = (await this.pageItem(n).getAttribute('class'))?.includes('active') ?? false;
        if (!isShown) {
          const firstBefore = (await this.productNames.first().textContent())?.trim() ?? '';
          await this.pageButton(n).click();
          // Exact match: "Hammer" must not hide "Claw Hammer".
          const exactly = new RegExp(`^\\s*${firstBefore.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
          await this.productNames.first().filter({ hasNotText: exactly }).waitFor();
        }
        result.push(await this.cardsShown());
      }
      return result;
    });
  }

  private pageButton(n: number): Locator {
    return this.page.getByRole('button', { name: `Page-${n}`, exact: true });
  }

  private async cardsShown(): Promise<{ name: string; price: number }[]> {
    const names = (await this.productNames.allTextContents()).map((name) => name.trim());
    const prices = (await this.prices.allTextContents()).map((text) => Number(text.replace('$', '').trim()));
    return names.map((name, i) => ({ name, price: prices[i] }));
  }
}
