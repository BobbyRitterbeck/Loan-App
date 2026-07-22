import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import { TypingVelocityMetrics } from '../../models/typing-velocity.model';
import {
  getKeystrokeTrackedFieldId,
  isKeystrokeTrackableInputElement,
} from './keystroke-tracking-utils';
import { TypingVelocityService } from './typing-velocity.service';

@Injectable({ providedIn: 'root' })
export class KeystrokeTrackingService {
  private readonly document = inject(DOCUMENT);
  private readonly typingVelocityService = inject(TypingVelocityService);
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
  }

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
    }
  };

  /**
   * Reporting seam for production keystroke-tracking integration.
   * TEMP: console logging instead of UI reporting; revert to sessionMetrics.update(...) to re-enable UI.
   */
  private reportTypingVelocity(metrics: TypingVelocityMetrics): void {
    console.log('Typing velocity metrics', metrics);
  }
}
