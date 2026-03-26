import { DownloadIcon, InfoIcon, PlusIcon } from "lucide-react";
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

const WidgetCard: FC<WidgetCardProps> = ({
  id,
  title,
  description,
  children,
  icon,
  onDowloadButtonClick,
  onInfoButtonClick,
  onAddToMapButtonClick,
}) => {
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
                  aria-label="Download image"
                >
                  <DownloadIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download image</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onInfoButtonClick}
                  aria-label="More info"
                >
                  <InfoIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>More info</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddToMapButtonClick}
                  aria-label="Add to map"
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add to map</TooltipContent>
            </Tooltip>
          </div>
        </CardTitle>
        {!!description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
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
