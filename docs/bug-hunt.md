# How strong are the tests? Planted-bug runs

Toolshop has a version with bugs planted on purpose (`sprint5-with-bugs`) and a list of 94 of them, kept in
Testsmith's repository: [listOfBugs.md at the pinned Toolshop commit](https://github.com/testsmith-io/practice-software-testing/blob/ae7caecb811dd8952c09d997e69be7cb946ecd44/sprint5-with-bugs/testSessions/listOfBugs.md).
We run the same tests on that copy (workflow "Run on the with-bugs copy", started by hand) and a person matches
each failure to a planted bug after reading the report.

Rules: tests are never written or changed from the bug list or the with-bugs copy; the list is not copied here
(IDs, a link, and a short line in our own words); no result is written down before a run.

## How we count

- **N is the five UI tests.** Each is **failed**, **not reached** or **passed**. Not reached: it did not run
  because a setup step it depends on, or its file's own set-up, failed first; or it stopped on one of our
  environment messages (Playwright marks the first test of a file whose set-up failed as failed; we count it as
  not reached). Setup and unit projects are reported on their own line.
- A setup step can catch a bug only with a test-style error caused by a planted bug. Our environment messages
  (Toolshop not starting, a failed registration, a bot check) are never catches. Tests that were not reached are
  never counted as missed.
- **On our path** means a bug on a page our tests open (login, home page with search, product page, cart) that
  shows in Chromium. A page counts as a whole: a bug on it is on our path even if no test step touches it (this
  can only lower the rate, never raise it); the "Touched" column says whether a test step uses that element or
  flow, for information only. Each bug is tagged **functional** (behaviour, data, text on the page, or an
  accessibility gap) or **visual** (layout, font, padding, images, colour). Visual bugs stay in the table, marked
  "outside what the tests check".
- Reported as: on our path · of which functional · caught; with the full 94 as context. Not "X of 94": most
  planted bugs are on pages these tests never open.

## On our path (written 09-11-2026, before the first run)

29 of the 94 bugs: 21 functional, 8 visual. Pages and bugs that only show in Firefox or Edge, API-only bugs,
and pages our tests do not open (category, checkout steps after the cart, invoices, profile, registration,
contact, rentals, emails) are not on our path.

| ID | Page | In our words | Tag | Touched |
|---|---|---|---|---|
| 17 | Login | Email and password are not validated | functional | yes |
| 19 | Login | Email input padding is wrong in Chrome | visual | yes |
| 21 | Login | An account is locked after one wrong password | functional | yes |
| 87 | Login | The login form has no labels | functional | yes |
| 26 | Home | Some product images do not show in Chrome | visual | no |
| 27 | Home | The price-range filter does not send the maximum price | functional | no |
| 28 | Home | The logo is a broken image | visual | no |
| 29 | Home | The Home link opens the contact page | functional | no |
| 30 | Home | The search icon is a broken image | visual | no |
| 31 | Home | The Contact link text has a typo | functional | no |
| 32 | Home | The header shows "User Data not found" instead of the user's name | functional | yes |
| 33 | Home | The Sort label has a typo | functional | no |
| 34 | Home | The Search button text has a typo | functional | yes |
| 85 | All pages | Link colour contrast is too low | visual | yes |
| 93 | Home | The search form has no labels | functional | yes |
| 94 | Home | The filters have no fieldset | functional | no |
| 40 | Product | The + and − buttons do not change the quantity | functional | no |
| 41 | Product | "Add to favourites" shows an error | functional | no |
| 42 | Product | The "Related products" heading has a typo | functional | no |
| 43 | Product | "Add to cart" shows an error, but the item is added | functional | yes |
| 45 | Product | Buttons overlap in Chrome | visual | yes |
| 46 | Product | The badge text colour is wrong | visual | no |
| 47 | Product | No more than 10 pieces can be added to the cart | functional | no |
| 91 | Product | The quantity input has no label | functional | no |
| 92 | Product | Images have no alt text | functional | no |
| 1 | Cart | The + and − buttons do not change the amount | functional | no |
| 7 | Cart | The Delete button is disabled | functional | no |
| 8 | Cart | The total shows 0,00 | functional | no |
| 86 | Cart | The checkout step labels have too little contrast | visual | no |

## Runs

Toolshop's two versions register customers differently: Sprint 5 needs only name, email and password; the
with-bugs version also needs address, city and country as separate fields (from its API contract in Toolshop's
source, not from its planted bugs). The set-up picks the sign-up fields by `SPRINT`; no test step or check changes.

- **Run 1 (09-11-2026, commit 58d0961): not a baseline.** Summary: 0 failed, 5 not reached, 0 passed. The set-up
  could not register a test customer, because it sent the Sprint 5 sign-up to the with-bugs API; no test reached
  the app.

No baseline run yet.
