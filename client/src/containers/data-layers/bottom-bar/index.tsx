import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataLayersBottomBarProps {
  activeDataCount: number;
  onRemoveAll: () => void;
}

const DataLayersBottomBar: FC<DataLayersBottomBarProps> = ({
  activeDataCount,
  onRemoveAll,
}) => {
  return (
    <section
      className={cn({
        "px-6 py-1 flex items-center justify-between absolute left-0 w-full bottom-0 z-20": true,
        "backdrop-blur-[10.5px] bg-linear-[340deg] from-[#EFF5F3] from-[13.58%] to-[rgba(255,255,255,0.10)] to-[76.73%]": true,
        hidden: activeDataCount === 0,
      })}
    >
      <p className="text-xs">Active data ({activeDataCount})</p>
      <Button
        variant="ghost"
        size="sm"
        className="text-2xs text-accent-foreground"
        onClick={onRemoveAll}
      >
        Remove all
      </Button>
    </section>
  );
};

export default DataLayersBottomBar;
