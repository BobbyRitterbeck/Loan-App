import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import { PageSessionMetrics } from '../../models/page-session.model';
import { TypingVelocityMetrics } from '../../models/typing-velocity.model';
import {
  getKeystrokeTrackedFieldId,
  isKeystrokeTrackableInputElement,
} from './keystroke-tracking-utils';
import { PageSessionService } from './page-session.service';
import { TypingVelocityService } from './typing-velocity.service';

@Injectable({ providedIn: 'root' })
export class KeystrokeTrackingService {
  private readonly document = inject(DOCUMENT);
  private readonly typingVelocityService = inject(TypingVelocityService);
  private readonly pageSessionService = inject(PageSessionService);
  private initialized = false;

  /**
   * POC-only: in-memory session history for the login metrics panel.
   * Remove this signal when switching to enterprise reporting.
   */
  readonly sessionMetrics = signal<TypingVelocityMetrics[]>([]);

  /** Registers global keystroke-tracking listeners once during application startup. */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    // Use capture phase to mirror production behavior.
    // Focus/blur do not bubble, so capture registration is required.
    this.document.addEventListener('focus', this.onFocus, true);
    this.document.addEventListener('keydown', this.onKeydown, true);
    this.document.addEventListener('input', this.onInput, true);
    this.document.addEventListener('blur', this.onBlur, true);

    // The module does not decide what a "page" is; the host drives the lifecycle.
    this.beginPageSession();

    // POC-only default end trigger. Production removes this line and calls
    // endPageSession() from its own navigation system (e.g. router events).
    this.document.defaultView?.addEventListener('pagehide', this.onPageHide);
  }

  /** Starts a page session. Hosts call this on page/route enter. */
  beginPageSession(): void {
    this.pageSessionService.begin();
  }

  /**
   * Ends the active page session, flushing any still-open field sessions, and
   * reports the aggregated result. Hosts call this on page/route leave.
   */
  endPageSession(): void {
    // Flush fields left open at page end so their metrics are not lost.
    for (const metrics of this.typingVelocityService.completeAllSessions()) {
      this.reportTypingVelocity(metrics);
      this.pageSessionService.addFieldMetrics(metrics);
    }

    const pageMetrics = this.pageSessionService.end();
    if (pageMetrics) {
      this.reportPageSession(pageMetrics);
    }
  }

  // POC-only default end trigger; see initialize().
  private readonly onPageHide = (): void => {
    this.endPageSession();
  };

  private readonly onFocus = (event: Event): void => {
    const inputElement = event.target as HTMLElement;
    if (!isKeystrokeTrackableInputElement(inputElement)) {
      return;
    }

    this.typingVelocityService.trackFocus(
      getKeystrokeTrackedFieldId(inputElement),
      event.timeStamp,
      inputElement.type,
    );
  };

  private readonly onKeydown = (event: Event): void => {
    const inputElement = event.target as HTMLElement;
    if (!isKeystrokeTrackableInputElement(inputElement)) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    this.typingVelocityService.trackKeydown(
      getKeystrokeTrackedFieldId(inputElement),
      keyboardEvent.timeStamp,
      keyboardEvent.repeat,
    );
  };

  private readonly onInput = (event: Event): void => {
    const inputElement = event.target as HTMLElement;
    if (!isKeystrokeTrackableInputElement(inputElement)) {
      return;
    }

    const inputEvent = event as InputEvent;
    this.typingVelocityService.trackInput(
      getKeystrokeTrackedFieldId(inputElement),
      inputEvent.inputType ?? null,
      inputEvent.isTrusted,
      inputEvent.timeStamp,
      inputElement.type,
    );
  };

  private readonly onBlur = (event: Event): void => {
    const inputElement = event.target as HTMLElement;
    if (!isKeystrokeTrackableInputElement(inputElement)) {
      return;
    }

    const metrics = this.typingVelocityService.completeSession(
      getKeystrokeTrackedFieldId(inputElement),
    );

    if (metrics) {
      // Orchestration layer does not compute metrics; it forwards completed output.
      this.reportTypingVelocity(metrics);
      this.pageSessionService.addFieldMetrics(metrics);
    }
  };

  /**
   * Reporting seam for production keystroke-tracking integration.
   * TEMP: console logging instead of UI reporting; revert to sessionMetrics.update(...) to re-enable UI.
   */
  private reportTypingVelocity(metrics: TypingVelocityMetrics): void {
    console.log('Typing velocity metrics', metrics);
  }

  /**
   * Reporting seam for a completed page session's aggregated field metrics.
   * TEMP: console logging; production swaps this body for enterprise reporting.
   */
  private reportPageSession(metrics: PageSessionMetrics): void {
    console.log('Page session metrics', metrics);
  }
}
