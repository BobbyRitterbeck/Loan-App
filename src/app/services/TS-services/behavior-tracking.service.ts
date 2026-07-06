import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { TypingVelocityMetrics } from '../../models/typing-velocity.model';
import {
  getIsTrackedInputElement,
  getTrackedFieldId,
} from './behavior-tracking.utils';
import { TypingVelocityService } from './typing-velocity.service';

@Injectable({ providedIn: 'root' })
export class BehaviorTrackingService {
  private readonly document = inject(DOCUMENT);
  private readonly typingVelocityService = inject(TypingVelocityService);
  private initialized = false;

  /** Registers global behavior listeners once during application startup. */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    // Capture phase mirrors production behavior service wiring so tracking runs
    // regardless of component-level event handlers.
    this.document.addEventListener('keydown', this.onKeydown, true);
    this.document.addEventListener('blur', this.onBlur, true);
  }

  private readonly onKeydown = (event: Event): void => {
    const inputElement = event.target as HTMLElement;
    if (!getIsTrackedInputElement(inputElement)) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    this.typingVelocityService.trackKeydown(
      getTrackedFieldId(inputElement),
      keyboardEvent.timeStamp,
      keyboardEvent.repeat,
    );
  };

  private readonly onBlur = (event: Event): void => {
    const inputElement = event.target as HTMLElement;
    if (!getIsTrackedInputElement(inputElement)) {
      return;
    }

    const metrics = this.typingVelocityService.completeSession(
      getTrackedFieldId(inputElement),
    );

    if (metrics) {
      // Orchestration layer does not compute metrics; it forwards completed output.
      this.reportTypingVelocity(metrics);
    }
  };

  /**
   * Reporting seam for Best Egg integration.
   * Replace this console output with enterprise event reporting when integrated.
   */
  private reportTypingVelocity(metrics: TypingVelocityMetrics): void {
    console.log('Typing velocity metrics', metrics);
  }
}
