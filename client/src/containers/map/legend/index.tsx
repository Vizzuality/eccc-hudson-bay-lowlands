import { ArrowDownIcon } from "lucide-react";
import {
  Children,
  type FC,
  isValidElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import SortableList from "@/containers/map/legend/sortable/list";
import type { MapLegendProps } from "@/containers/map/legend/types";
import { cn } from "@/lib/utils";

const MapLegend: FC<MapLegendProps> = ({
  children,
  sortable,
  onChangeOrder,
}) => {
  const [open, setOpen] = useState(false);
  const isChildren = useMemo(() => {
    return !!Children.count(
      Children.toArray(children).filter((c) => isValidElement(c)),
    );
  }, [children]);

  useEffect(() => {
    setOpen(isChildren);
  }, [isChildren]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("absolute left-0 bottom-0", {
        hidden: !isChildren,
      })}
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="group relative rounded-md top-px w-fit justify-between rounded-b-none px-2.5 font-sans"
        >
          <ArrowDownIcon
            aria-hidden
            className="group-data-[state=closed]:rotate-180"
          />
          <span className="block group-data-[state=open]:hidden">legend</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="w-[280px] rounded-tr-4xl bg-background text-foreground">
        {isChildren && open && (
          <div className="max-h-[500px] overflow-y-auto">
            <div className="bg-popover text-popover-foreground flex h-full flex-col">
              {!!sortable.enabled && !!onChangeOrder && (
                <SortableList sortable={sortable} onChangeOrder={onChangeOrder}>
                  {children}
                </SortableList>
              )}

              {!sortable.enabled && children}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MapLegend;
