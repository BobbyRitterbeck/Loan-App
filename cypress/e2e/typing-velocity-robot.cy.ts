import {
  fillFieldRobotically,
  flushPageSessionViaLogin,
  getFieldMetrics,
  seedExistingUser,
  typeRobotically,
} from '../support/typing-velocity-helpers';

describe('Typing velocity — fraudulent robot session', () => {
  const username = 'bot.test';
  const email = 'bot.test@example.com';
  const password = 'botpass123';

  beforeEach(() => {
    seedExistingUser(username);
  });

  it('records bot-like velocity signals from scripted paste fills and uniform fast typing', () => {
    // Username/email: instant programmatic paste (no keydown, untrusted input).
    fillFieldRobotically('#username', username, 'insertFromPaste');
    fillFieldRobotically('#email', email, 'insertFromPaste');

    // Password: WebDriver-style uniform keystrokes with no human variance.
    typeRobotically('#password', password, 5);

    flushPageSessionViaLogin();

    cy.getLatestPageSessionMetrics().then((session) => {
      expect(session.fields).to.have.length(3);
      expect(session.totalIdleTimeMs).to.eq(0);

      const usernameField = getFieldMetrics(session, 'username');
      const emailField = getFieldMetrics(session, 'email');
      const passwordField = getFieldMetrics(session, 'password');

      expect(usernameField).to.exist;
      expect(emailField).to.exist;
      expect(passwordField).to.exist;

      // Paste/autofill bots populate fields without any preceding keydown.
      expect(usernameField!.inputWithoutKeydown).to.eq(true);
      expect(emailField!.inputWithoutKeydown).to.eq(true);
      expect(usernameField!.hasUntrustedInput).to.eq(true);
      expect(emailField!.hasUntrustedInput).to.eq(true);
      expect(usernameField!.dominantInputType).to.eq('insertFromPaste');
      expect(emailField!.dominantInputType).to.eq('insertFromPaste');
      expect(usernameField!.totalKeystrokes).to.eq(0);
      expect(emailField!.totalKeystrokes).to.eq(0);

      // Scripted fills land almost immediately after focus.
      expect(usernameField!.msFromFocusToFirstInput).to.be.lessThan(25);
      expect(emailField!.msFromFocusToFirstInput).to.be.lessThan(25);

      // Keystroke bots produce tight, unnaturally uniform intervals.
      expect(passwordField!.inputWithoutKeydown).to.eq(false);
      expect(passwordField!.hasUntrustedInput).to.eq(false);
      expect(passwordField!.totalKeystrokes).to.eq(password.length);
      expect(passwordField!.averageIntervalMs).to.be.lessThan(20);
      expect(passwordField!.maxIntervalMs! - passwordField!.minIntervalMs!).to.be.lessThan(15);

      // Bots hop between fields with no reading/thinking pauses.
      expect(session.averageTimeBetweenFieldsMs).to.be.lessThan(100);
      expect(session.maxTimeBetweenFieldsMs).to.be.lessThan(150);
    });
  });
});
