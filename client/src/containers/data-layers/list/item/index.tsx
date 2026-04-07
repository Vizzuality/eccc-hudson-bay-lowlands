import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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

const getLayerCountText = (layers: Layer[]) => {
  return `${layers.length} layer${layers.length > 1 ? "s" : ""}`;
};
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
      <AccordionTrigger className="">
        <div className="flex items-center justify-between flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="flex items-center gap-2 shrink-0">
            {currentSelectedFromLayers.length > 0 ? (
              <span className="bg-accent text-white rounded-full text-xs font-bold py-0.5 px-2.5">
                {currentSelectedFromLayers.length}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {getLayerCountText(layers)}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <div className="ml-6 pl-2 border-l border-transparent group-data-[state=open]/item:border-accent transition-colors">
        <p className="px-5 text-xs text-muted-foreground font-medium">
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
          <div className="pl-5 pt-2">
            <Button
              variant="link"
              onClick={onLearnMore}
              className="gap-0.5 hover:gap-1.5 transition-[gap]"
            >
              {t("data-sources")}
              <ChevronRightIcon />
            </Button>
          </div>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
};

export default DataLayersListItem;
