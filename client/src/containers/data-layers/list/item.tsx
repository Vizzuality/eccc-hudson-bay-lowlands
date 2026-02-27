import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { useLayers } from "@/app/[locale]/url-store";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import LayerItem from "@/containers/data-layers/list/layer-item";
import { useApiTranslation } from "@/i18n/api-translation";
import type { Layer } from "@/types";

export interface DataLayersListItemProps {
  id: number;
  title: string;
  description: string;
  layers: Layer[];
  onChange: (id: number, isSelected: boolean) => void;
  onLearnMore: () => void;
}

const getLayerCountText = (layers: Layer[]) => {
  return `${layers.length} layer${layers.length > 1 ? "s" : ""}`;
};

const DataLayersListItem: FC<DataLayersListItemProps> = ({
  id,
  layers,
  title,
  description,
  onChange,
  onLearnMore,
}) => {
  const { layers: selectedLayers } = useLayers();
  const { getTranslation } = useApiTranslation();
  const t = useTranslations("data-layers.item");
  const currentSelectedFromLayers = layers.filter((layer) =>
    selectedLayers.includes(layer.id),
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
      <div className="ml-6 border-l border-transparent group-data-[state=open]/item:border-accent transition-colors">
        <p className="px-5 text-xs text-muted-foreground font-medium">
          {description}
        </p>
        <AccordionContent>
          {layers.map((layer) => (
            <LayerItem
              key={layer.id}
              id={layer.id}
              title={getTranslation(layer.metadata.title)}
              description={getTranslation(layer.metadata.description)}
              isSelected={selectedLayers.includes(layer.id)}
              onChange={onChange}
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
