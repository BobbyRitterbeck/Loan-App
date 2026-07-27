import {
  flushPageSessionViaLogin,
  getFieldMetrics,
  humanFieldTransitionDelayMs,
  seedExistingUser,
  typeLikeHuman,
} from '../support/typing-velocity-helpers';

describe('Typing velocity — human-like session', () => {
  const username = 'human.test';
  const email = 'human.test@example.com';
  const password = 'humanpass123';

  beforeEach(() => {
    seedExistingUser(username);
  });

  it('records natural typing velocity with trusted keystrokes and irregular pacing', () => {
    typeLikeHuman('#username', username);

    cy.wait(humanFieldTransitionDelayMs());
    typeLikeHuman('#email', email);

    cy.wait(humanFieldTransitionDelayMs());
    typeLikeHuman('#password', password);

    cy.wait(400 + Math.floor(Math.random() * 600));
    flushPageSessionViaLogin();

    cy.getLatestPageSessionMetrics().then((session) => {
      expect(session.fields).to.have.length(3);

      const usernameField = getFieldMetrics(session, 'username');
      const emailField = getFieldMetrics(session, 'email');
      const passwordField = getFieldMetrics(session, 'password');

      expect(usernameField).to.exist;
      expect(emailField).to.exist;
      expect(passwordField).to.exist;

      for (const field of [usernameField!, emailField!, passwordField!]) {
        expect(field.hasUntrustedInput).to.eq(false);
        expect(field.inputWithoutKeydown).to.eq(false);
        expect(field.dominantInputType).to.eq('insertText');
        expect(field.totalKeystrokes).to.be.greaterThan(0);
        expect(field.averageIntervalMs).to.be.greaterThan(60);
        expect(field.maxIntervalMs! - field.minIntervalMs!).to.be.greaterThan(35);
        expect(field.msFromFocusToFirstInput).to.be.greaterThan(150);
      }

      expect(usernameField!.totalKeystrokes).to.eq(username.length);
      expect(emailField!.totalKeystrokes).to.eq(email.length);
      expect(passwordField!.totalKeystrokes).to.eq(password.length);

      // Humans pause between fields while reading or deciding what to enter next.
      expect(session.averageTimeBetweenFieldsMs).to.be.greaterThan(700);
      expect(session.minTimeBetweenFieldsMs).to.be.greaterThan(500);
      expect(session.totalIdleTimeMs).to.eq(0);
    });
  });
});
