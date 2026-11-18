import { expect, test } from '../../fixtures';
import { holdsAPassword, redactText, secretsToScan } from '../../support/secret-scan-rules.ts';

// Made-up values only; no files read or written.
const account = { email: 'pqa-local-login-x1@example.com', password: 'Fake-Pass-1234!' };

test.describe('secret scan', () => {
  test('redact replaces a password and the email, wherever they are, and counts the expected places', () => {
    const text = [
      `::add-mask::${account.password}`,
      `  - textbox "Password *" [ref=e5]: ${account.password}`,
      `logged in as ${account.email}`,
    ].join('\n');
    const result = redactText(text, [account]);
    expect(result.text).not.toContain(account.password);
    expect(result.text).not.toContain(account.email);
    expect([result.maskLines, result.snapshotLines, result.leaked]).toEqual([1, 1, false]);
  });

  test('a password outside those two places is a leak (and still replaced)', () => {
    const result = redactText(`error: wrong value ${account.password}`, [account]);
    expect([result.leaked, result.text.includes(account.password)]).toEqual([true, false]);
  });

  test('check finds a password in raw bytes', () => {
    expect(holdsAPassword(`{"step":"${account.password}"}`, [account])).toBe(true);
    expect(holdsAPassword('{"step":"<test account password>"}', [account])).toBe(false);
  });

  test('a given password (APP_USER_PASSWORD) is scanned with the registered ones', () => {
    const secrets = secretsToScan([account], { APP_USER_EMAIL: 'qa@example.com', APP_USER_PASSWORD: 'Given-Fake-99' });
    expect(secrets.map((secret) => secret.password)).toEqual([account.password, 'Given-Fake-99']);
    expect(holdsAPassword('text with Given-Fake-99 in it', secrets)).toBe(true);
    expect(secretsToScan([account], {})).toHaveLength(1);
  });
});
