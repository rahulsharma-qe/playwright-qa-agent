import { expect, test } from '../fixtures';
import { cartProduct } from '../test-data/products';

test('add to cart makes the cart count go up', { tag: '@regression' }, async ({
  productListPage,
  productPage,
  cartPage,
  header,
}) => {
  await productListPage.open();
  await productListPage.search(cartProduct.name);
  await productListPage.openProduct(cartProduct.name);
  await expect(productPage.productName).toContainText(cartProduct.name); // may also show an ECO badge

  const before = await header.cartCount();
  await productPage.addToCart();
  // The badge updates after an API call, so wait for the new value instead of reading once.
  await expect.poll(() => header.cartCount()).toBe(before + 1);

  await cartPage.open();
  await expect(cartPage.productTitles.filter({ hasText: cartProduct.name })).toHaveCount(1);
});
