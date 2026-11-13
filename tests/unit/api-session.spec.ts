import { expect, test } from '../../fixtures';
import { describeSession, MEASURED_LOGIN_LIFETIME_SECONDS, sessionHasExpired, tokenStoreFor } from '../../support/api-session';

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

test.describe('when the run\'s login expires', () => {
  const loggedInAt = 1_000_000;

  test('the expiry comes from the login reply when it gives one', () => {
    const session = describeSession({ token: 't', expiresInSeconds: 3600 }, loggedInAt);
    expect(session.expiresAt).toBe(loggedInAt + 3_600_000);
    expect(session.expirySource).toBe('the login reply');
  });

  test('without one, the measured lifetime is used and named', () => {
    const session = describeSession({ token: 't' }, loggedInAt);
    expect(session.expiresAt).toBe(loggedInAt + MEASURED_LOGIN_LIFETIME_SECONDS * 1000);
    expect(session.expirySource).toBe('the measured lifetime');
  });

  test('a session has expired from its expiry on, not before', () => {
    const session = describeSession({ token: 't', expiresInSeconds: 60 }, loggedInAt);
    expect(sessionHasExpired(session, loggedInAt + 59_999)).toBe(false);
    expect(sessionHasExpired(session, loggedInAt + 60_000)).toBe(true);
  });
});
