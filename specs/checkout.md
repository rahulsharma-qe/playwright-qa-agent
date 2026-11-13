# Checkout test plan

Prepared by: AI test planner (AI-01) · Edited by: QA engineer (second commit)
Scope set by: QA engineer (the prompt was passed to the planner word for word)
Verified by hand: QA engineer, 13-11-2026 (section 4 and every item the planner marked UNVERIFIED)
Approved by: QA engineer, pull request #22
Corrected 13-11-2026 after the AI test generator's report (1.4, 3.1, 3.3), checked by hand by the QA engineer

## Application overview

Checkout on the normal Sprint 5 Toolshop (http://localhost:4200), from a cart with products, through the four steps
(Cart, Sign in, Billing Address, Payment), to the order confirmation. Project: logged-in. Seed: tests/seed.spec.ts.
Every scenario starts from a fresh state: the saved session is logged in and the cart is empty; each test adds its
own products through the product page (Add to cart) and never relies on another test.

Seen on the normal site:
- The step bar shows Cart, Sign in, Billing Address, Payment. For a logged-in user, the Sign in step shows "Hello
  <name>, you are already logged in. You can proceed to checkout." with one Proceed button.
- Billing Address needs Country, Postal code and House number; the site fills in Street, City and State (the values
  are made up by the demo site and are not asserted). Proceed stays disabled until the form is complete.
- Payment offers Bank Transfer, Cash on Delivery, Credit Card, Buy Now Pay Later and Gift Card. Confirm is
  disabled until a method is chosen; once one is chosen it is enabled even while the form is empty (observed note
  13), and an invalid value in a field disables it again. Fields per method: Bank Transfer: Bank Name, Account Name, Account
  Number. Buy Now Pay Later: monthly installments (3, 6, 9 or 12). Gift Card: Gift card number, Validation Code.
  Credit Card: card number (0000-0000-0000-0000), expiry (MM/YYYY), CVV, card holder name.
- Placing an order takes two clicks on Confirm: the first shows "Payment was successful" and stays on the Payment
  step; the second shows "Thanks for your order! Your invoice number is INV-…". The address stays /checkout. This is
  observed note 7: tests click Confirm, then click it again only if "Payment was successful" shows on the Payment
  step, and assert only the final confirmation, so they pass whether the site needs one click or two.
- After the order the cart is empty, and the invoice is listed under My account > Invoices with the same number.
- Reloading the confirmation removes it from the screen; Back goes to the product list. Neither places a second
  order (checked by hand on 13-11-2026).
- The login made through the API lasts 5 minutes (see docs/lld.md).

Rules for the tests: nothing from docs/observed-notes.md is asserted; no value typed by a test (card data, address)
appears in a step name or test title; locators by role or label first, then getByTestId (data-test: proceed-1,
proceed-2, proceed-3, payment-method, credit_card_number, expiration_date, cvv, card_holder_name, finish); no hard
waits. Page objects in pages/ (one line each in fixtures.ts): a cart and checkout page object, and a product page
object with Add to cart if one is missing. Test data in test-data/: addresses, plainly fake card values in the
0000-0000-0000-0000 shape, product names and prices.

Checkout tests leave orders on the site they run against (the public site resets every hour).

## Test scenarios (core set)

### 1. Cart step

**Seed:** `tests/seed.spec.ts`

#### 1.1. Cart shows the added product with price, quantity and total

**File:** `tests/checkout/cart.spec.ts`

**Steps:**
  1. Open an in-stock product page from the home list and click Add to cart
    - expect: The cart icon in the menu shows 1
  2. Open the cart through the cart link in the menu
    - expect: The step bar shows Cart, Sign in, Billing Address, Payment
    - expect: One row with the product name, quantity 1, the unit price and a line total equal to the unit price
    - expect: The total equals the line total

#### 1.2. The same product added twice is one row with quantity 2

**File:** `tests/checkout/cart.spec.ts`

**Steps:**
  1. Click Add to cart twice on the same product, open the cart
    - expect: One row, quantity 2, line total and total equal to twice the unit price

#### 1.3. An invalid quantity in the cart goes back to 1

**File:** `tests/checkout/cart.spec.ts`

**Steps:**
  1. Add a product, open the cart, enter 0 in the Quantity field, then leave the field
    - expect: The quantity is 1 again and the total equals the unit price
  2. Enter -1, then leave the field
    - expect: The quantity is 1 again and the total equals the unit price
    - Not asserted: the total shown while the field still holds 0 or -1 (observed note 8)

#### 1.4. An empty cart says so

**File:** `tests/checkout/cart.spec.ts`

**Steps:**
  1. Add a product, open the cart, and remove the product on the cart page
    - expect: The message "The cart is empty. Nothing to display." is shown
    - Not asserted: /checkout opened directly, with no cart or with an emptied cart, shows no message (observed
      note 12)

#### 1.5. An out-of-stock product cannot be added to the cart

**File:** `tests/checkout/cart.spec.ts`

**Steps:**
  1. Open a product marked "Out of stock" (the product name is in test-data/)
    - expect: The Add to cart button is disabled

### 2. Sign in and billing address steps

**Seed:** `tests/seed.spec.ts`

#### 2.1. A logged-in user passes the Sign in step with one click

**File:** `tests/checkout/sign-in-and-address.spec.ts`

**Steps:**
  1. Add a product, open the cart, click Proceed to checkout
    - expect: The Sign in step says the user is already logged in, with no email or password fields
  2. Click Proceed to checkout
    - expect: The Billing Address form is shown

#### 2.2. Proceed stays disabled until the address is complete

**File:** `tests/checkout/sign-in-and-address.spec.ts`

**Steps:**
  1. Reach the Billing Address step
    - expect: Proceed to checkout is disabled
  2. Choose a country, fill Postal code and House number
    - expect: Proceed to checkout is enabled
  3. Clear the House number
    - expect: Proceed to checkout is disabled again

#### 2.3. A postal code longer than 10 characters is refused

**File:** `tests/checkout/sign-in-and-address.spec.ts`

**Steps:**
  1. Enter a postal code longer than 10 characters and a house number
    - expect: The message "The postcode field must not be greater than 10 characters." is shown
    - expect: Proceed to checkout stays disabled

### 3. Payment step

**Seed:** `tests/seed.spec.ts`

#### 3.1. Invalid credit card fields show their messages and keep Confirm disabled

**File:** `tests/checkout/payment.spec.ts`

**Steps:**
  1. Choose Credit Card; enter a too-short card number, an expiry in the wrong format and a one-digit CVV, leaving
     each field after typing
    - expect: "Invalid card number format." is shown
    - expect: "Invalid date format. Use MM/YYYY." is shown
    - expect: "CVV must be 3 or 4 digits." is shown
    - expect: Confirm is disabled

#### 3.2. An expiry date in the past is refused

**File:** `tests/checkout/payment.spec.ts`

**Steps:**
  1. Choose Credit Card and enter a well-formed expiry date in the past (MM/YYYY)
    - expect: "Expiration date must be in the future." is shown

#### 3.3. An invalid Bank Transfer or Gift Card field shows its message and disables Confirm

**File:** `tests/checkout/payment.spec.ts`

**Steps:**
  1. Choose Bank Transfer and enter a Bank Name with a digit, then leave the field
    - expect: "Bank name can only contain letters and spaces." is shown
    - expect: Confirm is disabled
  2. Choose Gift Card and enter a Gift Card Number that is not 16 letters or digits, then leave the field
    - expect: "Please enter a valid gift card number: exactly 16 letters and/or digits." is shown
    - expect: Confirm is disabled
    - Not asserted: Confirm on an empty form (observed note 13); what remains of another method's errors after
      switching (observed note 10)

Buy Now Pay Later is not in 3.3: its only field is a list, so nothing invalid can be entered. Credit Card: covered by
3.1.

### 4. Order confirmation

**Seed:** `tests/seed.spec.ts`

#### 4.1. Happy path with a credit card

**File:** `tests/checkout/place-order.spec.ts`

**Steps:**
  1. Tag: @sanity. Add a product, open the cart, Proceed; Proceed on the Sign in step; fill the address; Proceed;
     choose Credit Card and fill valid, plainly fake data; click Confirm; if "Payment was successful" shows on the
     Payment step, click Confirm again (observed note 7)
    - expect: "Thanks for your order! Your invoice number is INV-" followed by digits is shown
    - expect: The cart icon shows no items
  2. Open My account, then Invoices
    - expect: An invoice with the number from the confirmation is listed

#### 4.2. Happy path with Cash on Delivery

**File:** `tests/checkout/place-order.spec.ts`

**Steps:**
  1. Same as 4.1 (including the conditional second Confirm), but choose Cash on Delivery
    - expect: The same confirmation, with an invoice number

## Later (not in this slice)

Kept from the planner's 30 scenarios, left for later to keep the slice small: removing a product from the cart;
Continue Shopping keeps the cart; changing a quantity in the cart; totals for two products with quantities; the
cart after a reload; going back to the Cart step from the step bar; a typed address that overrides the autofill;
the confirmation total against the cart total; an expired login at the last step (the login lasts 5 minutes; a test
would have to wait for it or clear it); a second order after reload or Back (checked by hand on 13-11-2026: none).

Left out because what the planner expected is not what the normal site does, or it is an open question:
- The address values after going back to the Billing Address step: observed note 9.
- Switching payment methods after an error: observed note 10.
- Unusual postal codes beyond the length check: the fields keep their values and Proceed stays disabled; only the
  length message (2.3) is asserted.

## Observed notes from this plan

In docs/observed-notes.md, each seen by the QA engineer on the normal site on 13-11-2026: 7 (two Confirms),
8 (cart total while the quantity is 0 or -1), 9 (house number lost when going back), 10 (a CVV error stays after
switching methods), 11 (console errors on the cart page). Found by the AI test generator and checked by hand by the
QA engineer on 13-11-2026: 12 (no empty-cart message on a direct /checkout), 13 (Confirm enabled on an empty payment
form). Never asserted.
