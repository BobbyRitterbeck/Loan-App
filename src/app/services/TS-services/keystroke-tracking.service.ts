import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

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

  /** Registers global keystroke-tracking listeners once during application startup. */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    // Capture phase mirrors production keystroke-tracking wiring so tracking runs
    // regardless of component-level event handlers.
    this.document.addEventListener('keydown', this.onKeydown, true);
    this.document.addEventListener('input', this.onInput, true);
    this.document.addEventListener('blur', this.onBlur, true);
  }

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
   * Replace this console output with enterprise event reporting when integrated.
   */
  private reportTypingVelocity(metrics: TypingVelocityMetrics): void {
    console.log('Typing velocity metrics', metrics);
  }
}
