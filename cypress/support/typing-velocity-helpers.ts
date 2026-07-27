import type { PageSessionMetrics, TypingVelocityMetrics } from './typing-velocity.types';

const USERS_STORAGE_KEY = 'loan-portal-users';

/** Seeds a known user so the login form can be submitted after typing tests. */
export function seedExistingUser(username: string): void {
  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([username]));
      win.localStorage.removeItem('loan-portal-current-user');
    },
  });
}

/**
 * Simulates a scripted bot filling a field: focus, assign value, dispatch a
 * synthetic input event with no preceding keydown. Matches paste/autofill bots.
 */
export function fillFieldRobotically(
  selector: string,
  value: string,
  inputType: 'insertFromPaste' | 'insertText' = 'insertFromPaste',
): void {
  cy.get(selector).then(($input) => {
    const input = $input[0] as HTMLInputElement;

    input.focus();
    input.value = value;
    input.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType,
        data: value,
      }),
    );
  });
}

/**
 * Simulates a fraudulent keystroke bot: uniform ultra-fast trusted key events.
 * Real bots often drive the DOM through WebDriver with zero delay between keys.
 */
export function typeRobotically(selector: string, text: string, delayMs = 8): void {
  cy.get(selector).focus().type(text, { delay: delayMs });
}

/** Returns a human-like per-keystroke delay in milliseconds. */
export function humanKeystrokeDelayMs(): number {
  return 70 + Math.floor(Math.random() * 160);
}

/** Returns a human-like pause before moving to the next field (kept below the 2s idle threshold). */
export function humanFieldTransitionDelayMs(): number {
  return 800 + Math.floor(Math.random() * 1000);
}

/** Returns a human-like pause after focusing a field before the first keystroke. */
export function humanFocusToFirstKeyDelayMs(): number {
  return 250 + Math.floor(Math.random() * 750);
}

/**
 * Types text with variable inter-key delays and an initial focus pause,
 * producing the irregular velocity profile typical of real users.
 */
export function typeLikeHuman(selector: string, text: string): void {
  cy.get(selector).focus();
  cy.wait(humanFocusToFirstKeyDelayMs());

  text.split('').forEach((char, index) => {
    if (index > 0) {
      cy.wait(humanKeystrokeDelayMs());
    }

    cy.get(selector).type(char, { delay: 0 });
  });
}

export function flushPageSessionViaLogin(): void {
  cy.contains('button', 'Login').should('not.be.disabled').click();
  cy.url().should('include', '/dashboard');
}

export function getFieldMetrics(
  session: PageSessionMetrics,
  fieldId: string,
): TypingVelocityMetrics | undefined {
  return session.fields.find((field) => field.fieldId === fieldId);
}
