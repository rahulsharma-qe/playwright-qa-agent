// spec: specs/checkout.md
// seed: tests/seed.spec.ts

import { expect, test } from '../../fixtures';
import { useOwnCustomer } from '../../support/api-session';
import { inStockProduct } from '../../test-data/products';
import { billingAddress, validCard } from '../../test-data/checkout';
import type { CartEmptied } from '../../pages/CheckoutPage';

/** The site's DELETE /carts/<id> after the order must be answered with a success (2xx). */
function expectCartEmptied(cartEmptied: CartEmptied | null): void {
  expect(cartEmptied, 'The site did not empty the cart after the order: no DELETE /carts/<id> answer').not.toBeNull();
  const { cartId, status } = cartEmptied!;
  expect(status, `The site did not empty the cart after the order: DELETE /carts/${cartId} answered ${status}`).toBeGreaterThanOrEqual(200);
  expect(status, `The site did not empty the cart after the order: DELETE /carts/${cartId} answered ${status}`).toBeLessThan(300);
}

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
    await header.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.proceedFromSignIn();
    await checkoutPage.fillAddressAndProceed(billingAddress);
  });

  test('Happy path with a credit card', { tag: '@sanity' }, async ({
    productListPage,
    checkoutPage,
    accountPage,
    invoicesPage,
    header,
  }) => {
    // 1. Choose Credit Card and fill valid, plainly fake data; click Confirm; if "Payment was successful" shows on
    //    the Payment step, click Confirm again (observed note 7)
    await checkoutPage.choosePaymentMethod('Credit Card');
    await checkoutPage.fillCreditCard(validCard);
    const cartEmptied = await checkoutPage.placeOrder();
    await expect(checkoutPage.orderConfirmation).toBeVisible();
    const invoiceNumber = await checkoutPage.invoiceNumber();

    // 2. The site empties the cart (payment story, AC9): its DELETE /carts/<id> is answered with a success.
    //    Then open the home page: the cart must be empty. A cart still not empty fails here; no retry hides it.
    //    Not asserted: the cart icon on the confirmation page (observed note 16); a reload of /checkout shows a
    //    header with neither the account nor Sign in (observed note 12)
    expectCartEmptied(cartEmptied);
    await productListPage.open();
    await expect(header.homeLink).toBeVisible();
    await expect.poll(() => header.cartCount()).toBe(0);

    // 3. Open My account, then Invoices
    await header.openMyAccount();
    await accountPage.openInvoices();
    await expect(invoicesPage.invoiceRow(invoiceNumber)).toBeVisible();
  });

  test('Happy path with Cash on Delivery', { tag: '@regression' }, async ({ productListPage, checkoutPage, header }) => {
    // 1. Same as 4.1 (including the conditional second Confirm), but choose Cash on Delivery
    await checkoutPage.choosePaymentMethod('Cash on Delivery');
    const cartEmptied = await checkoutPage.placeOrder();
    await expect(checkoutPage.orderConfirmation).toBeVisible();

    // 2. The site empties the cart, then the home page shows no items (as in 4.1; no retry hides a cart that is not)
    expectCartEmptied(cartEmptied);
    await productListPage.open();
    await expect(header.homeLink).toBeVisible();
    await expect.poll(() => header.cartCount()).toBe(0);
  });
});
