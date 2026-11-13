// spec: specs/checkout.md
// seed: tests/seed.spec.ts

import { expect, test } from '../../fixtures';
import { useOwnCustomer } from '../../support/api-session';
import { inStockProduct } from '../../test-data/products';
import { billingAddress, validCard } from '../../test-data/checkout';

test.describe('Order confirmation', () => {
  test.beforeEach(async ({ page, request, productListPage, productPage, cartPage, checkoutPage, header }) => {
    // Each order is placed by its own customer (observed note 17: orders on one account at once collide).
    await test.step('Log in as a new customer for this order', () => useOwnCustomer(page, request, 'order'));
    // Add a product, open the cart, Proceed; Proceed on the Sign in step; fill the address; Proceed
    await productListPage.open();
    await productListPage.search(inStockProduct.name);
    await productListPage.openProduct(inStockProduct.name);
    await expect(productPage.productName).toContainText(inStockProduct.name);
    await productPage.addToCart();
    await expect.poll(() => header.cartCount()).toBe(1);
    // An order placed while this message is still shown can leave the cart badge at 1 (observed note 16).
    await productPage.waitUntilAddedMessageGone();
    await header.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.proceedFromSignIn();
    await checkoutPage.fillAddressAndProceed(billingAddress);
  });

  test('Happy path with a credit card', { tag: '@sanity' }, async ({
    checkoutPage,
    accountPage,
    invoicesPage,
    header,
  }) => {
    // 1. Choose Credit Card and fill valid, plainly fake data; click Confirm; if "Payment was successful" shows on
    //    the Payment step, click Confirm again (observed note 7)
    await checkoutPage.choosePaymentMethod('Credit Card');
    await checkoutPage.fillCreditCard(validCard);
    await checkoutPage.placeOrder();
    await expect(checkoutPage.orderConfirmation).toBeVisible();
    await expect.poll(() => header.cartCount()).toBe(0);
    const invoiceNumber = await checkoutPage.invoiceNumber();

    // 2. Open My account, then Invoices
    await header.openMyAccount();
    await accountPage.openInvoices();
    await expect(invoicesPage.invoiceRow(invoiceNumber)).toBeVisible();
  });

  test('Happy path with Cash on Delivery', { tag: '@regression' }, async ({ checkoutPage }) => {
    // 1. Same as 4.1 (including the conditional second Confirm), but choose Cash on Delivery
    await checkoutPage.choosePaymentMethod('Cash on Delivery');
    await checkoutPage.placeOrder();
    await expect(checkoutPage.orderConfirmation).toBeVisible();
  });
});
