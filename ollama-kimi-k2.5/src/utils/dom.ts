// DOM utility functions

export function query<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector(selector) as T | null;
}

export function queryAll<T extends HTMLElement>(selector: string): T[] {
  return Array.from(document.querySelectorAll(selector)) as T[];
}

export function create<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    className?: string;
    id?: string;
    text?: string;
    parent?: HTMLElement;
    attributes?: Record<string, string>;
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (options?.className) {
    element.className = options.className;
  }

  if (options?.id) {
    element.id = options.id;
  }

  if (options?.text) {
    element.textContent = options.text;
  }

  if (options?.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options?.parent) {
    options.parent.appendChild(element);
  }

  return element;
}

export function on<K extends keyof HTMLElementEventMap>(
  element: EventTarget,
  event: K,
  handler: (ev: HTMLElementEventMap[K]) => void
): () => void {
  element.addEventListener(event, handler as EventListener);
  return () => element.removeEventListener(event, handler as EventListener);
}

export function off<K extends keyof HTMLElementEventMap>(
  element: EventTarget,
  event: K,
  handler: (ev: HTMLElementEventMap[K]) => void
): void {
  element.removeEventListener(event, handler as EventListener);
}

export function addClass(element: HTMLElement, ...classes: string[]): void {
  element.classList.add(...classes);
}

export function removeClass(element: HTMLElement, ...classes: string[]): void {
  element.classList.remove(...classes);
}

export function toggleClass(element: HTMLElement, className: string, force?: boolean): boolean {
  return element.classList.toggle(className, force);
}

export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function setText(element: HTMLElement, text: string): void {
  element.textContent = text;
}

export function setHTML(element: HTMLElement, html: string): void {
  element.innerHTML = html;
}
