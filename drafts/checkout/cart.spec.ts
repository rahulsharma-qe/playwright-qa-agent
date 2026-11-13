// spec: specs/checkout.md
// seed: tests/seed.spec.ts

import { expect, test } from '../../fixtures';
import { inStockProduct, outOfStockProduct } from '../../test-data/products';
import { formatPrice } from '../../test-data/checkout';

test.describe('Cart step', () => {
  test('Cart shows the added product with price, quantity and total', { tag: '@regression' }, async ({
    productListPage,
    productPage,
    cartPage,
    checkoutPage,
    header,
  }) => {
    // 1. Open an in-stock product page from the home list and click Add to cart
    await productListPage.open();
    await productListPage.search(inStockProduct.name);
    await productListPage.openProduct(inStockProduct.name);
    await expect(productPage.productName).toContainText(inStockProduct.name);
    await productPage.addToCart();
    await expect.poll(() => header.cartCount()).toBe(1);

    // 2. Open the cart through the cart link in the menu
    await header.openCart();
    await expect(checkoutPage.steps).toHaveText([/Cart/, /Sign in/, /Billing Address/, /Payment/]);
    await expect(cartPage.productTitles).toHaveCount(1);
    await expect(cartPage.productTitles).toContainText(inStockProduct.name);
    await expect(cartPage.quantityInput(inStockProduct.name)).toHaveValue('1');
    await expect(cartPage.unitPrices).toHaveText(formatPrice(inStockProduct.price));
    await expect(cartPage.linePrices).toHaveText(formatPrice(inStockProduct.price));
    await expect(cartPage.total).toHaveText(formatPrice(inStockProduct.price));
  });

  test('The same product added twice is one row with quantity 2', { tag: '@regression' }, async ({
    productListPage,
    productPage,
    cartPage,
    header,
  }) => {
    // 1. Click Add to cart twice on the same product, open the cart
    await productListPage.open();
    await productListPage.search(inStockProduct.name);
    await productListPage.openProduct(inStockProduct.name);
    await expect(productPage.productName).toContainText(inStockProduct.name);
    await productPage.addToCart();
    await expect.poll(() => header.cartCount()).toBe(1);
    await productPage.addToCart();
    await expect.poll(() => header.cartCount()).toBe(2);
    await header.openCart();

    await expect(cartPage.productTitles).toHaveCount(1);
    await expect(cartPage.quantityInput(inStockProduct.name)).toHaveValue('2');
    await expect(cartPage.unitPrices).toHaveText(formatPrice(inStockProduct.price));
    await expect(cartPage.linePrices).toHaveText(formatPrice(inStockProduct.price * 2));
    await expect(cartPage.total).toHaveText(formatPrice(inStockProduct.price * 2));
  });

  test('An invalid quantity in the cart goes back to 1', { tag: '@regression' }, async ({
    productListPage,
    productPage,
    cartPage,
    header,
  }) => {
    // 1. Add a product, open the cart, enter 0 in the Quantity field, then leave the field
    await productListPage.open();
    await productListPage.search(inStockProduct.name);
    await productListPage.openProduct(inStockProduct.name);
    await expect(productPage.productName).toContainText(inStockProduct.name);
    await productPage.addToCart();
    await expect.poll(() => header.cartCount()).toBe(1);
    await header.openCart();
    await cartPage.enterQuantity(inStockProduct.name, '0');
    await expect(cartPage.quantityInput(inStockProduct.name)).toHaveValue('1');
    await expect(cartPage.total).toHaveText(formatPrice(inStockProduct.price));

    // 2. Enter -1, then leave the field
    await cartPage.enterQuantity(inStockProduct.name, '-1');
    await expect(cartPage.quantityInput(inStockProduct.name)).toHaveValue('1');
    await expect(cartPage.total).toHaveText(formatPrice(inStockProduct.price));
  });

  test('An empty cart says so', { tag: '@regression' }, async ({ cartPage }) => {
    // 1. With nothing in the cart, open /checkout
    await cartPage.open();
    await expect(cartPage.emptyMessage).toBeVisible();
  });

  test('An out-of-stock product cannot be added to the cart', { tag: '@regression' }, async ({
    productListPage,
    productPage,
  }) => {
    // 1. Open a product marked "Out of stock" (the product name is in test-data/)
    await productListPage.open();
    await productListPage.search(outOfStockProduct.name);
    await productListPage.openProduct(outOfStockProduct.name);
    await expect(productPage.productName).toContainText(outOfStockProduct.name);
    await expect(productPage.addToCartButton).toBeDisabled();
  });
});
