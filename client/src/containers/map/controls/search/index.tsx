import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { CONTROL_BUTTON_STYLES } from "@/containers/map/controls/constants";
import { cn } from "@/lib/utils";

const SearchControl = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleMouseEnter = () => setOpen(true);
    const handleMouseLeave = () => {
      setOpen(false);
    };

    node.addEventListener("mouseenter", handleMouseEnter);
    node.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      node.removeEventListener("mouseenter", handleMouseEnter);
      node.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      inputRef.current?.focus();
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  return (
    <div ref={containerRef} className="relative">
      <button
        className={cn({
          [CONTROL_BUTTON_STYLES.default]: true,
          [CONTROL_BUTTON_STYLES.hover]: true,
          [CONTROL_BUTTON_STYLES.active]: true,
        })}
        aria-label="Search"
        type="button"
        onClick={() => setOpen(!open)}
      >
        <SearchIcon />
      </button>

      <div
        className={cn(
          "absolute right-0 top-0 z-10 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search location..."
          className="bg-background text-foreground rounded-full h-9 min-w-[220px]"
          tabIndex={open ? 0 : -1}
        />
      </div>
    </div>
  );
};

export default SearchControl;
