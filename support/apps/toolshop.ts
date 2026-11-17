import type { AppProfile } from './app-profile.ts';

/**
 * Toolshop, Testsmith's practice web shop (https://github.com/testsmith-io/practice-software-testing), Sprint 5.
 * Every difference between the copies below is taken from Toolshop's source at the pinned commit or checked by
 * hand, never from its planted bugs (docs/bug-hunt.md, "Differences between the copies"):
 * - page addresses: Sprint 5 uses plain paths (router `useHash: false`); the "with bugs" copy uses hash routing
 *   (`useHash: true`), so /auth/login becomes /#/auth/login;
 * - the login token: the same key, `auth-token`; Sprint 5 keeps it in localStorage, the "with bugs" copy in
 *   sessionStorage (each copy's token-storage service);
 * - sign-up: the "with bugs" copy asks for address, city and country as separate fields. It also gets a date of
 *   birth, to work around a defect that is not on the planted list (docs/bug-hunt.md, "Found, not on the planted
 *   list"): its sign-up rules leave `dob` optional, but its database requires it. Made-up values; the date of birth
 *   is inside its age rules.
 * CI uses `local`: the same addresses, inside the runner.
 */
const sprint5 = {
  pagePrefix: '',
  tokenStore: { storage: 'localStorage', key: 'auth-token' },
  signUpFields: {},
} as const;

export const toolshop: AppProfile = {
  name: 'toolshop',
  environments: {
    local: {
      version: 'sprint5',
      siteUrl: 'http://localhost:4200',
      apiUrl: 'http://localhost:8091',
      ...sprint5,
    },
    'public-site': {
      version: 'sprint5',
      siteUrl: 'https://practicesoftwaretesting.com',
      apiUrl: 'https://api.practicesoftwaretesting.com',
      ...sprint5,
    },
    'with-bugs': {
      version: 'sprint5-with-bugs',
      siteUrl: 'http://localhost:4200',
      apiUrl: 'http://localhost:8091',
      pagePrefix: '/#',
      tokenStore: { storage: 'sessionStorage', key: 'auth-token' },
      signUpFields: {
        address: '1 Test Street',
        city: 'Testville',
        state: 'Test',
        country: 'NL',
        postcode: '1000',
        dob: '1990-01-01',
      },
    },
  },
  healthChecks: { sitePath: '/', apiPath: '/brands' },
  testUser: { mode: 'register' },
};
