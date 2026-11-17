# Observed notes for the team

Behaviour seen on the normal Sprint 5 site that the tests do **not** assert, because the team has not yet said what
is intended. One row per note; the plan or test that met it links here. Every note says who saw it and when, and
whether a person has checked it on the normal site. (Number 5 is not used: that note was removed.) When the team answers, the note records the
answer and the date, and a test may then assert it.

Not a bug list: the team's bug-tracking tool stays the place for defects. A note moves there once the team calls it
a defect.

## Category filters ([specs/category-filters.md](../specs/category-filters.md))

1. **Search and category filter act differently by order.** A search after ticking a category clears the tick
   ("Hammer", then search "Claw"). A category ticked after a search keeps the search: "drill" then "Hand Tools"
   shows "There are no products found."; "drill" then "Power Tools" shows 2 drills. Team to confirm the intended
   behaviour. Seen by: QA engineer, 11-11-2026, reviewing the plan. Status: open.
2. **Two drills are not found by the category filter.** Searching "drill" finds 4 cordless drills (20V, 24V, 18V,
   12V). The product pages of all four show the category "Drill", yet ticking Power Tools (or its child Drill) shows
   only 24V and 12V. Team to confirm why 20V and 18V are left out. Seen by: QA engineer, 11-11-2026, reviewing the plan. Status: open.
3. **Search does not match a plural.** "Drills" finds no products, while "drill" finds 4. Team to confirm whether
   search should match plurals. Seen by: QA engineer, 11-11-2026, reviewing the plan. Status: open.
4. **A parent stays fully ticked after one child is unticked.** Tick "Hand Tools", then untick "Wrench": the list
   is right, but "Hand Tools" still shows a full tick; a partial tick (dash) would show that only some children are
   chosen. Team to confirm. Seen by: QA engineer, 11-11-2026, reviewing the plan. Status: open.
6. **Quick key presses on the price slider can leave the list on an older price.** In an automated run at 2 workers
   (category filters, 3.3), the slider showed 15 but the list stayed on Hand Tools without the price limit (3 pages)
   for 5 s. Each key press asks the site for a new list, and the answers may arrive out of order. Team to confirm.
   Seen by: automated test run, 12-11-2026, 2 workers; not reproduced by hand (the QA engineer tried on the normal
   site; it was slow). The trace was not kept: the next run cleared test-results/ first. What is kept is the error
   output: the slider at 15 (aria-valuenow), the list still on 3 pages after 5 s. Status: open.

## Checkout ([specs/checkout.md](../specs/checkout.md))

7. **Placing an order takes two clicks on Confirm.** The first click shows "Payment was successful" and stays on the
   Payment step; the second shows "Thanks for your order! Your invoice number is INV-…". Tests click Confirm again
   only if "Payment was successful" shows on the Payment step, and assert only the final confirmation, so they pass
   with one click or two. Team to confirm whether one click should place
   the order. On the local and CI copy (Toolshop 2.5, commit 9e7736c) there is one finish button, labelled
   "Confirm" and clicked twice: the first click checks the payment, the second creates the invoice (Toolshop's
   `payment.component.ts` at that commit). The public site's newer code labels it "Check payment" until the first
   click (note 19). Seen by: QA
   engineer, 13-11-2026, on the normal (not with-bugs) local copy. Status: open.
8. **The cart shows a total of 0 or below while the quantity field holds 0 or -1.** As soon as the field is left,
   the quantity goes back to 1 and the total is right again. Team to confirm. Seen by: QA engineer, 13-11-2026, on
   the normal site. Status: open.
9. **The house number is lost when going back to the Billing Address step.** Fill the address, Proceed, then click
   Billing Address in the step bar: the other values are still there, the house number is empty. Team to confirm.
   Seen by: QA engineer, 13-11-2026, on the normal site. Status: open.
10. **A credit card error stays after switching payment methods.** Enter a one-digit CVV, switch to Cash on
    Delivery, then back to Credit Card: "CVV must be 3 or 4 digits." is still shown. Team to confirm. Seen by: QA
    engineer, 13-11-2026, on the normal site. Status: open.
11. **The cart page logs errors in the browser console while it loads.** "TypeError: Cannot read properties of
    undefined (reading 'cart_items')", from the cart component, though the cart then shows correctly. Team to
    confirm. Seen by: QA engineer, 13-11-2026, on the normal site (also seen by the AI test planner). Status: open.
