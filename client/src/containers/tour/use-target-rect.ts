import { useEffect, useEffectEvent, useRef, useState } from "react";

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const toRect = (element: Element): Rect => {
  const { top, left, width, height } = element.getBoundingClientRect();
  return { top, left, width, height };
};

const toVisibleRect = (element: Element): Rect | null => {
  const rect = toRect(element);
  return rect.width === 0 && rect.height === 0 ? null : rect;
};

const SCROLL_WINDOW_MS = 600;
const SAFE_MARGIN = 96;

const isFullyVisible = (rect: Rect) =>
  rect.top >= SAFE_MARGIN &&
  rect.top + rect.height <= window.innerHeight - SAFE_MARGIN;

const scrollIntoScrollArea = (element: Element, rect: Rect) => {
  const viewport = element.closest<HTMLElement>(
    "[data-radix-scroll-area-viewport]",
  );
  if (!viewport || isFullyVisible(rect)) return;
  const area = viewport.getBoundingClientRect();
  viewport.scrollTop +=
    rect.top + rect.height / 2 - (area.top + area.height / 2);
};

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height);

const sameRects = (a: KeyedRect[], b: KeyedRect[]) =>
  a.length === b.length &&
  a.every((rect, i) => rect.key === b[i].key && sameRect(rect, b[i]));

const useAnimationFrame = (enabled: boolean, callback: () => void) => {
  const onFrame = useEffectEvent(callback);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Biome does not treat useEffectEvent results as stable
  useEffect(() => {
    if (!enabled) return;
    let frame = requestAnimationFrame(function tick() {
      onFrame();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [enabled]);
};

export function useTargetRect(selector: string | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const appeared = useRef<{ selector: string | null; at: number | null }>({
    selector: null,
    at: null,
  });

  useEffect(() => {
    if (!selector) setRect(null);
  }, [selector]);

  useAnimationFrame(!!selector, () => {
    if (!selector) return;
    if (appeared.current.selector !== selector) {
      appeared.current = { selector, at: null };
    }
    const element = document.querySelector(selector);
    const next = element ? toVisibleRect(element) : null;
    if (element && next) {
      appeared.current.at ??= performance.now();
      if (performance.now() - appeared.current.at < SCROLL_WINDOW_MS) {
        scrollIntoScrollArea(element, next);
      }
    }
    setRect((prev) => (sameRect(prev, next) ? prev : next));
  });

  return rect;
}

export interface KeyedRect extends Rect {
  key: string;
}

export function useTargetRects(selector: string | null): KeyedRect[] {
  const [rects, setRects] = useState<KeyedRect[]>([]);

  useEffect(() => {
    if (!selector) setRects([]);
  }, [selector]);

  useAnimationFrame(!!selector, () => {
    if (!selector) return;
    const firstPerValue = new Map<string, Element>();
    for (const element of document.querySelectorAll(selector)) {
      const key = element.getAttribute("data-tour-hotspot") ?? "";
      if (!firstPerValue.has(key)) firstPerValue.set(key, element);
    }
    const next = [...firstPerValue].flatMap(([key, element]) => {
      const rect = toVisibleRect(element);
      return rect ? [{ key, ...rect }] : [];
    });
    setRects((prev) => (sameRects(prev, next) ? prev : next));
  });

  return rects;
}
