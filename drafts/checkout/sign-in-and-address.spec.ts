// spec: specs/checkout.md
// seed: tests/seed.spec.ts

import { expect, test } from '../../fixtures';
import { inStockProduct } from '../../test-data/products';
import { billingAddress, tooLongPostalCode } from '../../test-data/checkout';

test.describe('Sign in and billing address steps', () => {
  test('A logged-in user passes the Sign in step with one click', { tag: '@regression' }, async ({
    productListPage,
    productPage,
    cartPage,
    checkoutPage,
    header,
  }) => {
    // 1. Add a product, open the cart, click Proceed to checkout
    await productListPage.open();
    await productListPage.search(inStockProduct.name);
    await productListPage.openProduct(inStockProduct.name);
    await expect(productPage.productName).toContainText(inStockProduct.name);
    await productPage.addToCart();
    await expect.poll(() => header.cartCount()).toBe(1);
    await header.openCart();
    await cartPage.proceedToCheckout();
    await expect(checkoutPage.signInMessage).toBeVisible();
    await expect(checkoutPage.loginFields).toHaveCount(0);

    // 2. Click Proceed to checkout
    await checkoutPage.proceedFromSignIn();
    await expect(checkoutPage.billingHeading).toBeVisible();
    await expect(checkoutPage.postalCodeField).toBeVisible();
  });

  test('Proceed stays disabled until the address is complete', { tag: '@regression' }, async ({
    productListPage,
    productPage,
    cartPage,
    checkoutPage,
    header,
  }) => {
    await productListPage.open();
    await productListPage.search(inStockProduct.name);
    await productListPage.openProduct(inStockProduct.name);
    await expect(productPage.productName).toContainText(inStockProduct.name);
    await productPage.addToCart();
    await expect.poll(() => header.cartCount()).toBe(1);
    await header.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.proceedFromSignIn();

    // 1. Reach the Billing Address step
    await expect(checkoutPage.addressProceedButton).toBeDisabled();

    // 2. Choose a country, fill Postal code and House number
    await checkoutPage.chooseCountry(billingAddress.country);
    await checkoutPage.fillPostalCode(billingAddress.postalCode);
    await checkoutPage.fillHouseNumber(billingAddress.houseNumber);
    await expect(checkoutPage.addressProceedButton).toBeEnabled();

    // 3. Clear the House number
    await checkoutPage.clearHouseNumber();
    await expect(checkoutPage.addressProceedButton).toBeDisabled();
  });

  test('A postal code longer than 10 characters is refused', { tag: '@regression' }, async ({
    productListPage,
    productPage,
    cartPage,
    checkoutPage,
    header,
  }) => {
    await productListPage.open();
    await productListPage.search(inStockProduct.name);
    await productListPage.openProduct(inStockProduct.name);
    await expect(productPage.productName).toContainText(inStockProduct.name);
    await productPage.addToCart();
    await expect.poll(() => header.cartCount()).toBe(1);
    await header.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.proceedFromSignIn();

    // 1. Enter a postal code longer than 10 characters and a house number
    await checkoutPage.chooseCountry(billingAddress.country);
    await checkoutPage.fillPostalCode(tooLongPostalCode);
    await checkoutPage.fillHouseNumber(billingAddress.houseNumber);
    await expect(checkoutPage.postalCodeTooLongMessage).toBeVisible();
    await expect(checkoutPage.addressProceedButton).toBeDisabled();
  });
});
