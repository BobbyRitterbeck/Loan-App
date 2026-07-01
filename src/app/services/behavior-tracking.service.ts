import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { TypingVelocityService } from './typing-velocity.service';

@Injectable({ providedIn: 'root' })
export class BehaviorTrackingService {
  private readonly document = inject(DOCUMENT);
  private readonly typingVelocityService = inject(TypingVelocityService);
  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    this.document.addEventListener('keydown', this.onKeydown, true);
    this.document.addEventListener('blur', this.onBlur, true);
  }

  private readonly onKeydown = (event: Event): void => {
    const inputElement = event.target as HTMLElement;
    if (!this.getIsRelevantInputElement(inputElement)) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    this.typingVelocityService.trackKeydown(
      this.getFieldId(inputElement),
      keyboardEvent.timeStamp,
      keyboardEvent.repeat,
    );
  };

  private readonly onBlur = (event: Event): void => {
    const inputElement = event.target as HTMLElement;
    if (!this.getIsRelevantInputElement(inputElement)) {
      return;
    }

    const metrics = this.typingVelocityService.completeField(
      this.getFieldId(inputElement),
    );

    if (metrics) {
      console.log('Typing velocity metrics', metrics);
    }
  };

  private getIsRelevantInputElement(
    element: HTMLElement,
  ): element is HTMLInputElement {
    if (element.tagName.toLowerCase() !== 'input') {
      return false;
    }

    const inputElement = element as HTMLInputElement;
    const relevantInputTypes = ['text', 'password', 'tel', 'email', 'date', 'number'];
    const inputType = inputElement.type?.toLowerCase() || 'text';

    return Boolean(
      (inputElement.name || inputElement.id) && relevantInputTypes.includes(inputType),
    );
  }

  private getFieldId(element: HTMLInputElement): string {
    return element.name || element.id;
  }
}
