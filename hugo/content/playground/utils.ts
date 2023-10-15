/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { compressToEncodedURIComponent } from "lz-string";
import { Diagnostic } from "../../assets/scripts/langium-utils/langium-ast";

export async function share(grammar: string, content: string): Promise<void> {
  const compressedGrammar = compressToEncodedURIComponent(grammar);
  const compressedContent = compressToEncodedURIComponent(content);
  const url = new URL("/playground", window.origin);
  url.searchParams.append("grammar", compressedGrammar);
  url.searchParams.append("content", compressedContent);
  await navigator.clipboard.writeText(url.toString());
}

/**
 * Map of actions that are throttled, with the key being the unique id
 * Used to clear them out if a subsequent action is dispatched
 */
const throttleMap = new Map<number, NodeJS.Timeout>();

/**
 * Throttles an action with a fixed delay, such that subsequent attempts to dispatch
 * the same action clear out the previous action, and reset the delay.
 *
 * @param id Unique id to associate with this action
 * @param delay In milliseconds to delay the action
 * @param action Action to perform (function to invoke)
 */
export function throttle<T>(
  id: number,
  delay: number,
  action: () => void
): void {
  // clear out any previous action
  if (throttleMap.has(id)) {
    clearTimeout(throttleMap.get(id)!);
  }

  // set a new timeout to perform the action
  throttleMap.set(
    id,
    setTimeout(() => {
      action();
      throttleMap.delete(id);
    }, delay)
  );
}

export function overlay(visible: boolean) {
  const element = document.getElementById("overlay")!;
  if (!visible) {
    element.style.display = "none";
  } else {
    const subTitle = element.getElementsByClassName(
      "hint"
    )![0] as HTMLDivElement;
    subTitle.innerText = "Loading...";
    element.style.display = "block";
  }
}

export function hideError() {
  const element = document.getElementById("errors")!;
  element.style.display = "none";
}

export function showError(error: Error) {
  showErrorText(error.name, serializeError(error));
}

export function showErrorText(name: string, content: string) {
  const element = document.getElementById("errors")!;
  const errorName = element.getElementsByClassName(
    "error-name"
  )![0] as HTMLDivElement;
  errorName.innerText = name;
  const errorContent = element.getElementsByClassName(
    "error-content"
  )![0] as HTMLDivElement;
  errorContent.innerHTML = content;

  element.style.display = "block";
}

export function diagnostic2Text(diagnostic: Diagnostic) {
  return `<p>code: ${diagnostic.code}<br>${
    diagnostic.message
  }<br>range:<br>${serializeRange(diagnostic.range)}<br/>severity:${
    diagnostic.severity
  }</p>`;
}

function serializeRange(range: Diagnostic["range"]) {
  return `<span class="mx-10">start line: ${range.start.line}, char: ${range.start.character}</span><br><span class="mx-10">end line: ${range.end.line}, char: ${range.end.character}</span>`;
}

function serializeError(error: Error) {
  const result = [error.message];
  if (error.stack) {
    result.push(error.stack);
  }
  return result.map((x) => `<p>${x}</p>`).join("");
}