12. **/checkout opened directly shows no empty-cart message.** With no cart, or after the cart was emptied, opening
    /checkout shows only the step bar; the console shows "TypeError: Cannot read properties of null (reading
    'cart_items')" (compare note 11). "The cart is empty. Nothing to display." shows only right after the last item
    is removed on the cart page. Reloading /checkout after an order also shows a header with neither the account
    name nor Sign in, although the customer is still logged in (the home page shows the account). Team to confirm.
    Seen by: found by the AI test generator, checked by hand by the QA engineer, 13-11-2026, on the normal site (the
    reload after an order: seen in automated runs and by hand, 13-11-2026). Status: open.
13. **Confirm is enabled on an empty payment form.** Right after choosing Bank Transfer, Gift Card or Credit Card,
    before anything is filled, Confirm is enabled and can be clicked (it was not clicked). An invalid value in a
    field disables it. Team to confirm whether Confirm should stay disabled until the form is valid. Seen by: found
    by the AI test generator, checked by hand by the QA engineer, 13-11-2026, on the normal site (the generator's
    report also named Buy Now Pay Later; the hand check covered the three methods above). Status: open.
14. **The cart's remove control has no name.** Each cart row removes its product with an icon in a link with no
    address, no text, no label and no data-test, so a screen reader announces nothing useful and tests can find it
    only by its class. Team to confirm whether it should be a button with a name (for example "Remove"). Seen by: QA
    engineer, 13-11-2026, on the normal site (browser developer tools). Status: open.
15. **The billing address form can be emptied after it was filled.** In an automated run (checkout, 2 of 42 runs at 2
    workers), Country, Postal code and House number were filled and still held their values when Proceed was
    clicked; no address lookup followed, and 30 s later every address field was empty and Proceed stayed disabled.
    In later runs, the site had filled in the street within about 1 s and the form was empty again by the time
    Proceed was clicked (1 of 42 at 4 workers), and 2.2 met the same reset (1 of 42 at 2 workers).
    Once (1 of 42 at 4 workers) Country, Postal code and House number were empty while Street and City still held the
    site's values. This is the last shape the refill accepts: a third one would move the production-build copy
    from Next to Now, and the affected tests would be left out until then.
    The only request in that time was the Angular development server loading the address component, so the likely
    cause is the local copy, which runs the development server (ng serve), rebuilding the form; the public site uses
    a production build. On the local copy only, the checkout tests fill the form again (at most twice, each time
    shown in the report and counted in the run summary); 2.2 only before its "enabled" check, and 2.3 never (2.3 is left out until the production build). Team to confirm. Seen by: automated
    test runs at 2 and 4 workers on the local development copy, 13-11-2026; not reproduced by hand; the public site was not
    tried for this. Also, 15-11-2026, local development copy freshly started, checkout `--repeat-each=3` at 2 workers
    (1 of 44 runs): 2.3 failed; the trace shows Country unchosen, Postal code and House number empty, the three fills
    11–13 ms apart just before, and the development server's "[vite] connecting" in the console: the same shape
    (every typed field empty), not a new one. 2.3 is left out until the production build of the UI. The traces are
    kept outside the repository. Status: open.
