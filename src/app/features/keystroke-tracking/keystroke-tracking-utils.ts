import { KEYSTROKE_TRACKED_INPUT_TYPES } from './keystroke-tracking.constants';

export function isKeystrokeTrackableInputElement(
  element: HTMLElement,
): element is HTMLInputElement {
  if (element.tagName.toLowerCase() !== 'input') {
    return false;
  }

  const inputElement = element as HTMLInputElement;
  const inputType = inputElement.type?.toLowerCase() || 'text';

  return Boolean(
    (inputElement.name || inputElement.id) &&
      KEYSTROKE_TRACKED_INPUT_TYPES.includes(
        inputType as (typeof KEYSTROKE_TRACKED_INPUT_TYPES)[number],
      ),
  );
}

export function getKeystrokeTrackedFieldId(element: HTMLInputElement): string {
  // Prefer name because it usually maps directly to form field semantics.
  return element.name || element.id;
}
