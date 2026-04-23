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
    try {
      const dataUrl = await toPng(el, {
        pixelRatio: window.devicePixelRatio,
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            node.dataset.downloadExclude !== undefined
          ) {
            return false;
          }
          return true;
        },
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `hudson-bay-lowlands-map-${formatDate()}.png`;
      a.click();
    } finally {
      setLoading(false);
    }
  }, [containerRef]);

  return { download, loading };
}
