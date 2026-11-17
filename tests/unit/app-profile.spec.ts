import { expect, test } from '../../fixtures';
import { appEnvironment, selectRun } from '../../support/apps/index.ts';
import { toolshop } from '../../support/apps/toolshop.ts';
import { appUrl } from '../../support/app-url';

// No browser and no Toolshop needed.
test.describe('application profile', () => {
  test('an unknown environment stops with a message naming it and the valid ones', () => {
    expect(() => appEnvironment(toolshop, 'staging')).toThrow(
      'Unknown environment TEST_ENV=staging for toolshop; valid: local, public-site, with-bugs.',
    );
  });

  // The with-bugs run is started by hand, so CI would not see these two differences break.
  test('the with-bugs environment keeps the token in sessionStorage and opens pages after /#', () => {
    const withBugs = appEnvironment(toolshop, 'with-bugs');
    expect(withBugs.tokenStore).toEqual({ storage: 'sessionStorage', key: 'auth-token' });
    expect(appUrl('/auth/login', withBugs)).toBe('/#/auth/login');
  });
});

test.describe('which application and environment a run tests', () => {
  test('with nothing set: Toolshop on the local copy', () => {
    const run = selectRun({});
    expect([run.app.name, run.environmentName, run.baseUrl, run.apiUrl]).toEqual([
      'toolshop', 'local', 'http://localhost:4200', 'http://localhost:8091',
    ]);
  });

  test('TEST_ENV=public-site gives the public site and its API', () => {
    const run = selectRun({ TEST_ENV: 'public-site' });
    expect([run.baseUrl, run.apiUrl]).toEqual(['https://practicesoftwaretesting.com', 'https://api.practicesoftwaretesting.com']);
  });

  test('BASE_URL and API_URL win over the environment, which still gives the rest', () => {
    const run = selectRun({ TEST_ENV: 'with-bugs', BASE_URL: 'https://shop.example.test', API_URL: 'https://api.shop.example.test' });
    expect([run.baseUrl, run.apiUrl]).toEqual(['https://shop.example.test', 'https://api.shop.example.test']);
    expect(run.environment.pagePrefix).toBe('/#');
  });

  test('an unknown application stops with a message naming it and the valid ones', () => {
    expect(() => selectRun({ APP_UNDER_TEST: 'webshop' })).toThrow('Unknown application APP_UNDER_TEST=webshop; valid: toolshop.');
  });
});
