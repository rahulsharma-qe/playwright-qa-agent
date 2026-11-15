import { expect, test } from '../../fixtures';
import { cartEmptiedDescription, cartEmptiedSummaryLine, parseCartEmptied } from '../../support/cart-emptied';

// Sample times written for these tests; no browser and no Toolshop needed.
test.describe('cart emptied after the order', () => {
  test('a recorded time reads back as written', () => {
    const times = { spanMs: 1850, deleteMs: 68 };
    expect(parseCartEmptied(cartEmptiedDescription(times))).toEqual(times);
    expect(parseCartEmptied('something else')).toBeUndefined();
  });

  test('the summary names the slowest span and DELETE and compares the span with half the bound', () => {
    const times = [
      { spanMs: 1200, deleteMs: 60 },
      { spanMs: 2100, deleteMs: 167 },
    ];
    expect(cartEmptiedSummaryLine(times, 0)).toContain('slowest span (first Confirm to DELETE answer) 2100 ms; slowest DELETE 167 ms; no bound set (measuring run)');
    expect(cartEmptiedSummaryLine(times, 6300)).toContain('bound 6300 ms, slowest span under half the bound');
    expect(cartEmptiedSummaryLine(times, 4000)).toContain('bound 4000 ms, slowest span NOT under half the bound');
    expect(cartEmptiedSummaryLine([], 6300)).toBe('Cart emptied after the order: no order test recorded a time');
  });
});
