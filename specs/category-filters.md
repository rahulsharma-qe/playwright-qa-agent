# Category filters on the Toolshop home page

Prepared by: AI test planner (AI-01) · Edited by: QA engineer (second commit)
Scope set by: AI assistant (AI-01)
Approved by: QA engineer, pull request #15

## Application Overview

Test plan for the "By category:" checkboxes in the filter sidebar on the home page of the normal Sprint 5 Toolshop copy (http://localhost:4200/, started with ci/start-toolshop.sh, SPRINT=sprint5). Every observation comes from the live page. All scenarios start from a fresh state: open the home page through productListPage.open() (seed: tests/seed.spec.ts, signed-in session), no filter set, default sort, empty search box.

Page facts observed (use for expectations):
- Sidebar order: sort combobox (accessible name "sort"), price slider (two handles named "ngx-slider" and "ngx-slider-max", range 0-200, default 1-100), search ("Search" textbox, "X" clear button, "Search" button), group "Categories" (under heading "By category:"), group "Brands", and group "Eco-Friendly Products" (checkbox "Show only eco-friendly products").
- Categories are checkboxes named exactly like their label. Hand Tools: Hammer, Hand Saw, Wrench, Screwdriver, Pliers, Chisels, Measures. Power Tools: Grinder, Sander, Saw, Drill. Other: Tool Belts, Storage Solutions, Workbench, Safety Gear, Fasteners. Brands: ForgeFlex Tools, MightyCraft Hardware.
- Use exact name matching: "Saw" also matches "Hand Saw" and "Hammer" matches "Sledgehammer"-like text without exact.
- Product card (link): image, product name (heading level 5, data-test="product-name"), "Compare" button, CO2 rating scale A-E, price (data-test="product-price", format $12.58), and an "Out of stock" label on some cards (e.g. Long Nose Pliers). Card links go to /product/<id>.
- A page holds at most 9 cards. Pagination is a navigation with buttons "Previous", "Page-1".."Page-N", "Next". It is absent when results fit on one page.
- Filtering updates the list without a page reload; the URL stays http://localhost:4200/ (no query string). Filter results need a moment to load, so use web-first assertions or expect.poll, never fixed waits.
- Empty result text: "There are no products found." (data-test="no-results").
- No category checkbox is checked initially; unfiltered list shows 5 pages.
- Product names and counts per category (used by 1.2, 1.3, 1.4, 2.1, 3.2) live in one table in `test-data/`, not
  inline in the tests. The Drill row (2: 24V, 12V) and the Power Tools count (5) are marked there "as observed; see
  observed note 2".

## Test Scenarios

### 1. Category filter: basics

**Seed:** `tests/seed.spec.ts`

#### 1.1. Selecting one sub-category shows only its products (post-deploy check)

**File:** `tests/category-filters/filter-by-category.spec.ts`

**Steps:**
  1. Tag: @sanity. Start state: fresh home page, nothing filtered. Note the unfiltered list shows 9 cards and pagination with 5 pages.
    - expect: Category group lists Hand Tools, Power Tools and Other with their children
  2. Check the checkbox labelled "Pliers" in the Categories group
    - expect: Exactly 5 cards: Combination Pliers, Pliers, Bolt Cutters, Long Nose Pliers, Slip Joint Pliers
    - expect: No pagination buttons are shown
    - expect: Every card has a name, a CO2 scale and a price
    - expect: The "Pliers" checkbox is checked and no other category checkbox is checked

#### 1.2. Each sub-category shows the expected product names

**File:** `tests/category-filters/filter-by-category.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. For each row in the test-data table (Hammer, Pliers, Drill, Sander, Saw, Wrench, Screwdriver, Chisels, Measures, Tool Belts, Fasteners): check only that sub-category, read the card names, then uncheck it.
    - expect: Hammer: 7 products (Claw Hammer with Shock Reduction Grip, Hammer, Claw Hammer, Thor Hammer, Sledgehammer, Claw Hammer with Fiberglass Handle, Court Hammer)
    - expect: Pliers: 5; Drill: 2 (Cordless Drill 24V, Cordless Drill 12V); Sander: 2 (Sheet Sander, Belt Sander); Saw: 1 (Circular Saw)
    - expect: Wrench: 3; Screwdriver: 2; Chisels: 3; Measures: 4; Tool Belts: 1; Fasteners: 6
    - expect: The list contains exactly the expected names, no product from another category

#### 1.3. Selecting several sub-categories shows the union of their products

**File:** `tests/category-filters/filter-by-category.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Hammer", then check "Drill"
    - expect: After Hammer only, 7 hammer products are shown
    - expect: After Drill is also checked, 9 cards are shown: the 7 hammer products plus Cordless Drill 24V and Cordless Drill 12V
    - expect: Both checkboxes stay checked and no pagination is shown (9 fit on one page)
  2. Uncheck "Hammer"
    - expect: Only the 2 drill products remain

#### 1.4. Selecting a parent category selects its children and shows all their products

**File:** `tests/category-filters/filter-by-category.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Power Tools"
    - expect: The children Grinder, Sander, Saw and Drill become checked
    - expect: 5 cards: Sheet Sander, Belt Sander, Circular Saw, Cordless Drill 24V, Cordless Drill 12V
    - expect: No pagination
  2. Uncheck "Power Tools"
    - expect: All children become unchecked (e.g. Drill is unchecked)
    - expect: The full unfiltered list returns: 9 cards, 5 pages

#### 1.5. Unchecking one child while the parent is checked narrows the list

**File:** `tests/category-filters/filter-by-category.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Hand Tools" (25 products over 3 pages). Uncheck the child "Wrench"
    - expect: Adjustable Wrench, Angled Spanner and Open-end Spanners (Set) no longer appear on any page
    - expect: Other Hand Tools products (e.g. Phillips Screwdriver, Wood Saw) still appear
    - expect: The test asserts the list only, not the parent checkbox
    - Observed note 4 (docs/observed-notes.md): "Hand Tools" stays fully ticked after one child is unticked

#### 1.6. Clearing the category filter restores the full list

**File:** `tests/category-filters/filter-by-category.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Hammer", confirm 7 cards, then uncheck "Hammer"
    - expect: The list returns to the unfiltered state: 9 cards, pagination with 5 pages
    - expect: No category checkbox is checked

#### 1.7. Category with no products shows the empty-results message

**File:** `tests/category-filters/filter-by-category.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Grinder" (a Power Tools child that has no products)
    - expect: No product cards are shown
    - expect: The text "There are no products found." is visible
    - expect: No pagination buttons
    - expect: Unchecking "Grinder" returns the full list

### 2. Category filter: pagination

**Seed:** `tests/seed.spec.ts`

#### 2.1. Pagination follows the filtered result set

**File:** `tests/category-filters/filtered-results-across-pages.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Hand Tools"
    - expect: Page-1 shows 9 cards; pagination has exactly 3 pages (25 products in total)
  2. Click the "Page-2" button, then "Page-3"
    - expect: Page 2 shows 9 cards and page 3 the remaining 7
    - expect: No product repeats across the three pages and every name belongs to Hand Tools
    - expect: No check of the exact order on a page (the order follows the default sort, not pagination)
  3. Switch from "Hand Tools" to the "Other" parent (uncheck Hand Tools, check Other)
    - expect: The list shows page 1 of the new result set, with 2 pages in total (15 products)

### 3. Category filter: combined with other controls

**Seed:** `tests/seed.spec.ts`

#### 3.1. Category plus sort keeps the filter and orders the results

**File:** `tests/category-filters/category-with-other-filters.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Hammer", then choose "Name (A - Z)" in the "sort" combobox
    - expect: Still 7 hammer products, ordered Claw Hammer, Claw Hammer with Fiberglass Handle, Claw Hammer with Shock Reduction Grip, Court Hammer, Hammer, Sledgehammer, Thor Hammer
  2. Choose "Price (High - Low)"
    - expect: Same 7 products; prices read $20.14, $18.63, $17.75, $13.41, $12.58, $11.48, $11.14 (descending)
    - expect: "Hammer" is still checked

#### 3.2. Category plus brand narrows to the intersection

**File:** `tests/category-filters/category-with-other-filters.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check brand "ForgeFlex Tools", then check "Hammer"
    - expect: Brand alone: 9 cards on 4 pages. With Hammer: 6 cards (all hammers except Claw Hammer), no pagination
  2. Also check "MightyCraft Hardware"
    - expect: 7 cards: all hammer products including Claw Hammer
  3. Uncheck "ForgeFlex Tools"
    - expect: Only Claw Hammer remains

#### 3.3. Category plus price range slider

**File:** `tests/category-filters/category-with-other-filters.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Hand Tools". Move the slider handle named "ngx-slider-max" until its aria-valuenow is 15 (default is 100). Hint: Home/End or setting the value takes one or two steps, instead of about 85 ArrowLeft presses
    - expect: Only Hand Tools products priced at or below $15 remain: observed Phillips Screwdriver $4.92, Tape Measure 7.5m $7.23, Slip Joint Pliers $9.17, Measuring Tape $10.07, Thor Hammer $11.14, Claw Hammer $11.48, Pliers $12.01, Wood Saw $12.18, Hammer $12.58
    - expect: Pagination now shows 2 pages; the "Hand Tools" checkbox stays checked
    - expect: Every price shown is within the slider range
  2. Next step for the implementer: before writing the test, re-confirm the exact list at the final slider value, because the sort order and page break depend on it
    - expect: Test asserts the price of every card is at most the max value, not a hard-coded full list

#### 3.4. Category plus eco-friendly checkbox gives no results when none match

**File:** `tests/category-filters/category-with-other-filters.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Hammer", then check "Show only eco-friendly products"
    - expect: Observed: the text "There are no products found." is shown and no cards appear
  2. Uncheck the eco-friendly checkbox
    - expect: The 7 hammer products return

#### 3.5. Search looks across all categories

**File:** `tests/category-filters/category-with-other-filters.spec.ts`

**Steps:**
  1. Tag: @regression. Start state: fresh home page. Check "Hammer", type "Claw" in the "Search" textbox and click the "Search" button
    - expect: 3 cards: Claw Hammer with Shock Reduction Grip, Claw Hammer, Claw Hammer with Fiberglass Handle
  2. Replace the search text with "Drill" and click "Search"
    - expect: 4 Cordless Drill products appear (20V, 24V, 18V, 12V): the search looks across all categories
    - expect: No check of the category tick after a search (see observed note 1)
  3. Click the "X" button next to the search box
    - expect: Full unfiltered list returns (9 cards, 5 pages); no category is checked; sort selection (if set) is kept

## Observed notes for the team (not asserted)

Seen by the QA engineer on the normal Sprint 5 site while reviewing this plan. Kept in one list the team reads:
[docs/observed-notes.md](../docs/observed-notes.md) (notes 1 to 4 for category filters).
