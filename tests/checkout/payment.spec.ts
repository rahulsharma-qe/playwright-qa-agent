// spec: specs/checkout.md
// seed: tests/seed.spec.ts

import { expect, test } from '../../fixtures';
import { inStockProduct } from '../../test-data/products';
import {
  billingAddress,
  invalidBankName,
  invalidCardInput,
  invalidGiftCardNumber,
  pastExpiry,
} from '../../test-data/checkout';

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
    await checkoutPage.fillAddressAndProceed(billingAddress);
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

  // Buy Now Pay Later has only a list, so nothing invalid can be entered; Credit Card is covered by 3.1.
  // Confirm on an empty form is not asserted (observed note 13).
  test('An invalid Bank Name shows its message and disables Confirm', { tag: '@regression' }, async ({ checkoutPage }) => {
    // 1. Choose Bank Transfer and enter a Bank Name with a digit, then leave the field
    await checkoutPage.choosePaymentMethod('Bank Transfer');
    await checkoutPage.enterBankName(invalidBankName);
    await expect(checkoutPage.bankNameError).toBeVisible();
    await expect(checkoutPage.confirmButton).toBeDisabled();
  });

  test('An invalid Gift Card Number shows its message and disables Confirm', { tag: '@regression' }, async ({
    checkoutPage,
  }) => {
    // 1. Choose Gift Card and enter a Gift Card Number that is not 16 letters or digits, then leave the field
    await checkoutPage.choosePaymentMethod('Gift Card');
    await checkoutPage.enterGiftCardNumber(invalidGiftCardNumber);
    await expect(checkoutPage.giftCardNumberError).toBeVisible();
    await expect(checkoutPage.confirmButton).toBeDisabled();
  });
});
