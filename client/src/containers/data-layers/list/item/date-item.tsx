import { CalendarIcon } from "lucide-react";
import { type FC, useState } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ItemContainer from "@/containers/data-layers/list/item/item-container";
import ItemHeader from "@/containers/data-layers/list/item/item-header";
import { useApiTranslation } from "@/i18n/api-translation";
import type { Layer } from "@/types";

interface DateItemProps {
  layers: Layer[];
}

// Temporary start year until API is updated
const START_YEAR = 2018;

const DateItem: FC<DateItemProps> = ({ layers }) => {
  const { getTranslation } = useApiTranslation();
  const { layerIds, setLayerIds } = useLayerIds();
  const indexFromLayers = layers.findIndex((layer) =>
    layerIds.includes(layer.id),
  );
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(
    indexFromLayers > -1 ? indexFromLayers : 0,
  );
  const selectedLayer = layers[selectedLayerIndex];
  const isLayerVisible = layerIds.includes(selectedLayer?.id);

  console.info({ selectedLayerIndex, isLayerVisible });

  return (
    <ItemContainer>
      <ItemHeader
        id={selectedLayer?.id}
        title={getTranslation(selectedLayer.metadata.title)}
        description={getTranslation(selectedLayer.metadata.description)}
      />
      <section className="flex items-center gap-2 group-hover:translate-x-2 px-5 pb-4">
        <CalendarIcon className="size-4 text-muted-foreground" />
        <RadioGroup
          defaultValue={selectedLayer.id.toString()}
          className="flex flex-wrap gap-1"
          value={selectedLayerIndex.toString()}
          onValueChange={(index) => {
            const newLayerIndex = Number(index);
            const newLayerId = layers[newLayerIndex].id;

            if (isLayerVisible) {
              setLayerIds((currentLayerIds) => {
                const withoutSelected = currentLayerIds.filter(
                  (layerId) => layerId !== selectedLayer.id,
                );
                return [...withoutSelected, newLayerId];
              });
            }
            setSelectedLayerIndex(Number(index));
          }}
        >
          {layers
            .map((layer, index) => ({
              ...layer,
              year: [START_YEAR + index, START_YEAR + index + 1],
            }))
            .map(({ id, year: [startYear, endYear] }, index) => (
              <FieldLabel
                key={`date-item-layer-${startYear}-${endYear}`}
                htmlFor={`date-item-layer-${id}-${startYear}-${endYear}`}
                className="w-auto! cursor-pointer rounded-full bg-secondary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground"
              >
                <Field orientation="horizontal" className="px-2.5! py-0!">
                  <FieldContent>
                    <FieldTitle className="text-2xs font-bold">
                      {startYear} - {endYear}
                    </FieldTitle>
                  </FieldContent>
                  <RadioGroupItem
                    value={index.toString()}
                    id={`date-item-layer-${id}-${startYear}-${endYear}`}
                    className="hidden"
                  />
                </Field>
              </FieldLabel>
            ))}
        </RadioGroup>
      </section>
    </ItemContainer>
  );
};
export default DateItem;
