/**
 * Each scenario is a separate test so you can run one at a time in Cypress
 * (click the test name) and inspect the metrics panel before continuing.
 *
 * cy.pause() stops after filling so you can open/expand metrics. Click "Resume"
 * in the Cypress runner when you're done examining.
 */
describe('Keystroke Velocity robot', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
  });

  it('scenario: types all three fields (normal keystrokes)', () => {
    cy.get('#username').click().type('robot.user', { delay: 40 });
    cy.get('#email').click().type('robot.user@example.com', { delay: 35 });
    cy.get('#password').click().type('RobotPass1', { delay: 45 }).blur();

    openMetricsPanel();
    cy.pause(); // Inspect sessions, then Resume in Cypress.
  });

  it('scenario: pastes email, types username and password', () => {
    cy.get('#username').click().type('paste.demo', { delay: 30 });

    cy.get('#email')
      .click()
      .then(($el) => {
        const input = $el[0] as HTMLInputElement;
        const pasted = 'pasted.user@example.com';
        input.value = pasted;
        input.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertFromPaste',
            data: pasted,
          }),
        );
      });
    cy.get('#email').blur();

    cy.get('#password').click().type('PasteDemo1', { delay: 30 }).blur();

    openMetricsPanel();
    cy.pause();
  });

  it('scenario: fills all three fields instantly (scripted / untrusted)', () => {
    fillFieldInstantly('#username', 'script.user');
    fillFieldInstantly('#email', 'script.user@example.com');
    fillFieldInstantly('#password', 'ScriptPass1');

    openMetricsPanel();
    cy.pause();
  });

});

function openMetricsPanel(): void {
  cy.get('.metrics-card > summary').click();
  cy.get('.metrics-list li').should('have.length.at.least', 1);
}

/** Sets value and dispatches an untrusted input event (robotic / scripted fill). */
function fillFieldInstantly(selector: string, value: string): void {
  cy.get(selector)
    .click()
    .then(($el) => {
      const input = $el[0] as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: value,
        }),
      );
    });
  cy.get(selector).blur();
}
