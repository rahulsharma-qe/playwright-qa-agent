import { Locator, Page, test } from '@playwright/test';

/** The filter sidebar on the home page: sort, price range, categories, brands and the eco-friendly option. */
export class FilterSidebar {
  /** Every ticked box in the sidebar (categories, brands and the eco-friendly option). */
  readonly checkedBoxes: Locator;
  private readonly categories: Locator;
  private readonly brands: Locator;
  private readonly sort: Locator;

  constructor(private readonly page: Page) {
    this.categories = page.getByRole('group', { name: 'Categories' });
    this.brands = page.getByRole('group', { name: 'Brands' });
    this.checkedBoxes = page.getByRole('checkbox', { checked: true });
    this.sort = page.getByRole('combobox', { name: 'sort' });
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
}
