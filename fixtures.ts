import { test as base } from '@playwright/test';

/**
 * Gives each test the page objects it asks for.
 * Every spec and setup file imports test and expect from here, never from @playwright/test.
 * To add a page object: create it in pages/, then add it below.
 */
export const test = base.extend({});

export { expect } from '@playwright/test';
