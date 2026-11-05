import Image from "next/image";
import { useTargetRects } from "@/containers/tour/use-target-rect";

const MIN_SIZE = 28;

export function Hotspots({ selector }: { selector: string }) {
  const rects = useTargetRects(selector);

  return rects.map((rect) => {
    const size = Math.max(MIN_SIZE, rect.width, rect.height);
    return (
      <Image
        key={`tour-hotspot-${rect.key}`}
        src="/images/tour-hotspot.svg"
        alt=""
        aria-hidden
        width={size}
        height={size}
        className="pointer-events-none fixed z-50 animate-pulse motion-reduce:animate-none"
        style={{
          top: rect.top + rect.height / 2 - size / 2,
          left: rect.left + rect.width / 2 - size / 2,
        }}
      />
    );
  });
}
