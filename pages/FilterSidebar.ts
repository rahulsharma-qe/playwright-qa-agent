import { Locator, Page, test } from '@playwright/test';

/** The filter sidebar on the home page: sort, price range, categories, brands and the eco-friendly option. */
export class FilterSidebar {
  /** Every ticked box in the sidebar (categories, brands and the eco-friendly option). */
  readonly checkedBoxes: Locator;
  readonly maxPriceHandle: Locator;
  private readonly categories: Locator;
  private readonly brands: Locator;
  private readonly sort: Locator;

  constructor(private readonly page: Page) {
    this.categories = page.getByRole('group', { name: 'Categories' });
    this.brands = page.getByRole('group', { name: 'Brands' });
    this.checkedBoxes = page.getByRole('checkbox', { checked: true });
    this.sort = page.getByRole('combobox', { name: 'sort' });
    this.maxPriceHandle = page.getByRole('slider', { name: 'ngx-slider-max' });
  }

  /** A category checkbox, by its exact label ("Saw" is not "Hand Saw"). */
  category(name: string): Locator {
    return this.categories.getByRole('checkbox', { name, exact: true });
  }

  async checkCategory(name: string): Promise<void> {
    await test.step(`Tick the category "${name}"`, () => this.category(name).check());
  }

  async uncheckCategory(name: string): Promise<void> {
    await test.step(`Untick the category "${name}"`, () => this.category(name).uncheck());
  }

  async checkBrand(name: string): Promise<void> {
    await test.step(`Tick the brand "${name}"`, () => this.brands.getByRole('checkbox', { name, exact: true }).check());
  }

  async uncheckBrand(name: string): Promise<void> {
    await test.step(`Untick the brand "${name}"`, () => this.brands.getByRole('checkbox', { name, exact: true }).uncheck());
  }

  /** Another option in the sidebar, by its exact label (for example the eco-friendly one). */
  async checkOption(label: string): Promise<void> {
    await test.step(`Tick "${label}"`, () => this.page.getByRole('checkbox', { name: label, exact: true }).check());
  }

  async uncheckOption(label: string): Promise<void> {
    await test.step(`Untick "${label}"`, () => this.page.getByRole('checkbox', { name: label, exact: true }).uncheck());
  }

  async sortBy(label: string): Promise<void> {
    await test.step(`Sort by "${label}"`, () => this.sort.selectOption({ label }));
  }

  /**
   * Moves the upper price handle down from its default of 100 to `price`. The slider moves only with keys:
   * PageDown moves it by 20, ArrowLeft by 1. Home is not used: on this handle it collapses the range.
   */
  async setMaxPrice(price: number): Promise<void> {
    await test.step(`Set the highest price to ${price}`, async () => {
      await this.maxPriceHandle.focus();
      const bigSteps = Math.floor((100 - price) / 20);
      for (let i = 0; i < bigSteps; i++) await this.maxPriceHandle.press('PageDown');
      for (let i = 0; i < 100 - bigSteps * 20 - price; i++) await this.maxPriceHandle.press('ArrowLeft');
    });
  }
}
