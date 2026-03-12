import { useQuery } from "@tanstack/react-query";
import { GripVerticalIcon } from "lucide-react";
import type { FC } from "react";
import { Separator } from "@/components/ui/separator";
import LegendItemToolbar from "@/containers/map/legend/item/toolbar";
import type { MapLegendItemProps } from "@/containers/map/legend/types";
import { useApiTranslation } from "@/i18n/api-translation";
import { API } from "@/lib/api";
import { getLayerConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { LayerResponse } from "@/types";

const MapLegendItem: FC<MapLegendItemProps> = ({
  id,
  // sortable
  sortable,
  // attributes,
  listeners,
  // settings
  settingsManager,
  settings,
  // components
  InfoContent,
  // events
  onChangeOpacity,
  onChangeVisibility,
  onRemove,
}) => {
  const { data: layer, isSuccess: isLayerSuccess } = useQuery({
    queryKey: queryKeys.layers.byId(Number(id)).queryKey,
    queryFn: () => API<LayerResponse>(getLayerConfig(Number(id))),
  });
  const { getTranslation } = useApiTranslation();

  if (!isLayerSuccess) return null;

  return (
    <section className="bg-background">
      <header className="flex items-center justify-between">
        <div
          className={cn({
            "relative flex items-start space-x-0.5": true,
            "-ml-1": sortable?.handle,
          })}
        >
          {sortable?.handle && (
            <button
              aria-label="drag"
              type="button"
              className="text-navy-700 hover:text-navy-700/50 mt-0.5 cursor-pointer transition-colors"
              {...listeners}
            >
              <GripVerticalIcon className="text-muted-foreground h-4 w-4" />
            </button>
          )}
          <h2 className="text-muted-foreground uppercase">
            {getTranslation(layer.metadata.title)}
          </h2>
        </div>
        <LegendItemToolbar
          id={id}
          settings={settings}
          settingsManager={settingsManager}
          onChangeOpacity={onChangeOpacity}
          onChangeVisibility={onChangeVisibility}
          onRemove={onRemove}
          InfoContent={InfoContent}
        />
      </header>
      <div className="flex gap-1 flex-wrap">
        {/* {species.map(({ name, color }) => (
          <div key={name} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{name}</span>
          </div>
        ))} */}
      </div>
      <Separator className="mt-6" />
    </section>
  );
};

export default MapLegendItem;
