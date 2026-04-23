import { DownloadIcon, InfoIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
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
  onDowloadButtonClick,
  onInfoButtonClick,
  onAddToMapButtonClick,
}) => {
  const t = useTranslations("widgets.card");
  return (
    <Card id={id} className="gap-2">
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddToMapButtonClick}
                  aria-label={t("add-to-map")}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("add-to-map")}</TooltipContent>
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
