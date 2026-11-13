/** Search terms and product names used by the tests. Change them here, not in the tests. */
export const searchCase = {
  term: 'Pliers',
  expectedProduct: 'Combination Pliers',
};

export const cartProduct = {
  name: 'Combination Pliers',
};

/** In stock, one unit; the price is what the normal Sprint 5 site shows. */
export const inStockProduct = { name: 'Combination Pliers', price: 14.15 };

/** Marked "Out of stock" on the normal Sprint 5 site. */
export const outOfStockProduct = { name: 'Long Nose Pliers' };
