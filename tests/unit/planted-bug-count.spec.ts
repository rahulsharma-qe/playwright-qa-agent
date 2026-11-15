import { expect, test } from '../../fixtures';
import {
  BOT_CHECK_MESSAGE,
  cannotLogInThroughApi,
  cannotRegister,
  isEnvironmentMessage,
  siteNotResponding,
} from '../../support/environment-messages';
import { ADDRESS_FORM_REFILL } from '../../support/address-refill';
import { collectTests, type CountedTest, EXPECTED_UI_TESTS, outcomeOf, summaryLines } from '../../support/planted-bug-count';

// Sample results written for these tests; no browser and no Toolshop needed.
const uiTest = (title: string, status: string, errors: string[] = [], project = 'login'): CountedTest => ({ title, project, status, errors });
const assertionError = 'Error: expect(locator).toBeVisible() failed';

test.describe('environment messages', () => {
  test('the site check, registration, API login and bot-check messages are all environment messages', () => {
    for (const message of [
      siteNotResponding('site', 'http://localhost:4200'),
      siteNotResponding('API', 'http://localhost:8091/brands'),
      cannotRegister('HTTP 500'),
      cannotLogInThroughApi('HTTP 401'),
      BOT_CHECK_MESSAGE,
    ]) {
      expect(isEnvironmentMessage(`Error: ${message}`), message).toBe(true);
    }
  });

  test('a test assertion is not an environment message', () => {
    expect(isEnvironmentMessage(assertionError)).toBe(false);
  });
});

test.describe('planted-bug count', () => {
  test('a failed assertion is failed; a bot check, a skipped test and a failed set-up are not reached', () => {
    expect(outcomeOf(uiTest('a', 'unexpected', [assertionError]))).toBe('failed');
    expect(outcomeOf(uiTest('b', 'unexpected', [`Error: ${BOT_CHECK_MESSAGE}`]))).toBe('not reached');
    expect(outcomeOf(uiTest('c', 'unexpected', [`Error: ${cannotRegister('HTTP 500')}`]))).toBe('not reached');
    expect(outcomeOf(uiTest('d', 'skipped'))).toBe('not reached');
  });

  test('passed and flaky tests are passed, and flaky is marked', () => {
    const lines = summaryLines([uiTest('a', 'expected'), uiTest('b', 'flaky')], 'abc');
    expect(lines.join('\n')).toContain('passed: [login] b (passed on retry: flaky)');
    expect(lines[0]).toContain('0 failed, 0 not reached, 2 passed');
  });

  test('says so when fewer UI tests are found than expected', () => {
    const oneShort = Array.from({ length: EXPECTED_UI_TESTS - 1 }, (_, i) => uiTest(`t${i}`, 'expected'));
    const expectedLine = `Expected ${EXPECTED_UI_TESTS} UI tests, found ${EXPECTED_UI_TESTS - 1}: a spec may have failed to load.`;
    expect(summaryLines(oneShort, 'abc')).toContain(expectedLine);
    expect(summaryLines([...oneShort, uiTest('last', 'expected')], 'abc').join('\n')).not.toContain('Expected');
  });

  test('setup and unit projects are counted on their own line', () => {
    const lines = summaryLines(
      [uiTest('a', 'skipped', [], 'logged-in'), uiTest('setup', 'unexpected', [`Error: ${BOT_CHECK_MESSAGE}`], 'auth-setup')],
      'abc',
    );
    expect(lines).toContain('Setup and unit: auth-setup: 1 failed of 1 (1 with an environment message)');
  });
});

test.describe('billing address refills (observed note 15)', () => {
  test('are read from the last attempt\'s annotations', () => {
    const refill = { type: ADDRESS_FORM_REFILL };
    const report = {
      suites: [
        {
          specs: [
            {
              title: 'pay',
              tests: [{ projectName: 'logged-in', status: 'expected', results: [{ annotations: [refill, refill] }] }],
            },
          ],
        },
      ],
    };
    expect(collectTests(report)[0].refills).toBe(2);
  });

  test('are counted in the summary, and a refilled test is marked for a person to judge', () => {
    const lines = summaryLines([{ ...uiTest('pay', 'expected', [], 'logged-in'), refills: 1 }, uiTest('b', 'expected')], 'abc');
    expect(lines).toContain('Billing address form refilled: 1 time (local development copy only; observed note 15)');
    expect(lines.join('\n')).toContain('pay (billing address refilled 1×: development server or planted bug? a person decides)');
  });

  test('a run with none says 0', () => {
    expect(summaryLines([uiTest('a', 'expected')], 'abc')).toContain(
      'Billing address form refilled: 0 times (local development copy only; observed note 15)',
    );
  });
});
