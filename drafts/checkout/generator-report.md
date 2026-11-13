# Checkout core set: report

I explored all 13 scenarios live in the browser on the normal Sprint 5 copy at http://localhost:4200. I then wrote the four spec files. I have not run any of them, because the page objects, fixtures and test data they import do not exist yet. Three scenarios (1.4, 3.1 and 3.3) will fail on the current site, as described in section 4.

## 1. Files written
- `/Users/rahul/Projects/portfolio/playwright-qa-agent/tests/checkout/cart.spec.ts` covers 1.1 to 1.5, in "Cart step".
- `/Users/rahul/Projects/portfolio/playwright-qa-agent/tests/checkout/sign-in-and-address.spec.ts` covers 2.1 to 2.3, in "Sign in and billing address steps".
- `/Users/rahul/Projects/portfolio/playwright-qa-agent/tests/checkout/payment.spec.ts` covers 3.1 to 3.3, in "Payment step". A `beforeEach` takes each test to the Payment step.
- `/Users/rahul/Projects/portfolio/playwright-qa-agent/tests/checkout/place-order.spec.ts` covers 4.1 (`@sanity`) and 4.2 (`@regression`), in "Order confirmation". A `beforeEach` takes each test to the Payment step.

Every other test is tagged `@regression`. `tests/seed.spec.ts` was not touched. Placing an order uses `checkoutPage.placeOrder()`, which clicks Confirm and clicks again only if "Payment was successful" shows. The tests assert only the final confirmation.

## 2. Scenarios executed live

All 13 were executed live. For the first four rows, "held" means every step ran and every expectation held.

| # | Executed | Held on the site |
|---|---|---|
| 1.1 | Yes | Held. The badge showed 1. The step bar showed Cart, Sign in, Billing Address, Payment. One row, quantity 1, $14.15 unit price, $14.15 line total and $14.15 total. |
| 1.2 | Yes | Held. One row, quantity 2, line total and total $28.30. |
| 1.3 | Yes | Held. After 0 and after -1, followed by Tab, the quantity went back to 1 and the total was $14.15. |
| 1.4 | Yes | Did not hold, see section 4 (no message in a fresh session). |
| 1.5 | Yes | Held. The Add to cart button on "Long Nose Pliers" is disabled and "Out of stock" is shown. |
| 2.1 | Yes | Held. The message was "Hello <name>, you are already logged in. You can proceed to checkout." with no email or password fields. The next click showed the Billing Address form. |
| 2.2 | Yes | Held. Proceed was disabled at first, enabled once country, postal code and house number were filled, and disabled again after clearing the house number. |
| 2.3 | Yes | Held. "The postcode field must not be greater than 10 characters." showed and Proceed stayed disabled. |
| 3.1 | Yes | The three messages held and Confirm was disabled after the invalid input. Confirm was already enabled before any input, see section 4. |
| 3.2 | Yes | Held. "Expiration date must be in the future." showed for a past expiry. |
| 3.3 | Yes | Did not hold at step 1. Confirm was enabled right after choosing each method, before anything was filled. Filling the fields kept it enabled. |
| 4.1 | Yes | Held. Confirm showed "Payment was successful", a second Confirm showed "Thanks for your order! Your invoice number is INV-2026000009.", and the cart badge was gone. The invoice appeared under My account > Invoices with the same number. |
| 4.2 | Yes | Held. The same two-click flow gave the same confirmation. |

## 3. What the specs need

### New fixtures
In `/Users/rahul/Projects/portfolio/playwright-qa-agent/fixtures.ts`, add the imports and three types and fixture lines:
```ts
checkoutPage: CheckoutPage;  accountPage: AccountPage;  invoicesPage: InvoicesPage;
checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
accountPage: async ({ page }, use) => use(new AccountPage(page)),
invoicesPage: async ({ page }, use) => use(new InvoicesPage(page)),
```

### Changes to existing page objects
- **`ProductPage`**
  - Change `addToCartButton` from `private readonly` to `readonly`; the 1.5 test asserts on it.
  - Its locator stays `getByRole('button', { name: 'Add to cart' })`.
  - The snapshot sometimes showed the button unnamed. After the click it showed "Add to cart", and the data-test is `add-to-cart`.
  - If the role locator is flaky, fall back to `getByTestId('add-to-cart')`.
- **`Header`**
  - Add `openCart(): Promise<void>`, wrapped in `test.step('Open the cart')`, which clicks `getByTestId('nav-cart')`. The link's accessible name is "cart".
  - Add `openMyAccount(): Promise<void>`, wrapped in `test.step('Open My account')`. It clicks `getByTestId('nav-menu')`, then `getByTestId('nav-my-account')`, which goes to /account.
  - `cartCount()` already exists. When the cart is empty the badge is absent, so it returns 0.
