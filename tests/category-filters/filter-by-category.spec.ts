// spec: specs/category-filters.md
// seed: tests/seed.spec.ts
import { expect, test } from '../../fixtures';
import { READ_ALL_PAGES_TIMEOUT } from '../../pages/ProductListPage';
import {
  categoryProducts,
  drillProductsByProductPage,
  emptyCategory,
  hammerCategory,
  listCounts,
  narrowedParent,
  noResultsText,
  parentCategories,
  sanityCategory,
  subCategoriesChecked,
  unionPartnerCategory,
  unticked,
} from '../../test-data/category-filters';

const sorted = (names: string[]) => [...names].sort();

test.describe('Category filter: basics', () => {
  test.beforeEach(async ({ productListPage }) => {
    await productListPage.open();
    // The unfiltered list first, then the first control: a tick made while the list loads can be lost.
    await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
  });

  test('Selecting one sub-category shows only its products', { tag: '@sanity' }, async ({ productListPage, filterSidebar }) => {
    // 1. Start state: fresh home page, nothing filtered
    await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
    await expect(productListPage.pageButtons).toHaveCount(listCounts.unfilteredPages);
    for (const [parent, children] of Object.entries(parentCategories)) {
      await expect(filterSidebar.category(parent)).toBeVisible();
      for (const child of children) await expect(filterSidebar.category(child)).toBeVisible();
    }

    // 2. Check one sub-category in the Categories group
    await filterSidebar.checkCategory(sanityCategory);
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(categoryProducts[sanityCategory]));
    const expectedCount = categoryProducts[sanityCategory].length;
    await expect(productListPage.cards).toHaveCount(expectedCount);
    await expect(productListPage.pageButtons).toHaveCount(0);
    await expect(productListPage.productNames).toHaveCount(expectedCount);
    await expect(productListPage.co2Scales).toHaveCount(expectedCount);
    await expect(productListPage.prices).toHaveCount(expectedCount);
    await expect(filterSidebar.category(sanityCategory)).toBeChecked();
    await expect(filterSidebar.checkedBoxes).toHaveCount(1);
  });

  test('Each sub-category shows the expected product names', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    // 1. For each row in the test-data table: check only that sub-category, read the names, then uncheck it
    for (const category of subCategoriesChecked) {
      await test.step(`Sub-category ${category}`, async () => {
        await filterSidebar.checkCategory(category);
        await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(categoryProducts[category]));
        await filterSidebar.uncheckCategory(category);
        await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
      });
    }
  });

  test('Selecting several sub-categories shows the union of their products', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    const first = categoryProducts[hammerCategory];
    const second = categoryProducts[unionPartnerCategory];

    // 1. Check one sub-category, then a second one
    await filterSidebar.checkCategory(hammerCategory);
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(first));
    await filterSidebar.checkCategory(unionPartnerCategory);
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted([...first, ...second]));
    await expect(filterSidebar.category(hammerCategory)).toBeChecked();
    await expect(filterSidebar.category(unionPartnerCategory)).toBeChecked();
    await expect(productListPage.pageButtons).toHaveCount(0);

    // 2. Uncheck the first one
    await filterSidebar.uncheckCategory(hammerCategory);
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(second));
  });

  test('Selecting a parent category selects its children and shows their products', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    const children = parentCategories['Power Tools'];

    // 1. Check the parent
    await filterSidebar.checkCategory('Power Tools');
    for (const child of children) await expect(filterSidebar.category(child)).toBeChecked();
    // No count: it would include the drills of observed note 2. The Sander and Saw products show, and any other
    // card is one of the four drills whose product page says "Drill", never a product from another category.
    const settled = [...categoryProducts.Sander, ...categoryProducts.Saw];
    await expect
      .poll(async () => {
        const names = await productListPage.namesSorted();
        return {
          missing: settled.filter((name) => !names.includes(name)),
          fromElsewhere: names.filter((name) => !settled.includes(name) && !drillProductsByProductPage.includes(name)),
        };
      })
      .toEqual({ missing: [], fromElsewhere: [] });
    await expect(productListPage.pageButtons).toHaveCount(0);

    // 2. Uncheck the parent
    await filterSidebar.uncheckCategory('Power Tools');
    for (const child of children) await expect(filterSidebar.category(child)).not.toBeChecked();
    await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
    await expect(productListPage.pageButtons).toHaveCount(listCounts.unfilteredPages);
  });

  test('Unchecking one child while the parent is checked narrows the list', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    const expected = parentCategories[narrowedParent as 'Hand Tools']
      .filter((child) => child !== unticked)
      .flatMap((child) => categoryProducts[child]);

    // 1. Check the parent, then uncheck one child
    await filterSidebar.checkCategory(narrowedParent);
    await expect(productListPage.pageButtons).toHaveCount(listCounts.handToolsPages);
    await filterSidebar.uncheckCategory(unticked);

    // The list only: the parent's own tick is an open question (docs/observed-notes.md, note 4).
    await expect
      .poll(async () => sorted((await productListPage.readAllPages()).flat().map((card) => card.name)), { timeout: READ_ALL_PAGES_TIMEOUT })
      .toEqual(sorted(expected));
  });

  test('Clearing the category filter restores the full list', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    // 1. Check one sub-category, confirm its cards, then uncheck it
    await filterSidebar.checkCategory(hammerCategory);
    await expect(productListPage.cards).toHaveCount(categoryProducts[hammerCategory].length);
    await filterSidebar.uncheckCategory(hammerCategory);
    await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
    await expect(productListPage.pageButtons).toHaveCount(listCounts.unfilteredPages);
    await expect(filterSidebar.checkedBoxes).toHaveCount(0);
  });

  test('Category with no products shows the empty-results message', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    // 1. Check a category that has no products
    await filterSidebar.checkCategory(emptyCategory);
    await expect(productListPage.noResults).toHaveText(noResultsText);
    await expect(productListPage.cards).toHaveCount(0);
    await expect(productListPage.pageButtons).toHaveCount(0);

    await filterSidebar.uncheckCategory(emptyCategory);
    await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
  });
});
