/**
 * The billing address refill (observed note 15): the annotation a test gets each time the address form was reset
 * after it was filled and was filled again, and the one summary line that counts them.
 * Plain TypeScript with no imports, so Node can also run it directly (the summary scripts do).
 */
export const ADDRESS_FORM_REFILL = 'address-form-refill';

export function refillSummaryLine(refills: number): string {
  return `Billing address form refilled: ${refills} time${refills === 1 ? '' : 's'} (local development copy only; observed note 15)`;
}
