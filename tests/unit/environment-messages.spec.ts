import { expect, test } from '../../fixtures';
import { isEnvironmentMessage, noAnswerFrom } from '../../support/environment-messages';

test.describe('message when Toolshop gives no answer', () => {
  test('the local copy not answering says how to start it', () => {
    const message = noAnswerFrom('site', 'http://localhost:4200');
    expect(message).toBe(
      'The local Toolshop copy is not running. Start it with ci/start-toolshop.sh. ' +
        'This is an environment problem, not a test failure.',
    );
    expect(isEnvironmentMessage(message)).toBe(true);
  });

  test('the local API on 127.0.0.1 gets the same message', () => {
    expect(noAnswerFrom('API', 'http://127.0.0.1:8091/brands')).toContain('The local Toolshop copy is not running');
  });

  test('any other address keeps "not responding at <URL>"', () => {
    const message = noAnswerFrom('site', 'https://practicesoftwaretesting.com');
    expect(message).toBe(
      'Toolshop site is not responding at https://practicesoftwaretesting.com; ' +
        'this is an environment problem, not a test failure.',
    );
    expect(isEnvironmentMessage(message)).toBe(true);
  });
});
