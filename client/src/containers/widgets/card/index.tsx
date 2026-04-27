"use client";

import { DownloadIcon, InfoIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FC, useCallback } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WidgetCardProps } from "@/containers/widgets/types";
import { cn } from "@/lib/utils";

const WidgetCard: FC<WidgetCardProps> = ({
  id,
  title,
  description,
  children,
  icon,
  className,
  layers,
  onDowloadButtonClick,
  onInfoButtonClick,
  onAddToMapButtonClick,
}) => {
  const t = useTranslations("widgets.card");
  const { layerIds, setLayerIds } = useLayerIds();

  const handleAddToMap = useCallback(() => {
    if (layers?.length) {
      const widgetLayerIds = new Set(layers.map((l) => l.id));
      const anyOnMap = layers.some((l) => layerIds.includes(l.id));
      if (anyOnMap) {
        setLayerIds(layerIds.filter((lid) => !widgetLayerIds.has(lid)));
      } else {
        const merged = [...layerIds];
        for (const layerId of widgetLayerIds) {
          if (!merged.includes(layerId)) merged.push(layerId);
        }
        setLayerIds(merged);
      }
    } else {
      onAddToMapButtonClick();
    }
  }, [layers, layerIds, setLayerIds, onAddToMapButtonClick]);

  const addToMapDisabled = layers !== undefined && layers.length === 0;
  const isLayerSelected = layers?.some((layer) => layerIds.includes(layer.id));

  return (
    <Card id={id} className="group gap-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg leading-8 font-normal">{title}</h3>
          </div>
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDowloadButtonClick}
                  aria-label={t("download-image")}
                >
                  <DownloadIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("download-image")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onInfoButtonClick}
                  aria-label={t("more-info")}
                >
                  <InfoIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("more-info")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleAddToMap}
                  disabled={addToMapDisabled}
                  aria-label={t("add-to-map")}
                  className={cn(
                    "shrink-0 outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                    {
                      "size-8 rounded-full flex items-center justify-center hover:bg-secondary group-hover:text-accent cursor-pointer": true,
                      "bg-primary text-primary-foreground group-hover:bg-primary hover:bg-primary":
                        isLayerSelected,
                    },
                  )}
                >
                  {isLayerSelected ? (
                    <XIcon className="size-4" aria-hidden />
                  ) : (
                    <PlusIcon className="size-4" aria-hidden />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isLayerSelected ? t("remove-from-map") : t("add-to-map")}
              </TooltipContent>
            </Tooltip>
          </div>
        </CardTitle>
        {!!description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn("space-y-2", className)}>
        {children}
      </CardContent>
    </Card>
  );
};

const WidgetCardIcon: FC<{
  icon: React.ReactNode;
  backgroundColor: string;
}> = ({ icon, backgroundColor }) => (
  <div
    className="flex size-10 items-center justify-center rounded-full"
    style={{
      background: `linear-gradient(0deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.85) 100%), ${backgroundColor}`,
    }}
  >
    {icon}
  </div>
);

export { WidgetCard, WidgetCardIcon };
