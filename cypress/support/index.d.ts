/// <reference types="cypress" />

import { PageSessionMetrics } from './typing-velocity.types';

declare global {
  namespace Cypress {
    interface Chainable {
      getLatestPageSessionMetrics(): Chainable<PageSessionMetrics>;
    }
  }
}

export {};
