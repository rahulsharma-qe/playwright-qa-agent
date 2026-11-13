// spec: specs/checkout.md
// seed: tests/seed.spec.ts

import { expect, test } from '../../fixtures';
import { inStockProduct } from '../../test-data/products';
import { billingAddress, invalidCardInput, otherPaymentMethods, pastExpiry } from '../../test-data/checkout';

test.describe('Payment step', () => {
  test.beforeEach(async ({ productListPage, productPage, cartPage, checkoutPage, header }) => {
    // Every test here starts on the Payment step with one product in the cart.
    await productListPage.open();
    await productListPage.search(inStockProduct.name);
    await productListPage.openProduct(inStockProduct.name);
    await expect(productPage.productName).toContainText(inStockProduct.name);
    await productPage.addToCart();
    await expect.poll(() => header.cartCount()).toBe(1);
    await header.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.proceedFromSignIn();
    await checkoutPage.fillAddress(billingAddress);
    await checkoutPage.proceedFromAddress();
    await expect(checkoutPage.paymentMethodSelect).toBeVisible();
  });

  test('Invalid credit card fields show their messages and keep Confirm disabled', { tag: '@regression' }, async ({
    checkoutPage,
  }) => {
    // 1. Choose Credit Card; enter a too-short card number, an expiry in the wrong format and a one-digit CVV,
    //    leaving each field after typing
    await checkoutPage.choosePaymentMethod('Credit Card');
    await checkoutPage.enterCardNumber(invalidCardInput.shortNumber);
    await checkoutPage.enterExpiry(invalidCardInput.wrongFormatExpiry);
    await checkoutPage.enterCvv(invalidCardInput.shortCvv);
    await expect(checkoutPage.cardNumberError).toBeVisible();
    await expect(checkoutPage.expiryFormatError).toBeVisible();
    await expect(checkoutPage.cvvError).toBeVisible();
    await expect(checkoutPage.confirmButton).toBeDisabled();
  });

  test('An expiry date in the past is refused', { tag: '@regression' }, async ({ checkoutPage }) => {
    // 1. Choose Credit Card and enter a well-formed expiry date in the past (MM/YYYY)
    await checkoutPage.choosePaymentMethod('Credit Card');
    await checkoutPage.enterExpiry(pastExpiry);
    await expect(checkoutPage.expiryPastError).toBeVisible();
  });

  test('Bank Transfer, Buy Now Pay Later and Gift Card enable Confirm when filled', { tag: '@regression' }, async ({
    checkoutPage,
  }) => {
    for (const method of otherPaymentMethods) {
      // 1. For each of Bank Transfer, Buy Now Pay Later and Gift Card (one table in test-data/), choose it
      await checkoutPage.choosePaymentMethod(method.method);
      await expect(checkoutPage.confirmButton).toBeDisabled();

      // 2. Fill its fields with valid values
      for (const field of method.textFields) {
        await checkoutPage.fillPaymentTextField(field.label, field.value);
      }
      for (const field of method.selectFields) {
        await checkoutPage.choosePaymentSelectField(field.label, field.option);
      }
      await expect(checkoutPage.confirmButton).toBeEnabled();
    }
  });
});
