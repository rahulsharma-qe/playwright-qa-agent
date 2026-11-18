import { Locator, Page, test } from '@playwright/test';

/**
 * How long a check that reads every page may keep retrying: each page is a click and a load, so a walk of three
 * pages can take longer than expect.poll's default of 5 seconds when the machine is busy. An upper bound, not a wait.
 */
export const READ_ALL_PAGES_TIMEOUT = 15_000;

/** Options for an expect.poll that reads every page: the time limit above and a clear message when it runs out. */
export const READ_ALL_PAGES_POLL = {
  timeout: READ_ALL_PAGES_TIMEOUT,
  message: `Reading every page did not show the expected products within ${READ_ALL_PAGES_TIMEOUT / 1000} s`,
};

/** The most one step of the page walk may take; see readAllPages. */
const PAGE_CHANGE_TIMEOUT = 3_000;

/** The page buttons under the product list, and a walk that reads the cards of every page. */
export class Pagination {
  /** The "Page-1".."Page-N" buttons; none when the results fit on one page. */
  readonly pageButtons: Locator;
  private readonly productNames: Locator;
  private readonly prices: Locator;

  constructor(private readonly page: Page) {
    this.pageButtons = page.getByRole('button', { name: /^Page-\d+$/ });
    // The product name and price have no role or label of their own.
    this.productNames = page.getByTestId('product-name');
    this.prices = page.getByTestId('product-price');
  }

  /** The list item that holds a page button; the page shown has the class "active". */
  pageItem(n: number): Locator {
    return this.page.getByRole('listitem').filter({ has: this.pageButton(n) });
  }

  /**
   * The cards of every page, page 1 first. A simple walk: for each page, click its button (unless it is the page
   * shown), wait a little for the first card to change, then read the cards. The page button turns active at
   * once, but the products of the new page load after it.
   * Every step has a short limit (actions have none by default): a page button that has just gone, or a page that
   * has not changed yet, ends this round instead of hanging it, and the expect.poll around the walk reads again.
   * So the walk can be wrong or fail for one round, but it can never hang.
   */
  async readAllPages(): Promise<{ name: string; price: number }[][]> {
    return test.step('Read the products on every page', async () => {
      const pages = await this.pageButtons.count();
      if (pages === 0) return [await this.cardsShown()];
      const result: { name: string; price: number }[][] = [];
      for (let n = 1; n <= pages; n++) {
        const step = { timeout: PAGE_CHANGE_TIMEOUT };
        const isShown = (await this.pageItem(n).getAttribute('class', step))?.includes('active') ?? false;
        if (!isShown) {
          const firstBefore = (await this.productNames.first().textContent(step))?.trim() ?? '';
          await this.pageButton(n).click(step);
          // Exact match: "Hammer" must not hide "Claw Hammer".
          const exactly = new RegExp(`^\\s*${firstBefore.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
          await this.productNames
            .first()
            .filter({ hasNotText: exactly })
            .waitFor(step)
            .catch(() => {}); // a late read is caught by the expect.poll around the walk
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
