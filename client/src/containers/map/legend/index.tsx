import { ArrowDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MapLegendItem from "@/containers/map/legend/item";

const MapLegend = () => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="absolute left-0 bottom-0"
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
        <div className="max-h-[500px] overflow-y-auto p-1.5">
          <MapLegendItem
            title="First nation locations"
            species={[
              { name: "Cree", color: "#C3551D" },
              { name: "Michif Piyii (Métis)", color: "#8A5E3D" },
              { name: "Dënéndeh", color: "#46C0CE" },
              { name: "Anishininiimowin (Oji-Cree)", color: "#9BB96A" },
              { name: "Anishinabewaki", color: "#436BFE" },
            ]}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MapLegend;
