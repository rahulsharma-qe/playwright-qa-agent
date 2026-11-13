/**
 * After an order, the site empties the cart with DELETE /carts/<cart id>, sent when the invoice is answered (second
 * Confirm), and clears the badge only when that DELETE is answered (observed note 16). The order tests wait for that
 * answer. Each order test gets one annotation with two times: the whole span from the first Confirm click to the
 * DELETE answer, and the DELETE request's own time. The summary script prints them, so the bound below is set from
 * measured numbers. Plain TypeScript with no imports, so Node can also run it directly (the summary script does).
 */
export const CART_EMPTIED = 'cart-emptied';

/**
 * How long placeOrder() waits, from the first Confirm click, for the DELETE answer: 3 × the slowest measured span.
 * Source: measuring run on the local development copy, freshly started, 15-11-2026, 4.1 and 4.2 each 10 runs at 2
 * workers: whole span (first Confirm click to the DELETE answer) 567–1218 ms for 4.1 and 572–1818 ms for 4.2,
 * slowest 1818 ms; the DELETE's own time 98–290 ms (by hand: 68–116 ms local, 167 ms on the public site).
 * CI checks the slowest span stays under half of this bound (the run page line); if it does not, the bound changes
 * from the CI numbers and the runs are repeated.
 */
export const CART_EMPTIED_BOUND_MS = 5_454;

export type CartEmptiedTimes = { spanMs: number; deleteMs: number };

export function cartEmptiedDescription(times: CartEmptiedTimes): string {
  return `span ${times.spanMs} ms, DELETE ${times.deleteMs} ms`;
}

export function parseCartEmptied(description: string): CartEmptiedTimes | undefined {
  const match = description.match(/^span (\d+) ms, DELETE (\d+) ms$/);
  return match ? { spanMs: Number(match[1]), deleteMs: Number(match[2]) } : undefined;
}

/** One line for the run page: how many orders, the slowest span and DELETE, and the span against the bound. */
export function cartEmptiedSummaryLine(times: CartEmptiedTimes[], boundMs: number): string {
  if (times.length === 0) return 'Cart emptied after the order: no order test recorded a time';
  const slowestSpan = Math.max(...times.map((t) => t.spanMs));
  const slowestDelete = Math.max(...times.map((t) => t.deleteMs));
  const bound =
    boundMs > 0
      ? `bound ${boundMs} ms, slowest span ${slowestSpan <= boundMs / 2 ? 'under' : 'NOT under'} half the bound`
      : 'no bound set (measuring run)';
  return `Cart emptied after the order: ${times.length} order${times.length === 1 ? '' : 's'}; slowest span (first Confirm to DELETE answer) ${slowestSpan} ms; slowest DELETE ${slowestDelete} ms; ${bound}`;
}
