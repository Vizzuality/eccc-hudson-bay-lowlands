import { useQuery } from "@tanstack/react-query";
import { GripVerticalIcon } from "lucide-react";
import type { FC } from "react";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import BasicLegend from "@/containers/map/legend/item/basic-legend";
import GradientLegend from "@/containers/map/legend/item/gradient-legend";
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
  className,
}) => {
  const { data: layer, isSuccess: isLayerSuccess } = useQuery({
    queryKey: queryKeys.layers.byId(id).queryKey,
    queryFn: () => API<LayerResponse>(getLayerConfig(id)),
    placeholderData: (prev) => prev,
  });
  const { getTranslation } = useApiTranslation();

  if (!isLayerSuccess) return null;

  const legendConfig = layer.config?.legend_config;
  if (!legendConfig) return null;

  const { type, items } = legendConfig;

  return (
    <Accordion type="single" defaultValue={`${id}`} asChild>
      <AccordionItem
        className={cn(
          "bg-background rounded-r-md pb-6 sticky top-0 z-10 border-t border-neutral-200 px-4",
          className,
        )}
        value={`${id}`}
        asChild
      >
        <section>
          <header className="flex items-center justify-between border-neutral-200 mb-4">
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
          {type === "basic" && <BasicLegend items={items} />}
          {type === "gradient" && <GradientLegend items={items} />}
        </section>
      </AccordionItem>
    </Accordion>
  );
};

export default MapLegendItem;
