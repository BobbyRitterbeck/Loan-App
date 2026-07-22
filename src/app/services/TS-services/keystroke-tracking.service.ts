import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { PageSessionMetrics } from '../../models/page-session.model';
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
    // Start the first session; the host takes over via start/endPageSession.
    this.startPageSession();

    // Fallback only: flush if the document is torn down before the host calls
    // endPageSession(). end is idempotent, so an explicit end will not be
    // duplicated by this listener.
    this.document.defaultView?.addEventListener('pagehide', this.onPageHide);
  }

  /**
   * Starts a page session with optional host-provided metadata.
   * Hosts call this on page/route enter, after ending any prior session.
   *
   * Starting while a session is already active is an invalid lifecycle call:
   * the current session is left untouched and the request is ignored. The host
   * is responsible for calling endPageSession() first.
   */
  startPageSession(pageId?: string): void {
    if (this.pageSessionService.isActive()) {
      console.warn(
        'startPageSession() called while a page session is active; ignoring. ' +
          'Call endPageSession() before starting a new session.',
      );
      return;
    }

    this.pageSessionService.start(pageId);
  }

  /**
   * Ends the active page session, flushing any still-open field sessions, and
   * reports the aggregated result. Hosts call this on page/route leave.
   *
   * Idempotent: a call with no active session is a no-op, so the `pagehide`
   * fallback cannot produce a duplicate report.
   */
  endPageSession(reason?: string): void {
    if (!this.pageSessionService.isActive()) {
      return;
    }

    // Flush fields left open at page end so their metrics are not lost.
    for (const metrics of this.typingVelocityService.completeAllSessions()) {
      this.pageSessionService.addFieldMetrics(metrics);
    }

    const pageMetrics = this.pageSessionService.end(reason);
    if (pageMetrics) {
      this.reportPageSession(pageMetrics);
    }
  }

  // Fallback end trigger for document teardown; see initialize().
  private readonly onPageHide = (): void => {
    this.endPageSession('pagehide');
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
      // Completed field metrics are collected into the page session, not reported here.
      this.pageSessionService.addFieldMetrics(metrics);
    }
  };

  /**
   * Single reporting seam: emits the aggregated field metrics for a page session.
   * TEMP: console logging; production swaps this body for enterprise reporting.
   */
  private reportPageSession(metrics: PageSessionMetrics): void {
    console.log('Page session metrics', metrics);
  }
}