- **`CartPage`**: keep `open()` and `productTitles`, and add the following.
  - `unitPrices = getByTestId('product-price')`
  - `linePrices = getByTestId('line-price')`
  - `total = getByTestId('cart-total')`
  - `emptyMessage = getByText('The cart is empty. Nothing to display.')`
  - `quantityInput(productName: string): Locator` returns `getByRole('spinbutton', { name: \`Quantity for ${productName}\` })`. The test id is `product-quantity`.
  - `enterQuantity(productName: string, value: string): Promise<void>`, wrapped in `test.step('Enter a quantity')`, fills the input and then presses `Tab`, so the value is committed on leaving the field.
  - `proceedToCheckout(): Promise<void>`, wrapped in `test.step('Proceed to checkout from the cart')`, clicks `getByTestId('proceed-1')`.

### New `pages/CheckoutPage.ts` (class `CheckoutPage`)
Locators:
- `steps`: the step bar. It is a `ul` with `li` items whose text is "Cart 1", "Sign in 2" and so on. Use `page.getByRole('list').filter({ hasText: 'Billing Address' }).getByRole('listitem')`. The tests assert `toHaveText([/Cart/, /Sign in/, /Billing Address/, /Payment/])`. Check that the filter matches only the step-bar list.
- `signInMessage = getByText(/you are already logged in/)`. The name is "QA Run" here and changes per account.
- `loginFields = getByLabel(/email|password/i)`. The login form's labels were not seen, so the 2.1 "no fields" check rests on this assumption.
- `billingHeading = getByRole('heading', { name: 'Billing Address' })`
- `countrySelect = getByTestId('country')`, labelled "Country"
- `postalCodeField = getByTestId('postal_code')`, labelled "Postal code"
- `houseNumberField = getByTestId('house_number')`, labelled "House number"
- `postalCodeTooLongMessage = getByText('The postcode field must not be greater than 10 characters.')`. The element has data-test `postcode-lookup-error` and class `alert alert-danger`.
- `addressProceedButton = getByTestId('proceed-3')`
- `paymentMethodSelect = getByTestId('payment-method')`, labelled "Payment Method"
- `confirmButton = getByTestId('finish')`, a button named "Confirm"
- `cardNumberError = getByText('Invalid card number format.')`
- `expiryFormatError = getByText('Invalid date format. Use MM/YYYY.')`
- `expiryPastError = getByText('Expiration date must be in the future.')`
- `cvvError = getByText('CVV must be 3 or 4 digits.')`
- `orderConfirmation = getByText(/Thanks for your order! Your invoice number is INV-\d+/)`. It has no data-test.

Methods, each wrapped in `test.step` with a name that holds no typed values:
- `proceedFromSignIn()` clicks `proceed-2`.
- `proceedFromAddress()` clicks `proceed-3`. The button enables once the street lookup finishes, so the click auto-waits.
- `chooseCountry(name: string)` calls `countrySelect.selectOption({ label: name })`. The list has 249 entries and starts with nothing selected.
- `fillPostalCode(v)`, `fillHouseNumber(v)` and `clearHouseNumber()` use `fill`.
- `fillAddress(a: Address)` runs the three steps above.
- `choosePaymentMethod(label: string)` calls `paymentMethodSelect.selectOption({ label })`. The labels are "Bank Transfer", "Cash on Delivery", "Credit Card", "Buy Now Pay Later" and "Gift Card".
- `enterCardNumber(v)`, `enterExpiry(v)` and `enterCvv(v)` fill the field and then press `Tab`, so the field is left. The test ids are `credit_card_number`, `expiration_date` and `cvv`.
- `fillCreditCard(c: Card)` enters number, expiry and CVV, and fills `card_holder_name`.
- `fillPaymentTextField(label: string, value: string)` calls `getByLabel(label, { exact: true }).fill(value)`. The labels are "Bank Name", "Account Name", "Account Number", "Gift Card Number" and "Validation Code".
- `choosePaymentSelectField(label: string, option: string)` calls `getByLabel(label).selectOption({ label: option })`. The label is "Monthly Installments" and the option is "3 Monthly Installments".
- `placeOrder()`:
  1. Click `confirmButton`.
  2. Wait for `orderConfirmation.or(paymentWasSuccessful).first()`, where `paymentWasSuccessful = getByText('Payment was successful')`.
  3. If `paymentWasSuccessful` is visible, click `confirmButton` again. Confirm stays visible after the first click, so this is safe.
  4. Wait for `orderConfirmation` to be visible.
- `invoiceNumber(): Promise<string>` returns `/INV-\d+/` from `orderConfirmation.innerText()`. The test asserts the confirmation is visible first, and uses the result only to build a locator.

### New `pages/AccountPage.ts` (class `AccountPage`)
- `openInvoices()` clicks `getByTestId('nav-invoices')` on /account. It is the third of four icon buttons, with no visible text, so the role-based name is uncertain.

### New `pages/InvoicesPage.ts` (class `InvoicesPage`)
- `invoiceRow(number: string): Locator` returns `getByRole('row', { name: new RegExp(number) })`. The table has the columns Invoice Number, Billing Address, Invoice Date, Total, plus a "Details" link.