16. **The cart badge stays at 1 if the page is left before the site has emptied the cart.** After the invoice is
    answered (second Confirm), the page sends DELETE /carts/<cart id> and clears the cart id and the badge's count
    from the browser only when that DELETE is answered, success or error (the site's code: `cart.service.ts`,
    `payment.component.ts`). A page loaded before that answer keeps the badge at 1 for a cart already ordered. Checked
    by hand by the QA engineer, 14-11-2026, in Chrome DevTools with the DELETE's answer delayed by 10 s, then a full
    load of home: badge 1, on the local development copy and on the public site (a production build running newer
    code than the local copy's images, whose first payment button is named "Check payment" where the local copy
    shows "Confirm", note 19), so this is the site's own timing, not a development-server effect. DELETE answer times seen by hand: 68 and 116 ms locally, 167
    ms on the public site. This explains the earlier automated numbers (4.1 alone, 2 workers, local copy, 13-11-2026):
    badge 1 on the confirmation page in about 1 of 12 runs (1 of 40 with the wait for the add-to-cart message), after
    reloading /checkout in 9 of 14 runs (the other 5 lost the account menu, note 12), and on a full load of home in 25
    of 40. The payment story (AC9) says the cart is cleared, not when. Open question for the team: should a customer
    who leaves the confirmation page at once keep a badge and a cart id for a cart already ordered? 4.1 and 4.2 wait
    for the DELETE answer before leaving the page, so they do not meet this case; it is not tested. The wait for the
    add-to-cart message to go, added to 4.1 and 4.2 on an earlier guess, was removed: the product page shows that
    message only after the cart id and count are saved in the browser (the site's code at the pinned commit; the
    Product Detail story's AC8 says only that the product is added and the message shown), so it plays no
    part in the badge after the order. Seen by: automated
    test runs and the QA engineer by hand, 13-11-2026 and 14-11-2026. The traces are kept outside the repository.
    Never asserted. Status: open.
17. **Two orders placed at the same moment by one customer got the same invoice number.** In an automated run (4.1
    alone, two workers using the run's one account), the Invoices page twice listed two rows with one number
    (INV-2026000006); every order should have its own number. Team to confirm. Seen by: automated test run at 2
    workers on the local development copy, 13-11-2026; not reproduced by hand. The tests now use one account per
    order-placing test, so they no longer meet this case; it is not tested. Never asserted. Status: open.
18. **The checkout page logs a script error.** On the checkout page the console shows "TypeError: Cannot read
    properties of undefined (reading 'cart_items')" at `cart.component.html:4` (compare note 12, the same error with
    "null" after the cart was emptied). How often, and whether anything on the page breaks, was not checked. Team to
    confirm. Seen by: QA engineer by hand, 14-11-2026, on the local development copy. Never asserted. Status: open.
19. **On the public site, Confirm stays disabled after switching the payment method.** The public site runs newer
    code than the local and CI copy (Toolshop 2.5, commit 9e7736c): after choosing
    a payment method its button is "Check payment", which shows
    "Payment was successful" and then a "Confirm" button; on the local copy one button labelled "Confirm" is clicked
    twice (note 7). With
    Cash on Delivery, Check payment, then switching the method to Credit Card, Confirm shows disabled. With an
    invalid card number, Check payment is disabled. Team to confirm what is intended. Not met by the tests, which
    run on the local copy. Seen by: QA engineer by hand, 15-11-2026, on the public site. Never asserted. Status: open.
20. **The local copy's header shows "QA Run", which is not in Toolshop's source.** The header on the local copy has a
    "QA Run" entry. It is not in the Sprint 5 UI source at the pinned commit (9e7736c) or at the newer commit the
    public site runs, nor in the running UI container's source; likely added by a script when the page loads. It was
    not opened, and the tests never click it. Seen by: QA engineer by hand, 15-11-2026, on the local development
    copy. Never asserted. Status: open.
21. **The product list came back empty twice on the local copy; why the first answer was empty is not known.** In
    the first two full runs on the pin to Toolshop 2.5 (`--repeat-each=3` at 2 workers, fresh copy each): (1)
    "Category plus brand narrows to the intersection" failed all three repeats: after ticking ForgeFlex Tools the API
    answered `/products` with an empty list; (2) "Each sub-category shows the expected product names" failed its
    first repeat: the page sent no `/products` request within 5 s. Nine later runs (one with the image pair check
    switched off, four more on the pin, four on the main branch) all passed, and the seeded counts, read from the
    database after each start, were the same every time: 40 products for ForgeFlex Tools, 6 of them in Hammer.
    **Shown (16-11-2026, local copy, fresh start):** the API keeps an empty answer for the same filter for 5 minutes.
    ForgeFlex Tools had 40 products in the list; with them hidden in the database the API answered the ForgeFlex
    filter with 0; with them put back, the same filter at once still answered 0; after 5 minutes 10 seconds it
    answered 40. In Toolshop's code at the pinned commit, `ProductService::getAllProducts` keeps every answer, an
    empty one too, for 300 seconds under a key built from the filter values, and the page's `QUERY /products` uses
    the same code. So case 1's three repeats are one event: once the first answer was empty, a retry inside 5
    minutes could not pass. **Not known:** why that first answer was empty; no code path that would give an empty
    list for a seeded brand was found. In the first failing run, the unfiltered list was full just before each empty
    answer; when that run's seed finished, and whether it needed more than one attempt, was not kept (the start
    script now keeps a seed log per start). The trace kept no request or answer bodies, so the brand id the page sent
    could not be compared with the products' brand id. Case 2 (no request at all) is not explained by the cache and stays open. No
    test or wait was changed for this. Seen by: QA engineer's automated runs and a check on the local copy,
    16-11-2026. Never asserted. Status: open.
