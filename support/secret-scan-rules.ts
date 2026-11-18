// The rules of the secret scan (support/secret-scan.mjs), with no file access, so unit tests can check them.
// Plain TypeScript with no imports, so Node runs it directly.

export type Secret = { email?: string; password: string };

/** This run's registered accounts, plus the given test user when its password is set (APP_USER_PASSWORD). */
export function secretsToScan(accounts: Secret[], env: Record<string, string | undefined>): Secret[] {
  const given = env.APP_USER_PASSWORD ? [{ email: env.APP_USER_EMAIL || undefined, password: env.APP_USER_PASSWORD }] : [];
  return [...accounts, ...given];
}

export type Redacted = { text: string; maskLines: number; snapshotLines: number; leaked: boolean };

/**
 * Replaces every secret in one text file. Two places are expected to hold a password: the CI log-mask line
 * (::add-mask::) and a textbox line in Playwright's page snapshot (`- textbox "Password *" [ref=e5]: <value>`).
 * A password anywhere else is reported as leaked (and replaced too).
 */
export function redactText(original: string, secrets: Secret[]): Redacted {
  let text = original;
  let maskLines = 0;
  let snapshotLines = 0;
  let leaked = false;
  for (const { email, password } of secrets) {
    const maskLine = `::add-mask::${password}`;
    maskLines += text.split(maskLine).length - 1;
    text = text.split(maskLine).join('::add-mask::<test account password>');
    text = text
      .split('\n')
      .map((line) => {
        if (/^\s*- textbox\b/.test(line) && line.endsWith(`: ${password}`)) {
          snapshotLines++;
          return line.slice(0, -password.length) + '<test account password>';
        }
        return line;
      })
      .join('\n');
    if (text.includes(password)) leaked = true;
    text = text.split(password).join('<test account password>');
    if (email) text = text.split(email).join('<test account email>');
  }
  return { text, maskLines, snapshotLines, leaked };
}

/** Whether raw file bytes (read as latin1) still hold any password, in its UTF-8 form. */
export function holdsAPassword(rawLatin1: string, secrets: Secret[]): boolean {
  return secrets.some(({ password }) => rawLatin1.includes(Buffer.from(password, 'utf8').toString('latin1')));
}
