// spec: specs/category-filters.md
// seed: tests/seed.spec.ts
import { expect, test } from '../../fixtures';
import {
  brandCase,
  categoryProducts,
  ecoLabel,
  hammerCategory,
  listCounts,
  noResultsText,
  searchAcrossCategories,
  sortCase,
} from '../../test-data/category-filters';

const sorted = (names: string[]) => [...names].sort();
const hammers = categoryProducts[hammerCategory];

test.describe('Category filter: combined with other controls', () => {
  test.beforeEach(async ({ productListPage }) => {
    await productListPage.open();
    // The unfiltered list first, then the first control: a tick made while the list loads can be lost.
    await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
  });

  test('Category plus sort keeps the filter and orders the results', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    // 1. Check a category, then sort by name
    await filterSidebar.checkCategory(hammerCategory);
    // The Hammer results first, then the next control.
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(hammers));
    await filterSidebar.sortBy(sortCase.nameAZ);
    await expect(productListPage.productNames).toHaveText(sortCase.hammersByName);

    // 2. Sort by price, high to low
    await filterSidebar.sortBy(sortCase.priceHighLow);
    await expect(productListPage.prices).toHaveText(sortCase.hammerPricesHighLow.map((price) => `$${price.toFixed(2)}`));
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(hammers));
    await expect(filterSidebar.category(hammerCategory)).toBeChecked();
  });

  test('Category plus brand narrows to the intersection', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    // 1. Check one brand, then the category
    await filterSidebar.checkBrand(brandCase.forgeFlex);
    await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
    await expect(productListPage.pageButtons).toHaveCount(brandCase.forgeFlexAlonePages);
    await filterSidebar.checkCategory(hammerCategory);
    await expect
      .poll(() => productListPage.namesSorted())
      .toEqual(sorted(hammers.filter((name) => name !== brandCase.hammerNotForgeFlex)));
    await expect(productListPage.pageButtons).toHaveCount(0);

    // 2. Also check the other brand
    await filterSidebar.checkBrand(brandCase.mightyCraft);
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(hammers));

    // 3. Uncheck the first brand
    await filterSidebar.uncheckBrand(brandCase.forgeFlex);
    await expect.poll(() => productListPage.namesSorted()).toEqual([brandCase.hammerNotForgeFlex]);
  });

  test('Category plus eco-friendly checkbox gives no results when none match', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    // 1. Check a category, then the eco-friendly checkbox
    await filterSidebar.checkCategory(hammerCategory);
    await expect(productListPage.cards).toHaveCount(hammers.length);
    await filterSidebar.checkOption(ecoLabel);
    await expect(productListPage.noResults).toHaveText(noResultsText);
    await expect(productListPage.cards).toHaveCount(0);

    // 2. Uncheck the eco-friendly checkbox
    await filterSidebar.uncheckOption(ecoLabel);
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(hammers));
  });

  test('Search looks across all categories', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    // 1. Check a category, then search for a term
    await filterSidebar.checkCategory(hammerCategory);
    await expect(productListPage.cards).toHaveCount(hammers.length);
    await productListPage.search(searchAcrossCategories.firstTerm);
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(searchAcrossCategories.firstNames));

    // 2. Replace the search text
    // The category tick after a search is an open question (docs/observed-notes.md, note 1): not asserted.
    await productListPage.search(searchAcrossCategories.secondTerm);
    await expect.poll(() => productListPage.namesSorted()).toEqual(sorted(searchAcrossCategories.secondNames));

    // 3. Clear the search with the X button
    await productListPage.clearSearch();
    await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
    await expect(productListPage.pageButtons).toHaveCount(listCounts.unfilteredPages);
  });
});
