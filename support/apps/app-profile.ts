/**
 * What the framework needs to know about one web application under test. One file per application in this folder
 * (support/apps/<name>.ts); the generic parts (environment check, session set-up, API helper, secret scan,
 * reporting) read only this shape, never the application's name.
 */

/** Where the site keeps the login token in the browser, so a session made through the API can be handed to it. */
export type TokenStore = { storage: 'localStorage' | 'sessionStorage'; key: string };

/** One place the application runs: its addresses and how this copy differs from the others. */
export type AppEnvironment = {
  /** The application's own name for this copy (for Toolshop, the SPRINT its start script and image pins use). */
  version: string;
  siteUrl: string;
  apiUrl: string;
  /** Put in front of every page path: '' for plain paths, '/#' for hash routing. */
  pagePrefix: string;
  tokenStore: TokenStore;
  /** Fields the sign-up form needs besides name, email and password. */
  signUpFields: Record<string, string>;
};

export type AppProfile = {
  name: string;
  environments: Record<string, AppEnvironment>;
  /** What the environment check calls before any test: a page of the site, and an API path that needs no login. */
  healthChecks: { sitePath: string; apiPath: string };
  /** How the tests get a user: 'register' makes an account at run time through the API. */
  testUser: { mode: 'register' };
};
