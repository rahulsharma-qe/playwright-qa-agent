import { expect, test } from '../../fixtures';
import { tokenStoreFor } from '../../support/api-session';

// No browser and no Toolshop needed.
test.describe('where the site keeps the login token', () => {
  test('Sprint 5 keeps it in localStorage, the with-bugs version in sessionStorage, both as auth-token', () => {
    expect(tokenStoreFor('sprint5')).toEqual({ storage: 'localStorage', key: 'auth-token' });
    expect(tokenStoreFor('sprint5-with-bugs')).toEqual({ storage: 'sessionStorage', key: 'auth-token' });
  });

  test('an unknown version stops with a message saying where to add it', () => {
    expect(() => tokenStoreFor('sprint9')).toThrow('No token store for SPRINT=sprint9');
  });
});
