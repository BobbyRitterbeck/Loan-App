/// <reference types="cypress" />

import { PageSessionMetrics } from './typing-velocity.types';

Cypress.Commands.add('getLatestPageSessionMetrics', () => {
  return cy
    .get('.metrics-list details')
    .first()
    .find('pre')
    .invoke('text')
    .then((rawJson) => JSON.parse(rawJson) as PageSessionMetrics);
});