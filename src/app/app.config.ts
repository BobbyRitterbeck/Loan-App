import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { PAGE_SESSION_REPORTER } from './features/keystroke-tracking';
import { SandboxPageSessionReporter } from './sandbox/sandbox-page-session.reporter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Host wiring for the keystroke module's reporting boundary. This is the one
    // line a production app changes: point the token at an enterprise event
    // reporter instead of the sandbox console/panel reporter.
    { provide: PAGE_SESSION_REPORTER, useExisting: SandboxPageSessionReporter },
  ],
};
