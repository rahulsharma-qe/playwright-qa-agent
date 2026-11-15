import { expect, test } from '../../fixtures';
import type { Page } from '@playwright/test';
import {
  describeSession,
  MEASURED_LOGIN_LIFETIME_SECONDS,
  rememberSessionGivenTo,
  sessionGivenTo,
  sessionHasExpired,
  tokenStoreFor,
} from '../../support/api-session';
import { loginExpired } from '../../support/environment-messages';

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

test.describe('which login a page was given', () => {
  test("an order test's own customer replaces the run's session for the expiry check", () => {
    const page = {} as Page;
    const runSession = describeSession({ token: 'run', expiresInSeconds: 300 }, 0);
    const ownSession = describeSession({ token: 'own', expiresInSeconds: 300 }, 240_000, "this test's own customer");
    rememberSessionGivenTo(page, runSession);
    rememberSessionGivenTo(page, ownSession);
    expect(sessionGivenTo(page)).toBe(ownSession);
    expect(sessionHasExpired(sessionGivenTo(page)!, 360_000)).toBe(false);
    expect(sessionHasExpired(runSession, 360_000)).toBe(true);
  });

  test("the expired-login message names whose login it was", () => {
    expect(loginExpired(6, 5, 'the login reply')).toMatch(/^The run's login expired/);
    expect(loginExpired(6, 5, 'the login reply', "this test's own customer")).toMatch(/^This test's own customer's login expired/);
  });
});
