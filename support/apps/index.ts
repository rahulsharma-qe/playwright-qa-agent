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
