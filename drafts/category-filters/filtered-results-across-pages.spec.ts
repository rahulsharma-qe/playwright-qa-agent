// spec: specs/category-filters.md
// seed: tests/seed.spec.ts
import { expect, test } from '../../fixtures';
import { categoryProducts, listCounts, parentCategories } from '../../test-data/category-filters';

const namesOf = (children: string[]) => children.flatMap((child) => categoryProducts[child]).sort();

test.describe('Category filter: pagination', () => {
  test('Pagination follows the filtered result set', { tag: '@regression' }, async ({ productListPage, filterSidebar }) => {
    const handTools = namesOf(parentCategories['Hand Tools']);
    const lastPageSize = listCounts.handToolsProducts - 2 * listCounts.pageSize;
    await productListPage.open();

    // 1. Check the parent category
    await filterSidebar.checkCategory('Hand Tools');
    await expect(productListPage.cards).toHaveCount(listCounts.pageSize);
    await expect(productListPage.pageButtons).toHaveCount(listCounts.handToolsPages);

    // 2. Click through the pages
    // The order on a page follows the default sort, so only sizes and the set of names are asserted.
    await expect
      .poll(async () => {
        const pages = await productListPage.readAllPages();
        return {
          sizes: pages.map((cards) => cards.length),
          names: pages.flat().map((card) => card.name).sort(),
        };
      })
      .toEqual({ sizes: [listCounts.pageSize, listCounts.pageSize, lastPageSize], names: handTools });

    // 3. Switch from one parent to another
    await filterSidebar.uncheckCategory('Hand Tools');
    await filterSidebar.checkCategory('Other');
    await expect(productListPage.pageButtons).toHaveCount(listCounts.otherPages);
    await expect(productListPage.pageItem(1)).toHaveClass(/active/);
    await expect
      .poll(async () => (await productListPage.readAllPages()).flat().map((card) => card.name).sort())
      .toEqual(namesOf(parentCategories.Other));
    expect(namesOf(parentCategories.Other)).toHaveLength(listCounts.otherProducts);
  });
});
