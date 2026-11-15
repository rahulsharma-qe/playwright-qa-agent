/**
 * Test data for the checkout tests. Every value is plainly fake (cards in the 0000-0000-0000-0000 shape).
 * Typed values never appear in step names or test titles.
 */

/** A price as the site shows it, for example $14.15. */
export const formatPrice = (amount: number): string => `$${amount.toFixed(2)}`;

export type Address = { country: string; postalCode: string; houseNumber: string };
export type Card = { number: string; expiry: string; cvv: string; holder: string };

/** The site fills in street, city and state from these three. */
export const billingAddress: Address = { country: 'Netherlands (the)', postalCode: '1011AB', houseNumber: '42' };

/** An expiry date as the site expects it (MM/YYYY), a number of years from today's month. */
function expiryYearsFromNow(years: number): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${month}/${today.getFullYear() + years}`;
}

/** Valid until this month next year, so it never goes stale. */
export const validCard: Card = { number: '0000-0000-0000-0000', expiry: expiryYearsFromNow(1), cvv: '000', holder: 'Test Holder' };

export const invalidCardInput = { shortNumber: '0000-0000', wrongFormatExpiry: '1234', shortCvv: '0' };

/** Well-formed (MM/YYYY) but a year in the past, counted back from today. */
export const pastExpiry = expiryYearsFromNow(-1);

/** A digit is not allowed in a bank name. */
export const invalidBankName = 'Test Bank 1';

/** Not 16 letters or digits. */
export const invalidGiftCardNumber = 'abc';
