import { toPng } from "html-to-image";
import { type RefObject, useCallback, useRef, useState } from "react";

import { formatDate } from "@/lib/utils/date";

const LOGO_PATH = "/logo.svg";
const LOGO_WIDTH = 63;
const LOGO_HEIGHT = 18.5;
const LOGO_PADDING = 4;
const LOGO_RADIUS = 7;
const LOGO_MARGIN = 12;

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.setAttribute("data-download-exclude", "");
  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    zIndex: "10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "1.5rem",
    background: "rgba(255, 255, 255, 0.6)",
  });
  overlay.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-muted-foreground); animation: spin 1s linear infinite"><style>@keyframes spin { to { transform: rotate(360deg) } }</style><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
  return overlay;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function compositeWatermark(
  canvas: HTMLCanvasElement,
  logo: HTMLImageElement,
  dpr: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const p = LOGO_PADDING * dpr;
  const r = LOGO_RADIUS * dpr;
  const m = LOGO_MARGIN * dpr;
  const w = LOGO_WIDTH * dpr;
  const h = LOGO_HEIGHT * dpr;
  const boxW = w + p * 2;
  const boxH = h + p * 2;
  const x = canvas.width - boxW - m;
  const y = m;

  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, r);
  ctx.fillStyle = "white";
  ctx.fill();

  ctx.drawImage(logo, x + p, y + p, w, h);
}

export function useWidgetDownload(
  containerRef: RefObject<HTMLDivElement | null>,
  widgetId: string,
) {
  const [loading, setLoading] = useState(false);
  const busyRef = useRef(false);

  const download = useCallback(async () => {
    const el = containerRef.current;
    if (!el || busyRef.current) return;

    busyRef.current = true;
    setLoading(true);

    const overlay = createOverlay();
    el.appendChild(overlay);

    const downloadOnlyEls = el.querySelectorAll<HTMLElement>(
      "[data-download-only]",
    );
    for (const node of downloadOnlyEls) {
      node.classList.remove("hidden");
    }

    const excludedEls = el.querySelectorAll<HTMLElement>(
      "[data-download-exclude]",
    );
    for (const node of excludedEls) {
      node.style.setProperty("display", "none", "important");
    }

    try {
      const dpr = window.devicePixelRatio;
      const [dataUrl, logo] = await Promise.all([
        toPng(el, { pixelRatio: dpr }),
        loadImage(LOGO_PATH),
      ]);

      const img = await loadImage(dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);

      compositeWatermark(canvas, logo, dpr);

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `hudson-bay-lowlands-${widgetId}-${formatDate()}.png`;
      a.click();
    } finally {
      for (const node of downloadOnlyEls) {
        node.classList.add("hidden");
      }

      for (const node of excludedEls) {
        node.style.removeProperty("display");
      }

      overlay.remove();
      busyRef.current = false;
      setLoading(false);
    }
  }, [containerRef, widgetId]);

  return { download, loading };
}
