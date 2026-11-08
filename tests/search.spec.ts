import { expect, test } from '../fixtures';
import { searchCase } from '../test-data/products';

test('search finds the product', { tag: '@sanity' }, async ({ productListPage }) => {
  await productListPage.open();
  await productListPage.search(searchCase.term);

  await expect(productListPage.searchedFor).toHaveText(searchCase.term);
  await expect(productListPage.productCard(searchCase.expectedProduct)).toBeVisible();
});
