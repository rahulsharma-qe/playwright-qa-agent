import type { AppEnvironment, AppProfile } from './app-profile.ts';
import { toolshop } from './toolshop.ts';

/** Every application with a profile. To add one: write support/apps/<name>.ts and list it here. */
export const APPS: Record<string, AppProfile> = { toolshop };

export function appProfile(name: string): AppProfile {
  const profile = APPS[name];
  if (!profile) throw new Error(`Unknown application APP_UNDER_TEST=${name}; valid: ${Object.keys(APPS).join(', ')}.`);
  return profile;
}

export function appEnvironment(profile: AppProfile, name: string): AppEnvironment {
  const environment = profile.environments[name];
  if (!environment) {
    throw new Error(
      `Unknown environment TEST_ENV=${name} for ${profile.name}; valid: ${Object.keys(profile.environments).join(', ')}.`,
    );
  }
  return environment;
}

/** What a run tests: the application, its environment, and the two addresses. */
export type RunSelection = {
  app: AppProfile;
  environmentName: string;
  environment: AppEnvironment;
  baseUrl: string;
  apiUrl: string;
};

/**
 * APP_UNDER_TEST (default toolshop) and TEST_ENV (default local) pick the profile and its environment. BASE_URL and
 * API_URL, when set, win over the environment's addresses (for a deployed site); everything else still comes from
 * the environment.
 */
export function selectRun(env: Record<string, string | undefined>): RunSelection {
  const app = appProfile(env.APP_UNDER_TEST || 'toolshop');
  const environmentName = env.TEST_ENV || 'local';
  const environment = appEnvironment(app, environmentName);
  return {
    app,
    environmentName,
    environment,
    baseUrl: env.BASE_URL || environment.siteUrl,
    apiUrl: env.API_URL || environment.apiUrl,
  };
}

/** Where a BASE_URL or API_URL that wins over TEST_ENV came from. */
export type AddressSource = 'the environment' | '.env';

/**
 * The run's first line: what it tests and where. Addresses only. When BASE_URL or API_URL win over TEST_ENV, it
 * says so and where they came from, so an old .env cannot point a run elsewhere without a word.
 */
export function describeRun(run: RunSelection, overrides: Partial<Record<'BASE_URL' | 'API_URL', AddressSource>> = {}): string {
  const line = `Testing ${run.app.name}, TEST_ENV=${run.environmentName}: site ${run.baseUrl}, API ${run.apiUrl}`;
  const notes = Object.entries(overrides).map(([name, source]) => `${name} from ${source}`);
  return notes.length ? `${line} (${notes.join(' and ')} ${notes.length > 1 ? 'win' : 'wins'} over TEST_ENV)` : line;
}
