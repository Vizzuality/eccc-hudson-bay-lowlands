import { EyeIcon, XIcon } from "lucide-react";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type MapLegendItemProps = {
  title: string;
  species: { name: string; color: string }[];
};

const MapLegendItem: FC<MapLegendItemProps> = ({ title, species }) => {
  return (
    <section>
      <header className="flex items-center justify-between">
        <h2 className="text-muted-foreground uppercase">{title}</h2>
        <div>
          <Button type="button" size="icon" variant="ghost">
            <EyeIcon aria-hidden />
          </Button>
          <Button type="button" size="icon" variant="ghost">
            <XIcon aria-hidden />
          </Button>
        </div>
      </header>
      <div className="flex gap-1 flex-wrap">
        {species.map(({ name, color }) => (
          <div key={name} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{name}</span>
          </div>
        ))}
      </div>
      <Separator className="mt-6" />
    </section>
  );
};

export default MapLegendItem;
