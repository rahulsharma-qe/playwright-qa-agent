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
