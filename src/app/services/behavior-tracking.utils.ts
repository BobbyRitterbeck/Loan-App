import { TRACKED_INPUT_TYPES } from './behavior-tracking.constants';

export function getIsTrackedInputElement(
  element: HTMLElement,
): element is HTMLInputElement {
  if (element.tagName.toLowerCase() !== 'input') {
    return false;
  }

  const inputElement = element as HTMLInputElement;
  const inputType = inputElement.type?.toLowerCase() || 'text';

  return Boolean(
    (inputElement.name || inputElement.id) && TRACKED_INPUT_TYPES.includes(inputType as (typeof TRACKED_INPUT_TYPES)[number]),
  );
}

export function getTrackedFieldId(element: HTMLInputElement): string {
  // Prefer name because it usually maps directly to form field semantics.
  return element.name || element.id;
}
