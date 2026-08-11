import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { PAGE_SESSION_REPORTER } from './features/keystroke-tracking';
import { SandboxPageSessionReporter } from './sandbox/sandbox-page-session.reporter';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        // The tracking module ships no default reporter on purpose, so every
        // host must provide one — including tests.
        { provide: PAGE_SESSION_REPORTER, useExisting: SandboxPageSessionReporter },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