### Other test ids seen
- `proceed-1`, `proceed-2`, `proceed-3`, `finish`, `payment-method`, `country`, `postal_code`, `house_number`
- `street`, `city`, `state` (autofilled by the site, not asserted)
- `postcode-lookup-hint`, `postcode-lookup-error`
- `product-title`, `product-quantity`, `product-price`, `line-price`, `cart-total`, `continue-shopping`
- `nav-cart`, `cart-quantity`, `nav-menu`, `nav-my-account`, `nav-my-invoices`, `nav-invoices`
- `credit_card_number`, `expiration_date`, `cvv`, `card_holder_name`
- `bank_name`, `account_name`, `account_number`, `monthly_installments`, `gift_card_number`, `validation_code`
- `add-to-cart`, `out-of-stock` (on the product page)

### Test data
In `test-data/products.ts`, add these exports. `cartProduct` stays as it is.
```ts
export const inStockProduct = { name: 'Combination Pliers', price: 14.15 };
export const outOfStockProduct = { name: 'Long Nose Pliers' };
```

New `test-data/checkout.ts`:
```ts
export const formatPrice = (n: number) => `$${n.toFixed(2)}`;
export type Address = { country: string; postalCode: string; houseNumber: string };
export type Card = { number: string; expiry: string; cvv: string; holder: string };
export const billingAddress: Address = { country: 'Netherlands (the)', postalCode: '1011AB', houseNumber: '42' };
export const tooLongPostalCode = '12345678901'; // 11 characters
export const validCard: Card = { number: '0000-0000-0000-0000', expiry: '12/2030', cvv: '000', holder: 'Test Holder' };
export const invalidCardInput = { shortNumber: '0000-0000', wrongFormatExpiry: '1234', shortCvv: '1' };
export const pastExpiry = '01/2020';
export const otherPaymentMethods = [
  { method: 'Bank Transfer', textFields: [
      { label: 'Bank Name', value: 'Test Bank' }, { label: 'Account Name', value: 'Test Account' },
      { label: 'Account Number', value: '00000000' }], selectFields: [] },
  { method: 'Buy Now Pay Later', textFields: [],
    selectFields: [{ label: 'Monthly Installments', option: '3 Monthly Installments' }] },
  { method: 'Gift Card', textFields: [
      { label: 'Gift Card Number', value: '0000000000000000' }, { label: 'Validation Code', value: '0000' }],
    selectFields: [] },
];
```
- **Expiry date:** `validCard.expiry` of '12/2030' stops being valid in December 2030. Compute a future year in the data file if that matters.
- **Observed values:** the gift card number is 16 characters and the validation code is 4. The site's hints say 16 letters or digits and a 4-character code. I did not test whether other lengths are refused. The bank account number was accepted as "00000000".
- **Fake values:** all values above are plainly fake. The addresses and card data stay in test-data only, never in step names or titles.

## 4. Where the plan and the site differ

1. **1.4, an empty cart (the spec will fail).**
   - Plan: open /checkout with nothing in the cart and see "The cart is empty. Nothing to display."
   - Site: in a fresh session with no cart, /checkout shows only the step bar (Cart, Sign in, Billing Address, Payment) and no message. The header also loses the account menu ("QA Run") and Sign in on that page. The console shows "TypeError: Cannot read properties of null (reading 'cart_items')".
   - The message appears only when a cart exists with 0 items. I got it by adding a product and removing it, which left `cart_quantity` at 0 and a `cart_id` set.
   - The spec keeps the plan's expectation.
2. **3.3, Confirm disabled after choosing a method (the spec will fail).**
   - Plan: Confirm stays disabled until the chosen method is valid.
   - Site: Confirm is enabled right after choosing Bank Transfer, Buy Now Pay Later or Gift Card, before anything is filled. I saw the same for Bank Transfer on a fresh page. It is also enabled on an empty Credit Card form. It does show as disabled before any method is chosen.
   - The spec keeps `toBeDisabled()` before filling, so the first loop pass fails. I did not click the enabled Confirm on an empty form to see what happens.
3. **3.1, same cause.** After the invalid card input, Confirm is disabled, so the assertion holds. But on an empty Credit Card form it is enabled, which contradicts the plan's line that Confirm stays disabled until valid.
4. **4.1, My account then Invoices.**
   - Plan: open My account, then Invoices.
   - Site: the account menu also has a direct "My invoices" link (`nav-my-invoices`, /account/invoices). I followed the plan: My account (/account), then the Invoices icon button (`nav-invoices`), which has no visible text.
5. **2.1, step bar and message text.** The text matched: "Hello QA Run, you are already logged in. You can proceed to checkout." The name varies per account, so the spec matches `/you are already logged in/`.
6. **Login lifetime.**
   - My first session expired about 6 minutes in; the header showed "Sign in" again. I re-ran `generator_setup_page` for 4.1 and 4.2.
   - A full suite run could cross the 5-minute limit. The plan lists this under "Later" and I did not handle it.

Notes 7, 8 and 11 were seen but not asserted. Note 7 shows up in both orders: the first Confirm showed "Payment was successful" and the second placed the order. Note 8 is not asserted anywhere. The console errors (note 11) also appear on every cart load, with a different message, "Cannot read properties of null", when there is no cart.
