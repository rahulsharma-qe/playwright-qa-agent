import { expect, test } from '../../fixtures';
import { BOT_CHECK_MESSAGE, cannotRegister, isEnvironmentMessage, siteNotResponding } from '../../support/environment-messages';
import { type CountedTest, outcomeOf, summaryLines } from '../../support/planted-bug-count';

// Sample results written for these tests; no browser and no Toolshop needed.
const uiTest = (title: string, status: string, errors: string[] = [], project = 'login'): CountedTest => ({ title, project, status, errors });
const assertionError = 'Error: expect(locator).toBeVisible() failed';

test.describe('environment messages', () => {
  test('the site check, registration and bot-check messages are all environment messages', () => {
    for (const message of [
      siteNotResponding('site', 'http://localhost:4200'),
      siteNotResponding('API', 'http://localhost:8091/brands'),
      cannotRegister('HTTP 500'),
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

  test('says so when fewer than five UI tests are found', () => {
    const four = ['a', 'b', 'c', 'd'].map((t) => uiTest(t, 'expected'));
    expect(summaryLines(four, 'abc')).toContain('Expected 5 UI tests, found 4: a spec may have failed to load.');
    expect(summaryLines([...four, uiTest('e', 'expected')], 'abc').join('\n')).not.toContain('Expected 5 UI tests');
  });

  test('setup and unit projects are counted on their own line', () => {
    const lines = summaryLines(
      [uiTest('a', 'skipped', [], 'logged-in'), uiTest('setup', 'unexpected', [`Error: ${BOT_CHECK_MESSAGE}`], 'auth-setup')],
      'abc',
    );
    expect(lines).toContain('Setup and unit: auth-setup: 1 failed of 1 (1 with an environment message)');
  });
});
