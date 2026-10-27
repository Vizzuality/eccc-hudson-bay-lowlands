import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DateItem from "@/containers/data-layers/list/item/date-item";
import LayerItem from "@/containers/data-layers/list/item/layer-item";
import { useApiTranslation } from "@/i18n/api-translation";
import type { Layer } from "@/types";

export interface DataLayersListItemProps {
  id: number;
  title: string;
  description: string;
  layers: Layer[];
  onLearnMore: () => void;
}

const getGroupedDateLayers = (layers: Layer[]) => {
  const dateLayers = layers.filter((layer) => layer.unit === "date");
  const daysLayers = layers.filter((layer) => layer.unit === "days");

  return {
    dateLayers,
    daysLayers,
  };
};

const DataLayersListItem: FC<DataLayersListItemProps> = ({
  id,
  layers,
  title,
  description,
  onLearnMore,
}) => {
  const { layerIds: selectedLayerIds } = useLayerIds();
  const { getTranslation } = useApiTranslation();
  const t = useTranslations("data-layers.item");
  const currentSelectedFromLayers = layers.filter((layer) =>
    selectedLayerIds.includes(layer.id),
  );
  const isDateLayers = layers.every(
    (layer) => layer.unit === "date" || layer.unit === "days",
  );

  return (
    <AccordionItem value={id.toString()} className="border-none group/item">
      <AccordionTrigger
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onLearnMore}
                aria-label={t("about-dataset")}
                className="text-muted-foreground hover:text-accent"
              >
                <InfoIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("about-dataset")}</TooltipContent>
          </Tooltip>
        }
      >
        <div className="flex items-center justify-between flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {currentSelectedFromLayers.length > 0 ? (
              <>
                <span className="text-accent font-bold">
                  {currentSelectedFromLayers.length}
                </span>{" "}
                /{" "}
              </>
            ) : null}
            {t("layer-count", { count: layers.length })}
          </span>
        </div>
      </AccordionTrigger>
      <div className="ml-6 pl-2 border-l border-transparent group-data-[state=open]/item:border-accent transition-colors">
        <p className="px-5 text-sm text-muted-foreground font-medium">
          {description}
        </p>
        <AccordionContent>
          {isDateLayers
            ? Object.entries(getGroupedDateLayers(layers)).map(
                ([key, layers]) => (
                  <DateItem
                    key={`list-layer-item-grouped-${key}`}
                    layers={layers}
                  />
                ),
              )
            : layers.map((layer) => (
                <LayerItem
                  key={`list-layer-item-${layer.id}`}
                  id={layer.id}
                  title={getTranslation(layer.metadata.title)}
                  description={getTranslation(layer.metadata.description)}
                />
              ))}
        </AccordionContent>
      </div>
    </AccordionItem>
  );
};

export default DataLayersListItem;
