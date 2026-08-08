import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

type RangeProto = {
  getClientRects: () => DOMRectList;
  getBoundingClientRect: () => DOMRect;
};

function silentRangeMethods(): void {
  if (typeof Range === "undefined") {
    return;
  }
  const proto = Range.prototype as RangeProto;
  proto.getClientRects = () => [] as unknown as DOMRectList;
  proto.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

beforeEach(() => {
  silentRangeMethods();
  if (typeof globalThis.ResizeObserver === "undefined") {
    Object.defineProperty(globalThis, "ResizeObserver", {
      writable: true,
      configurable: true,
      value: ResizeObserverStub,
    });
  }
  if (typeof globalThis.matchMedia === "undefined") {
    Object.defineProperty(globalThis, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});