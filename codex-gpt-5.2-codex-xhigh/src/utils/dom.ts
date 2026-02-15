export function qs<T extends HTMLElement>(selector: string, parent: Document | HTMLElement = document): T {
  const el = parent.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el as T;
}

export function show(el: HTMLElement): void {
  el.removeAttribute('hidden');
}

export function hide(el: HTMLElement): void {
  el.setAttribute('hidden', 'true');
}
