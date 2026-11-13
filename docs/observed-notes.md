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
   the order. Seen by: QA engineer, 13-11-2026, on the normal site. Status: open.
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
    is removed on the cart page. Team to confirm. Seen by: found by the AI test generator, checked by hand by the QA
    engineer, 13-11-2026, on the normal site. Status: open.
13. **Confirm is enabled on an empty payment form.** Right after choosing Bank Transfer, Gift Card or Credit Card,
    before anything is filled, Confirm is enabled and can be clicked (it was not clicked). An invalid value in a
    field disables it. Team to confirm whether Confirm should stay disabled until the form is valid. Seen by: found
    by the AI test generator, checked by hand by the QA engineer, 13-11-2026, on the normal site (the generator's
    report also named Buy Now Pay Later; the hand check covered the three methods above). Status: open.
