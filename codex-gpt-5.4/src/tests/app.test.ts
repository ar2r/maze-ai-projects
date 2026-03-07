// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from '../app/GameApp';

function installCanvasStub(): void {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ({
      setTransform: () => undefined,
      clearRect: () => undefined,
      drawImage: () => undefined,
      fillRect: () => undefined,
      save: () => undefined,
      restore: () => undefined,
      translate: () => undefined,
      beginPath: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => undefined,
      arc: () => undefined,
      fill: () => undefined,
      lineCap: 'round',
      strokeStyle: '#000',
      lineWidth: 1,
      fillStyle: '#000'
    })
  });
}

function installStorageStub(): void {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    }
  };

  vi.stubGlobal('localStorage', storage);
}

describe('GameApp Start flow', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    installStorageStub();
    localStorage.clear();
    installCanvasStub();

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false
      }))
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 0,
        y: 0,
        width: 640,
        height: 640,
        top: 0,
        left: 0,
        bottom: 640,
        right: 640,
        toJSON: () => ({})
      })
    });

    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
    Object.defineProperty(HTMLCanvasElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: vi.fn()
    });
  });

  it('starts a new game when Start is clicked', () => {
    const root = document.querySelector('#app') as HTMLDivElement;
    new GameApp(root);

    const startButton = document.querySelector('#startButton') as HTMLButtonElement;
    startButton.click();

    expect(document.querySelector('#menuScreen')?.classList.contains('hidden')).toBe(true);
    expect(document.querySelector('#hud')?.classList.contains('hidden')).toBe(false);
    expect((document.querySelector('#levelLabel') as HTMLElement).textContent).toContain('Уровень 1');
    expect(localStorage.getItem('mazeGame.progress')).toContain('currentLevel');
  });

  it('does not capture menu button pointer events before starting the game', () => {
    const root = document.querySelector('#app') as HTMLDivElement;
    new GameApp(root);

    const startButton = document.querySelector('#startButton') as HTMLButtonElement;
    const pointerDown = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(pointerDown, 'pointerId', { value: 7 });

    startButton.dispatchEvent(pointerDown);
    startButton.click();

    expect(HTMLCanvasElement.prototype.setPointerCapture).not.toHaveBeenCalled();
    expect(document.querySelector('#menuScreen')?.classList.contains('hidden')).toBe(true);
  });
});
