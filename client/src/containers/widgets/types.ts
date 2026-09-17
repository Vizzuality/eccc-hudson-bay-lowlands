import type { WidgetId } from "@/containers/analysis/types";
import type { Layer } from "@/types";

export interface WidgetCardBaseProps {
  id: WidgetId;
}

export interface WidgetCardProps extends WidgetCardBaseProps {
  title: string;
  description?: React.ReactNode;
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  layers?: Layer[];
  onInfoButtonClick: () => void;
  onAddToMapButtonClick: () => void;
}
