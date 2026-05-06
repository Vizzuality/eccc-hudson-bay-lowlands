import { toPng } from "html-to-image";
import { type RefObject, useCallback, useState } from "react";

function formatDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useMapDownload(containerRef: RefObject<HTMLDivElement | null>) {
  const [loading, setLoading] = useState(false);

  const download = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    setLoading(true);

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

    const legendContent = el.querySelector<HTMLElement>(
      "[data-map-legend] [data-slot=collapsible-content]",
    );
    const legendWasClosed =
      legendContent?.getAttribute("data-state") === "closed";
    if (legendWasClosed && legendContent) {
      legendContent.style.setProperty("height", "auto", "important");
      legendContent.style.setProperty("opacity", "1", "important");
      legendContent.style.setProperty("animation", "none", "important");
    }

    try {
      const dataUrl = await toPng(el, { pixelRatio: window.devicePixelRatio });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `hudson-bay-lowlands-map-${formatDate()}.png`;
      a.click();
    } finally {
      for (const node of downloadOnlyEls) {
        node.classList.add("hidden");
      }

      for (const node of excludedEls) {
        node.style.removeProperty("display");
      }

      if (legendWasClosed && legendContent) {
        legendContent.style.removeProperty("height");
        legendContent.style.removeProperty("opacity");
        legendContent.style.removeProperty("animation");
      }

      setLoading(false);
    }
  }, [containerRef]);

  return { download, loading };
}
