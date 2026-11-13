# Checkout Test Plan

## Application Overview

Checkout on the normal Sprint 5 Toolshop (http://localhost:4200), from a cart with products, through the four steps (Cart, Sign in, Billing Address, Payment), to the order confirmation. Project: logged-in. Seed: tests/seed.spec.ts. Every scenario starts from a fresh state: the saved session is logged in and the cart is empty; each test adds its own products through the product page (Add to cart) and never relies on another test. Observed on the page: the step bar shows Cart, Sign in, Billing Address, Payment; for a logged-in user the Sign in step shows "Hello <name>, you are already logged in. You can proceed to checkout." with one Proceed button; Billing Address needs Country, Postal code, House number (Street, City and State are filled in by the site) and the Proceed button stays disabled until the form is complete; Payment offers Bank Transfer, Cash on Delivery, Credit Card, Buy Now Pay Later and Gift Card, and Confirm stays disabled until the chosen method is valid. Credit card fields show these messages: "Invalid card number format.", "Invalid date format. Use MM/YYYY.", "CVV must be 3 or 4 digits."; a valid Confirm shows "Payment was successful". LIMIT OF THIS PLAN: the order confirmation screen itself was NOT reached while exploring (see "Open items"). Steps and expected results for section 4 are therefore marked UNVERIFIED and must be checked by a person on the normal site before tests are written. No test may assert anything listed in docs/observed-notes.md, and no value typed by a test (card data, address) may appear in a step name or test title. Locators: role or label first, then getByTestId (cart and step buttons use data-test: proceed-1, proceed-2, proceed-3, payment-method, credit_card_number, expiration_date, cvv, card_holder_name, finish). Page objects needed in pages/ (one line each in fixtures.ts): a cart/checkout page object (cart table, step bar, step actions) and, if missing, a product page object with Add to cart. Test data (address, card values, product names and prices) goes in test-data/.

Open items for the QA engineer (not for assertion):
1. Order confirmation not observed. Pressing Confirm with a valid card showed "Payment was successful", but the page stayed on the Payment step; a second Confirm sent POST /invoices twice and both answered 401 Unauthorized. The exploration session had been idle for a long time (the browser tool stalled for about 30 minutes before this step), so an expired login token is the likely cause, not a site defect. Not reproduced with a fresh session: a second attempt also stalled in the tool and was not completed. A person should run the full path once by hand with a fresh login and record what the confirmation shows (heading, invoice number, URL) before section 4 is turned into tests.
2. The invoice number format, the order appearing under My account > Invoices, and whether the cart is emptied after the order are unverified.
3. Candidate observed notes (not added to docs/observed-notes.md by this plan; the QA engineer decides): (a) the cart page logs "Cannot read properties of undefined (reading 'cart_items')" errors in the browser console while the cart loads, though the cart then displays correctly; (b) the address autofill returned Bozkurtweg / Wezuperbrug / Drenthe for NL 1011 AB 42, which does not look like a real address for that postal code; (c) opening /checkout with no cart left the step bar visible but showed no cart table and no message, with many console errors. None of these is asserted by any scenario below.
4. Environment: the exploring browser tool hung twice on long run-code scripts. Tests must use short, step-by-step actions, no hard waits.

## Test Scenarios

### 1. 1. Cart step

**Seed:** `tests/seed.spec.ts`

#### 1.1. Cart shows the added product with price, quantity and total

**File:** `tests/checkout/cart-step.spec.ts`

**Steps:**
  1. Open a product page from the home list (for example Pliers, $12.01) and click Add to cart
    - expect: The cart icon in the menu shows 1
  2. Open the cart through the cart link in the menu
    - expect: URL is /checkout
    - expect: Step bar shows Cart, Sign in, Billing Address, Payment
    - expect: Table has one row with the product name, quantity 1, the unit price and a line total equal to the unit price
    - expect: Total row equals the line total
    - expect: Buttons Continue Shopping and Proceed to checkout are visible

#### 1.2. Cart with two different products and a quantity above one shows correct line totals and grand total

**File:** `tests/checkout/cart-totals.spec.ts`

**Steps:**
  1. Add two different products to the cart; for the first, raise Quantity to 3 on the product page before adding
    - expect: Cart icon shows the total number of items
  2. Open the cart
    - expect: Two rows; each line total equals unit price times quantity
    - expect: Total equals the sum of the line totals

#### 1.3. Changing a quantity in the cart updates the line total and the grand total

**File:** `tests/checkout/cart-quantity.spec.ts`

**Steps:**
  1. Add one product, open the cart, set the Quantity field of that row to 2
    - expect: Line total and Total show twice the unit price
    - expect: Cart icon count updates to match

#### 1.4. Removing a product from the cart updates the total

**File:** `tests/checkout/cart-remove.spec.ts`

**Steps:**
  1. Add two products, open the cart, use the remove control at the end of one row
    - expect: Only the other product remains
    - expect: Total equals that product's line total

#### 1.5. Continue Shopping returns to the product list and keeps the cart

**File:** `tests/checkout/cart-continue.spec.ts`

**Steps:**
  1. Add a product, open the cart, click Continue Shopping
    - expect: The home product list is shown
    - expect: Cart icon still shows the item count

#### 1.6. Cart with an invalid quantity (0 or negative) is not accepted (negative test)

**File:** `tests/checkout/cart-quantity-invalid.spec.ts`

**Steps:**
  1. Add a product, open the cart, enter 0 and then -1 in the Quantity field
    - expect: UNVERIFIED: expected the site to refuse the value or keep a quantity of at least 1; the tester records what happens and the QA engineer decides the assertion. If the behaviour is unclear it becomes an observed note, not a test.

### 2. 2. Sign in and billing address steps

**Seed:** `tests/seed.spec.ts`

#### 2.1. Logged-in user passes the Sign in step with one click

**File:** `tests/checkout/signin-step.spec.ts`

**Steps:**
  1. Add a product, open the cart, click Proceed to checkout
    - expect: Sign in step shows the greeting with the account's name and 'you are already logged in'
    - expect: No email or password fields are shown
    - expect: A Proceed to checkout button is visible
  2. Click Proceed to checkout
    - expect: Billing Address heading and form are shown

#### 2.2. Billing form blocks Proceed until the required fields are filled

**File:** `tests/checkout/billing-required.spec.ts`

**Steps:**
  1. Reach the Billing Address step
    - expect: Proceed to checkout is disabled
    - expect: Fields Country, Postal code, House number, Street, City, State are shown
  2. Choose a country, fill Postal code and House number, leave the form otherwise untouched
    - expect: Street, City and State are filled in by the site
    - expect: Proceed to checkout becomes enabled
  3. Clear the House number
    - expect: Proceed to checkout is disabled again

#### 2.3. Billing form accepts a manually typed address

**File:** `tests/checkout/billing-manual.spec.ts`

**Steps:**
  1. Fill all six fields by hand, overwriting any autofilled Street, City and State
    - expect: Proceed to checkout is enabled
    - expect: Clicking it opens the Payment step

#### 2.4. Billing address values stay when the user goes back to an earlier step and forward again

**File:** `tests/checkout/billing-back-forward.spec.ts`

**Steps:**
  1. Fill the billing form, click Proceed, then click the Billing Address step in the step bar
    - expect: UNVERIFIED: the previously typed values are still present or the form is empty; record which, do not assert until the QA engineer decides.

#### 2.5. Step bar lets the user return to the Cart step and the cart is unchanged

**File:** `tests/checkout/step-bar-back.spec.ts`

**Steps:**
  1. Reach the Billing Address step, then click Cart in the step bar
    - expect: Cart table shows the same products, quantities and total

#### 2.6. Billing form with an unusual postal code or house number (negative)

**File:** `tests/checkout/billing-invalid.spec.ts`

**Steps:**
  1. Enter letters-only or very long values in Postal code and House number
    - expect: UNVERIFIED: site may leave Street/City/State empty and keep Proceed disabled; the tester records the behaviour. Assert only the disabled Proceed button if confirmed.

### 3. 3. Payment step

**Seed:** `tests/seed.spec.ts`

#### 3.1. Payment step lists all methods and Confirm is disabled until a method is chosen

**File:** `tests/checkout/payment-methods.spec.ts`

**Steps:**
  1. Reach the Payment step
    - expect: Payment Method dropdown shows the placeholder 'Choose your payment method' plus Bank Transfer, Cash on Delivery, Credit Card, Buy Now Pay Later, Gift Card
    - expect: Confirm is disabled

#### 3.2. Credit card form shows a message for each invalid field and keeps Confirm disabled

**File:** `tests/checkout/payment-card-invalid.spec.ts`

**Steps:**
  1. Choose Credit Card; enter a too-short card number, an impossible expiry (month and year out of range, wrong format) and a one-digit CVV; move focus to the next field after each
    - expect: 'Invalid card number format.' is shown
    - expect: 'Invalid date format. Use MM/YYYY.' is shown
    - expect: 'CVV must be 3 or 4 digits.' is shown
    - expect: Confirm is disabled

#### 3.3. Credit card number without hyphens is rejected

**File:** `tests/checkout/payment-card-format.spec.ts`

**Steps:**
  1. Choose Credit Card and enter 16 digits without hyphens
    - expect: The card number format message is shown (the help text asks for 0000-0000-0000-0000)

#### 3.4. Credit card with an expired date (negative)

**File:** `tests/checkout/payment-card-expired.spec.ts`

**Steps:**
  1. Enter a well-formed expiry date in the past (MM/YYYY)
    - expect: UNVERIFIED: format check passes; whether the site rejects a past date is unknown. Record it; do not assert until decided.

#### 3.5. Each payment method shows its own fields and can be confirmed

**File:** `tests/checkout/payment-each-method.spec.ts`

**Steps:**
  1. For each of Bank Transfer, Cash on Delivery, Buy Now Pay Later and Gift Card, select it and inspect the fields (data-driven from a table in test-data/)
    - expect: Fields differ by method; Confirm stays disabled until the fields of that method are valid
    - expect: UNVERIFIED: the exact fields and valid values for Bank Transfer, Buy Now Pay Later and Gift Card were not explored; the tester records them first.

#### 3.6. Switching payment method clears the previous method's errors

**File:** `tests/checkout/payment-switch.spec.ts`

**Steps:**
  1. Choose Credit Card, enter an invalid CVV, then switch to Cash on Delivery and back to Credit Card
    - expect: UNVERIFIED: record whether fields and errors are reset.

#### 3.7. Valid credit card shows 'Payment was successful'

**File:** `tests/checkout/payment-success.spec.ts`

**Steps:**
  1. Choose Credit Card; enter a well-formed card number with hyphens, a future expiry in MM/YYYY, a 3-digit CVV and a holder name; click Confirm
    - expect: The message 'Payment was successful' is shown
    - expect: Confirm stays available (observed: page remains on the Payment step until Confirm is pressed again)

### 4. 4. Order confirmation (UNVERIFIED, needs one manual run first)

**Seed:** `tests/seed.spec.ts`

#### 4.1. Happy path: cart to order confirmation with a card payment

**File:** `tests/checkout/happy-path-card.spec.ts`

**Steps:**
  1. Add a product, open the cart, Proceed; Proceed on the Sign in step; fill the billing form; Proceed; choose Credit Card and fill valid data; click Confirm (and Confirm again if the page stays on Payment after 'Payment was successful')
    - expect: UNVERIFIED: an order confirmation is shown with an invoice or order number and a message that the order was placed; the QA engineer records the exact text and URL by hand first
    - expect: Cart icon no longer shows items (UNVERIFIED)
    - expect: Tag: @sanity once verified

#### 4.2. Happy path with Cash on Delivery

**File:** `tests/checkout/happy-path-cod.spec.ts`

**Steps:**
  1. Same as above, but choose Cash on Delivery
    - expect: UNVERIFIED: same confirmation as the card path

#### 4.3. Confirmation total matches the cart total

**File:** `tests/checkout/confirmation-total.spec.ts`

**Steps:**
  1. Add two products with different quantities, complete checkout, compare the cart Total noted earlier with the amount on the confirmation or invoice
    - expect: UNVERIFIED: amounts are equal

#### 4.4. The placed order appears under My account > Invoices

**File:** `tests/checkout/order-in-invoices.spec.ts`

**Steps:**
  1. After completing checkout, open My account, then Invoices
    - expect: UNVERIFIED: a new invoice with the number from the confirmation is listed

#### 4.5. Reloading the confirmation or pressing Back does not place a second order

**File:** `tests/checkout/no-duplicate-order.spec.ts`

**Steps:**
  1. After the confirmation, reload the page, then press the browser Back button
    - expect: UNVERIFIED: the Invoices list still holds one new invoice, not two

#### 4.6. Out-of-stock product cannot be bought (negative)

**File:** `tests/checkout/out-of-stock.spec.ts`

**Steps:**
  1. Open a product marked 'Out of stock' on the home list (for example Long Nose Pliers)
    - expect: UNVERIFIED: Add to cart is disabled or hidden; record what the page shows before asserting

#### 4.7. Expired session at the last step does not create an order (negative)

**File:** `tests/checkout/session-expired.spec.ts`

**Steps:**
  1. Reach the Payment step, clear the saved login (token) in the browser storage, enter valid card data and click Confirm
    - expect: No order confirmation is shown
    - expect: The user is not shown a false success for the order
    - expect: UNVERIFIED: whether the site sends the user to the login page or shows an error; observed earlier: POST /invoices answered 401 and the page stayed on Payment with no visible error message. The QA engineer decides whether that is an observed note.

### 5. 5. Empty and edge states

**Seed:** `tests/seed.spec.ts`

#### 5.1. Opening the checkout with an empty cart

**File:** `tests/checkout/empty-cart.spec.ts`

**Steps:**
  1. With a fresh state and nothing in the cart, open /checkout
    - expect: No cart rows are shown and the user cannot reach the Payment step
    - expect: UNVERIFIED: whether a message such as 'cart is empty' appears; observed only the step bar, no table. Record it and put it in observed notes if unclear.

#### 5.2. Cart survives a page reload

**File:** `tests/checkout/cart-reload.spec.ts`

**Steps:**
  1. Add a product, open the cart, reload the page
    - expect: The same product, quantity and total are shown

#### 5.3. Product added twice combines into one row with quantity 2 (or two rows)

**File:** `tests/checkout/cart-add-twice.spec.ts`

**Steps:**
  1. Click Add to cart on the same product twice, open the cart
    - expect: UNVERIFIED: record whether the site merges the lines; the total must equal the unit price times the total quantity whichever way it is shown
