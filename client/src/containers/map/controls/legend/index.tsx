"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import MapLegendItem from "@/containers/map/legend/item";
import { cn } from "@/lib/utils";
import { CONTROL_BUTTON_STYLES } from "../constants";

export default function LegendControl() {
  const [open, setOpen] = useState(false);
  const { layerIds } = useLayerIds();
  const t = useTranslations("legend");
  const tControl = useTranslations("map.controls.legend");

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={tControl("aria-label")}
          className={cn("lg:hidden", {
            [CONTROL_BUTTON_STYLES.default]: true,
            [CONTROL_BUTTON_STYLES.open]: open,
          })}
        >
          <InfoIcon className={CONTROL_BUTTON_STYLES.icon} />
        </button>
      </DrawerTrigger>
      <DrawerContent
        aria-describedby={undefined}
        className="rounded-t-3xl border-t-0 pb-6 lg:hidden"
      >
        <DrawerHeader className="p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle className="font-sans text-xl font-bold">
            {t("sheet-title")}
          </DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto">
          {layerIds.length === 0 && (
            <p className="px-4 text-sm text-muted-foreground">{t("empty")}</p>
          )}
          {layerIds.toReversed().map((id, index) => (
            <MapLegendItem
              key={`map-legend-sheet-item-${id}`}
              id={id}
              sortable={{ enabled: false }}
              className={cn("static rounded-none", {
                "border-t-0 pt-0 pb-4": index === 0,
                "py-4": index > 0,
              })}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
