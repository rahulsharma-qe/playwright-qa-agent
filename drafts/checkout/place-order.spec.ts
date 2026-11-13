// spec: specs/checkout.md
// seed: tests/seed.spec.ts

import { expect, test } from '../../fixtures';
import { inStockProduct } from '../../test-data/products';
import { billingAddress, validCard } from '../../test-data/checkout';

test.describe('Order confirmation', () => {
  test.beforeEach(async ({ productListPage, productPage, cartPage, checkoutPage, header }) => {
    // Add a product, open the cart, Proceed; Proceed on the Sign in step; fill the address; Proceed
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
